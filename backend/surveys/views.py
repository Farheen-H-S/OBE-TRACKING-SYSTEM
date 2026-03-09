from rest_framework import generics, status, permissions
from audit.utils import log_action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import SurveyMaster, SurveyResponse, SurveyAnswer, SurveyQuestion
from .serializers import SurveyMasterSerializer, SurveyResponseSerializer
from .report_generator import SurveyExcelReportGenerator
from django.http import HttpResponse

class SurveyMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = SurveyMasterSerializer

    def get_queryset(self):
        queryset = SurveyMaster.objects.all().order_by('-survey_id')
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

        # 3. Process Matrix Data (Teachers x Statements)
        questions = SurveyQuestion.objects.filter(survey_id=survey_id)
        
        # Identify unique statements and teacher names
        unique_statements = []
        teacher_names = set()
        
        q_map = {} # question_id -> {statement, teacher}
        for q in questions:
            parts = q.question_text.split('|')
            if len(parts) >= 2:
                t_name = parts[0].strip()
                stmt = parts[1].strip()
                teacher_names.add(t_name)
                if stmt not in unique_statements:
                    unique_statements.append(stmt)
                q_map[q.question_id] = {'statement': stmt, 'teacher': t_name}
            else:
                # Handle non-matrix questions if any
                stmt = q.question_text.strip()
                if stmt not in unique_statements:
                    unique_statements.append(stmt)
                q_map[q.question_id] = {'statement': stmt, 'teacher': 'General'}
                teacher_names.add('General')

        # Aggregate scores
        from collections import defaultdict
        # teacher_scores[teacher][statement] = [scores...]
        teacher_scores = defaultdict(lambda: defaultdict(list))
        
        for res in responses.prefetch_related('answers'):
            for ans in res.answers.all():
                q_info = q_map.get(ans.question_id_id)
                if q_info:
                    teacher_scores[q_info['teacher']][q_info['statement']].append(ans.answer_value)

        # Build Individual Responses List for simple viewing (like Course Exit Survey)
        responses_list = []
        for res in responses.prefetch_related('answers'):
            res_item = {
                'id': res.response_id,
                'enrollment': res.enrollment_no or (res.student_id.enrollment_no if res.student_id else "N/A"),
                'roll_no': res.student_id.roll_no if res.student_id else "N/A",
                'name': res.respondent_name or (res.student_id.name if res.student_id else "Guest"),
                'submitted_at': res.submitted_at,
                'answers': {ans.question_id_id: ans.answer_value for ans in res.answers.all()}
            }
            responses_list.append(res_item)

        # Build Teacher Matrix (only if it looks like a teacher feedback survey)
        teacher_data = []
        if any('|' in q.question_text for q in questions):
            for t_name in teacher_names:
                row = {'teacher': t_name, 'scores': {}, 'achieved_score': 0}
                total_sum = 0
                count = 0
                for stmt in unique_statements:
                    scores = teacher_scores[t_name].get(stmt, [])
                    if scores:
                        avg = round(sum(scores) / len(scores), 2)
                        row['scores'][stmt] = avg
                        total_sum += avg
                        count += 1
                    else:
                        row['scores'][stmt] = "N/A"
                
                if count > 0:
                    row['achieved_score'] = round(total_sum / count, 2)
                else:
                    row['achieved_score'] = 0
                
                teacher_data.append(row)

            # Sort teachers descending by achieved score
            teacher_data.sort(key=lambda x: x['achieved_score'], reverse=True)

        return Response({
            'survey': SurveyMasterSerializer(survey).data,
            'statements': unique_statements if teacher_data else [
                {'id': q.question_id, 'co_id': q.co_id_id, 'co_number': q.co_id.co_number if q.co_id else f"Q{q.question_id}"} 
                for q in questions
            ],
            'responses': responses_list,
            'teachers': teacher_data,
            'total_responses': responses.count()
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


class SurveyExportView(APIView):
    def get(self, request, pk):
        survey = get_object_or_404(SurveyMaster, pk=pk)
        
        # This re-uses logic from SurveyStatsView to get data for Excel
        # Ideally this should be a shared service/utility
        
        # 1. Get responders
        responses = SurveyResponse.objects.filter(survey_id=survey).select_related('student_id')
        
        # 2. Filter responses (optional filters from query params)
        batch_id = request.query_params.get('batch_id')
        academic_year = request.query_params.get('academic_year')
        
        if batch_id: responses = responses.filter(student_id__batch_id=batch_id)
        if academic_year: responses = responses.filter(student_id__academic_year=academic_year)

        # 3. Process Matrix Data (Teachers x Statements)
        questions = SurveyQuestion.objects.filter(survey_id=pk)
        
        unique_statements = []
        teacher_names = set()
        q_map = {}
        
        for q in questions:
            parts = q.question_text.split('|')
            if len(parts) >= 2:
                t_name = parts[0].strip()
                stmt = parts[1].strip()
                teacher_names.add(t_name)
                if stmt not in unique_statements:
                    unique_statements.append(stmt)
                q_map[q.question_id] = {'statement': stmt, 'teacher': t_name}
            else:
                stmt = q.question_text.strip()
                if stmt not in unique_statements:
                    unique_statements.append(stmt)
                q_map[q.question_id] = {'statement': stmt, 'teacher': 'General'}
                teacher_names.add('General')

        from collections import defaultdict
        teacher_scores = defaultdict(lambda: defaultdict(list))
        for res in responses.prefetch_related('answers'):
            for ans in res.answers.all():
                q_info = q_map.get(ans.question_id_id)
                if q_info:
                    teacher_scores[q_info['teacher']][q_info['statement']].append(ans.answer_value)

        teacher_data = []
        for t_name in teacher_names:
            row = {'teacher': t_name, 'scores': {}, 'achieved_score': 0}
            total_sum = 0
            count = 0
            for stmt in unique_statements:
                scores = teacher_scores[t_name].get(stmt, [])
                if scores:
                    avg = round(sum(scores) / len(scores), 2)
                    row['scores'][stmt] = avg
                    total_sum += avg
                    count += 1
                else:
                    row['scores'][stmt] = "-"
            
            row['achieved_score'] = round(total_sum / count, 2) if count > 0 else 0
            teacher_data.append(row)

        teacher_data.sort(key=lambda x: x['achieved_score'], reverse=True)

        data = {
            'survey': SurveyMasterSerializer(survey).data,
            'statements': unique_statements,
            'teachers': teacher_data,
            'total_responses': responses.count()
        }

        excel_buffer = SurveyExcelReportGenerator.generate(data)
        
        filename = f"Feedback_Report_{survey.survey_name.replace(' ', '_')}.xlsx"
        response = HttpResponse(
            excel_buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
