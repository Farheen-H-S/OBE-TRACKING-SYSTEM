from rest_framework import generics, status, permissions
from audit.utils import log_action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import SurveyMaster, SurveyResponse, SurveyAnswer, SurveyQuestion
from .serializers import SurveyMasterSerializer, SurveyResponseSerializer

class SurveyMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = SurveyMasterSerializer

    def get_queryset(self):
        queryset = SurveyMaster.objects.filter(is_active=True).order_by('-survey_id')
        category = self.request.query_params.get('survey_category')
        program_id = self.request.query_params.get('program_id')
        academic_year = self.request.query_params.get('academic_year')
        course_id = self.request.query_params.get('course_id')
        status = self.request.query_params.get('status')

        if category: queryset = queryset.filter(survey_category=category)
        if program_id and program_id != 'null': queryset = queryset.filter(program_id=program_id)
        if academic_year: queryset = queryset.filter(academic_year=academic_year)
        if course_id: queryset = queryset.filter(course_id=course_id)
        if status: queryset = queryset.filter(status=status)
        
        return queryset

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
        
        if student and not request.data.get('enrollment_no'):
            enrollment_no = student.enrollment_no
        else:
            enrollment_no = request.data.get('enrollment_no')

        response = SurveyResponse.objects.create(
            survey_id=survey,
            student_id=student,
            respondent_name=request.data.get('respondent_name') or (student.name if student else None),
            enrollment_no=enrollment_no
        )
        
        for ans in answers:
            question_id = ans.get('question_id')
            
            if not question_id:
                po_number = ans.get('po_number')
                pso_number = ans.get('pso_number')
                co_id = ans.get('co_id')
                
                if po_number:
                    question = SurveyQuestion.objects.filter(survey_id=survey, po_id__po_number=po_number).first()
                    if question: question_id = question.question_id
                elif pso_number:
                    question = SurveyQuestion.objects.filter(survey_id=survey, pso_id__pso_number=pso_number).first()
                    if question: question_id = question.question_id
                elif co_id:
                    question, created = SurveyQuestion.objects.get_or_create(
                        survey_id=survey,
                        co_id_id=co_id,
                        defaults={'question_text': f"Evaluation for CO {co_id}"}
                    )
                    question_id = question.question_id

            if question_id:
                SurveyAnswer.objects.create(
                    response_id=response,
                    question_id_id=question_id,
                    answer_value=ans.get('answer_value')
                )
        
        log_action(request.user, 'CREATE', 'SurveyResponse', survey.survey_id, remark=f"Survey submitted for {survey.survey_name}")
        return Response({"message": "Survey submitted successfully"}, status=status.HTTP_201_CREATED)

import re
def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split('([0-9]+)', str(s))]

class SurveyStatsView(APIView):
    def get(self, request, survey_id):
        survey = get_object_or_404(SurveyMaster, pk=survey_id)
        course = survey.course_id
        
        from users.models import Student
        
        # 1. Get responders
        responses = SurveyResponse.objects.filter(survey_id=survey).select_related('student_id')
        
        # 2. Fetch responses with filters
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
        
        # 3. Get expected students
        expected_students = Student.objects.filter(program_id=survey.program_id, is_active=True)
        if batch_id: expected_students = expected_students.filter(batch_id=batch_id)
        if academic_year: expected_students = expected_students.filter(academic_year=academic_year)
        if class_year: expected_students = expected_students.filter(class_year=class_year)
        if semester: expected_students = expected_students.filter(semester=semester)
        if division: expected_students = expected_students.filter(division=division)
        
        expected_students_ids = expected_students.values_list('student_id', flat=True)
        all_student_ids = list(set(responder_ids) | set(expected_students_ids))

        # Fetch full student objects and sort naturally
        students = list(Student.objects.filter(student_id__in=all_student_ids))
        students.sort(key=lambda x: natural_sort_key(x.roll_no or ""))
        
        response_map = {r.student_id_id: r for r in responses if r.student_id_id}
        
        student_data = []
        for student in students:
            res = response_map.get(student.student_id)
            answers_map = {}
            if res:
                for ans in res.answers.all().select_related('question_id', 'question_id__co_id'):
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
        # Instead of just default statements, fetch the actual SurveyQuestions which might have been customized
        questions = SurveyQuestion.objects.filter(survey_id=survey_id).select_related('co_id', 'po_id', 'pso_id')
        
        statements = []
        for q in questions:
            stmt = {
                'question_id': q.question_id,
                'question_text': q.question_text
            }
            if q.co_id:
                stmt['id'] = q.co_id.co_id
                stmt['number'] = q.co_id.co_number
                stmt['type'] = 'CO'
            elif q.po_id:
                stmt['id'] = q.po_id.po_number
                stmt['number'] = q.po_id.po_number
                stmt['type'] = 'PO'
            elif q.pso_id:
                stmt['id'] = q.pso_id.pso_number
                stmt['number'] = q.pso_id.pso_number
                stmt['type'] = 'PSO'
            else:
                continue # Skip if no relation
            statements.append(stmt)

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
