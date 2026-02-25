from rest_framework import generics, status
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

class SubmitSurveyResponseView(APIView):
    def post(self, request):
        survey_id = request.data.get('survey_id')
        student_id = request.data.get('student_id')
        answers = request.data.get('answers', []) # List of {question_id: X, answer_value: Y}
        
        survey = get_object_or_404(SurveyMaster, pk=survey_id)
        
        from users.models import Student
        student = None
        if student_id:
            student = Student.objects.filter(enrollment_no=student_id).first()
        
        response = SurveyResponse.objects.create(
            survey_id=survey,
            student_id=student,
            respondent_name=request.data.get('respondent_name'),
            enrollment_no=request.data.get('enrollment_no')
        )
        
        for ans in answers:
            co_id = ans.get('co_id')
            question_id = ans.get('question_id')
            
            # If front-end sends co_id (common in current student UI), find or create a question
            if co_id and not question_id:
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
        if program and (course and course.semester):
            expected_students_ids = list(Student.objects.filter(
                program_id=program,
                semester=course.semester,
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
                for ans in res.answers.all().select_related('question_id', 'question_id__co_id'):
                    co_id = None
                    if ans.question_id and ans.question_id.co_id:
                        co_id = ans.question_id.co_id.co_id
                    
                    if co_id:
                        answers_map[co_id] = ans.answer_value
            
            data.append({
                'enrollment': student.enrollment_no,
                'roll_no': student.roll_no,
                'name': student.name,
                'respondent_name': res.respondent_name if res else None,
                'answers': answers_map
            })
            
        return Response(data, status=status.HTTP_200_OK)
