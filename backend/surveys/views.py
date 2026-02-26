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
        
        # 2. Fetch responses - Allow filtering by student data if provided
        responses = SurveyResponse.objects.filter(survey_id=survey_id)
        
        batch_id = request.query_params.get('batch_id')
        academic_year = request.query_params.get('academic_year')
        class_year = request.query_params.get('class_year')
        semester = request.query_params.get('semester')
        division = request.query_params.get('division')
        
        if any([batch_id, academic_year, class_year, semester, division]):
            if batch_id: responses = responses.filter(student_id__batch_id=batch_id)
            if academic_year: responses = responses.filter(student_id__academic_year=academic_year)
            if class_year: responses = responses.filter(student_id__class_year=class_year)
            if semester: responses = responses.filter(student_id__semester=semester)
            if division: responses = responses.filter(student_id__division=division)

        responder_ids = responses.values_list('student_id', flat=True)
        
        # 3. Get expected students for this survey's program (and filters)
        expected_students = Student.objects.filter(program_id=survey.program_id, is_active=True)
        if batch_id: expected_students = expected_students.filter(batch_id=batch_id)
        if academic_year: expected_students = expected_students.filter(academic_year=academic_year)
        if class_year: expected_students = expected_students.filter(class_year=class_year)
        if semester: expected_students = expected_students.filter(semester=semester)
        if division: expected_students = expected_students.filter(division=division)
        
        expected_students_ids = expected_students.values_list('student_id', flat=True)
        all_student_ids = list(set(responder_ids) | set(expected_students_ids))

        
        # Fetch full student objects
        students = Student.objects.filter(student_id__in=all_student_ids).order_by('roll_no')
        
        # If still no students (e.g. brand new survey, mismatching data), 
        # fallback to just responders if any, else empty.
        # But we already included responder_ids.
        
        # ... existing student fetch logic ...
        response_map = {r.enrollment_no: r for r in responses}
        
        student_data = []
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
            
            student_data.append({
                'enrollment': student.enrollment_no,
                'roll_no': student.roll_no,
                'name': student.name,
                'respondent_name': res.respondent_name if res else None,
                'answers': answers_map
            })

        # 4. Fetch Question Statements
        from academics.models import CO, PO, PSO
        from academics.serializers import COSerializer, POSerializer, PSOSerializer
        
        statements = []
        if survey.course_id:
            cos = CO.objects.filter(course_id=survey.course_id)
            s_data = COSerializer(cos, many=True).data
            for s in s_data:
                s['id'] = s['co_id']
                s['number'] = s['co_number']
                statements.append(s)
        elif program:
            pos = PO.objects.filter(program_id=program)
            psos = PSO.objects.filter(program_id=program)
            po_data = POSerializer(pos, many=True).data
            pso_data = PSOSerializer(psos, many=True).data
            for p in po_data:
                p['id'] = p['po_number']
                p['number'] = p['po_number']
                statements.append(p)
            for p in pso_data:
                p['id'] = p['pso_number']
                p['number'] = p['pso_number']
                statements.append(p)

        return Response({
            'survey': SurveyMasterSerializer(survey).data,
            'statements': statements,
            'responses': student_data
        }, status=status.HTTP_200_OK)


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
