from rest_framework import generics, status, permissions
from audit.utils import log_action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import SurveyMaster, SurveyResponse, SurveyAnswer, SurveyQuestion
from .serializers import SurveyMasterSerializer, SurveyResponseSerializer

class SurveyMasterListCreateView(generics.ListCreateAPIView):
    queryset = SurveyMaster.objects.all()
    serializer_class = SurveyMasterSerializer

class SurveyMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SurveyMaster.objects.all()
    serializer_class = SurveyMasterSerializer
    permission_classes = [permissions.AllowAny]

class SubmitSurveyResponseView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        survey_id = request.data.get('survey_id')
        student_id = request.data.get('student_id')
        answers = request.data.get('answers', []) # List of {question_id: X, answer_value: Y}
        
        survey = get_object_or_404(SurveyMaster, pk=survey_id)
        
        from users.models import Student
        student = None
        if not student_id and request.data.get('enrollment_no'):
            student = Student.objects.filter(enrollment_no=request.data.get('enrollment_no')).first()
        elif student_id:
            student = Student.objects.filter(enrollment_no=student_id).first()
        
        response = SurveyResponse.objects.create(
            survey_id=survey,
            student_id=student,
            respondent_name=request.data.get('respondent_name'),
            enrollment_no=request.data.get('enrollment_no')
        )
        
        for ans in answers:
            question_id = ans.get('question_id')
            po_number = ans.get('po_number')
            pso_number = ans.get('pso_number')
            
            if not question_id:
                if po_number:
                    question = SurveyQuestion.objects.filter(survey_id=survey, po_id__po_number=po_number).first()
                    if question: question_id = question.question_id
                elif pso_number:
                    question = SurveyQuestion.objects.filter(survey_id=survey, pso_id__pso_number=pso_number).first()
                    if question: question_id = question.question_id
                elif ans.get('co_id'):
                    co_id = ans.get('co_id')
                    question, created = SurveyQuestion.objects.get_or_create(
                        survey_id=survey,
                        co_id_id=co_id,
                        defaults={'question_text': f"Evaluation for CO {co_id}"}
                    )
                    question_id = question.question_id

            SurveyAnswer.objects.create(
                response_id=response,
                question_id_id=question_id,
                answer_value=ans.get('answer_value')
            )
        
        log_action(request.user, 'CREATE', 'SurveyResponse', survey.survey_id, remark=f"Survey submitted for {survey.survey_name}")
        return Response({"message": "Survey submitted successfully"}, status=status.HTTP_201_CREATED)

class SurveyStatsView(APIView):
    def get(self, request, survey_id):
        survey = get_object_or_404(SurveyMaster, pk=survey_id)
        course = survey.course_id
        program = survey.program_id or (course.program_id if course else None)
        
        from users.models import Student
        
        # 1. Get students who actually responded
        responses = SurveyResponse.objects.filter(survey_id=survey).select_related('student_id')
        responder_ids = [r.student_id_id for r in responses if r.student_id_id]
        
        # 2. Get students expected based on current program and semester
        expected_students_ids = []
        target_semester = survey.semester or (course.semester if course else None)
        if program and target_semester:
            expected_students_ids = list(Student.objects.filter(
                program_id=program,
                semester=target_semester,
                is_active=True
            ).values_list('student_id', flat=True))
        elif program:
             # For program-level surveys (Alumni, Exit)
             expected_students_ids = list(Student.objects.filter(
                program_id=program,
                is_active=True
            ).values_list('student_id', flat=True))
        
        # 3. Combine both lists
        all_student_ids = list(set(responder_ids) | set(expected_students_ids))
        
        # Fetch full student objects
        students = Student.objects.filter(student_id__in=all_student_ids).order_by('roll_no')
        
        # If still no students (e.g. brand new survey, mismatching data), 
        # fallback to just responders if any, else empty.
        # But we already included responder_ids.
        
        response_map = {r.student_id.enrollment_no if r.student_id else None: r for r in responses}
        
        data = []
        for student in students:
            res = response_map.get(student.enrollment_no)
            answers_map = {}
            if res:
                for ans in res.answers.all().select_related('question_id', 'question_id__co_id', 'question_id__po_id', 'question_id__pso_id'):
                    key = None
                    if ans.question_id:
                        if ans.question_id.co_id:
                            key = ans.question_id.co_id.co_id
                        elif ans.question_id.po_id:
                            key = ans.question_id.po_id.po_number
                        elif ans.question_id.pso_id:
                            key = ans.question_id.pso_id.pso_number
                    
                    if key:
                        answers_map[key] = ans.answer_value
            
            data.append({
                'enrollment': student.enrollment_no,
                'roll_no': student.roll_no,
                'name': student.name,
                'respondent_name': res.respondent_name if res else None,
                'answers': answers_map
            })
            
        return Response(data, status=status.HTTP_200_OK)


class SurveyLookupView(APIView):
    permission_classes = [permissions.AllowAny]
    """Return surveys matching activity_type + program for dropdown population."""
    def get(self, request):
        activity_type = request.query_params.get('activity_type')
        program_id = request.query_params.get('program_id')
        if not activity_type or not program_id:
            return Response([], status=status.HTTP_200_OK)

        surveys = SurveyMaster.objects.filter(
            activity_type=activity_type,
            program_id=program_id,
            survey_category='indirect',
        ).exclude(
            survey_name__icontains='Resource Person'
        ).order_by('-survey_id')

        data = [{
            'survey_id': s.survey_id,
            'survey_name': s.survey_name,
            'activity_title': s.activity_title,
            'conducted_date': s.conducted_date,
            'resource_person_name': s.resource_person_name,
            'resource_person_designation': s.resource_person_designation,
            'resource_person_company': s.resource_person_company,
            'resource_person_address': s.resource_person_address,
            'academic_year': s.academic_year,
        } for s in surveys]

        return Response(data, status=status.HTTP_200_OK)
