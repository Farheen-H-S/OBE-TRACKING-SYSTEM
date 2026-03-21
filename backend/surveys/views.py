from rest_framework import generics, status, permissions
from django.db.models import Q
from audit.utils import log_action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import SurveyMaster, SurveyResponse, SurveyAnswer, SurveyQuestion
from .serializers import SurveyMasterSerializer, SurveyResponseSerializer
from .report_generator import SurveyExcelReportGenerator
from django.http import HttpResponse

class CheckSurveyParticipationView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        enrollment_no = request.query_params.get('enrollment_no', '').strip()
        survey_id = request.query_params.get('survey_id')
        course_id = request.query_params.get('course_id')

        if not enrollment_no:
            return Response({"error": "Enrollment number is required"}, status=400)

        filters = Q(enrollment_no=enrollment_no)
        if survey_id:
            filters &= Q(survey_id=survey_id)
        elif course_id:
            # For CIS, we look for ALL approved surveys for this course
            approved_surveys = SurveyMaster.objects.filter(course_id=course_id, status='APPROVED')
            if not approved_surveys.exists():
                return Response({"responded": False, "message": "No active survey found"})
            filters &= Q(survey_id__in=approved_surveys)
        else:
            return Response({"error": "survey_id or course_id is required"}, status=400)

        exists = SurveyResponse.objects.filter(filters).exists()
        return Response({"responded": exists})

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
        enrollment_no_from_payload = request.data.get('enrollment_no') or request.data.get('student_id')

        # 1. Always prioritize explicitly provided enrollment number (entered by the student on the login page)
        #    This prevents logged-in faculty/HOD session from overriding the actual student's identity.
        if enrollment_no_from_payload:
            student = Student.objects.filter(enrollment_no=enrollment_no_from_payload).first()
            if not student:
                # Hard-fail: enrollment was explicitly provided but not found.
                # Do NOT fall through to session user — this prevents faculty session contamination.
                return Response({"error": f"Enrollment number '{enrollment_no_from_payload}' not found."}, status=400)

        # 2. STRICT: For student/indirect surveys, enrollment must be provided
        if not student and survey.survey_category in ['course_exit', 'indirect']:
             return Response({"error": "Enrollment number is required for this survey."}, status=400)

        # 3. Only fall back to the session user for non-student surveys (if any exist) 
        # or if it's explicitly allowed (anonymous surveys usually don't need this anyway)
        if not student and not enrollment_no_from_payload and request.user.is_authenticated:
            student = Student.objects.filter(user_id=request.user).first()

        # 4. Determine enrollment number to store
        if student:
            enrollment_no = student.enrollment_no
        else:
            # Special handling for Resource Person Feedback
            if survey.survey_category == 'indirect' and 'Resource Person' in survey.survey_name:
                enrollment_no = f"RP_{survey.survey_id}"
            else:
                enrollment_no = enrollment_no_from_payload

        # 4b. Check for duplicate/overwrite submission
        if enrollment_no and not survey.is_anonymous:
            # For Resource Person, we allow overwriting (delete previous)
            if enrollment_no.startswith("RP_"):
                 SurveyResponse.objects.filter(survey_id=survey, enrollment_no=enrollment_no).delete()
            else:
                duplicate = SurveyResponse.objects.filter(survey_id=survey, enrollment_no=enrollment_no).exists()
                if duplicate:
                    return Response({"error": "You have already responded to this survey."}, status=400)
            
        # 5. Determine respondent name
        respondent_name = request.data.get('respondent_name')
        if not respondent_name:
            if student:
                respondent_name = student.name
            elif survey.survey_category == 'indirect' and 'Resource Person' in survey.survey_name:
                respondent_name = survey.resource_person_name or "Resource Person"
            else:
                # If student object wasn't found but we have an enrollment_no, query for it precisely.
                student_fallback = Student.objects.filter(enrollment_no=enrollment_no).first() if (enrollment_no and not str(enrollment_no).startswith("RP_")) else None
                if student_fallback:
                    respondent_name = student_fallback.name
                else:
                    respondent_name = "Guest"

        response = SurveyResponse.objects.create(
            survey_id=survey,
            student_id=student,
            respondent_name=respondent_name,
            enrollment_no=enrollment_no or "N/A"
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
        
        from users.models import Student
        
        # 1. Get responses: Strict Scope to this specific survey
        responses = SurveyResponse.objects.filter(survey_id=survey)
        
        batch_id = request.query_params.get('batch_id')
        academic_year = request.query_params.get('academic_year')
        class_year = request.query_params.get('class_year')
        semester = request.query_params.get('semester')
        division = request.query_params.get('division')
        
        if survey.survey_category in ['indirect', 'course_exit']:
            # Student Profile fields like academic_year or class_year often signify admission year or current state,
            # which mismatch the OIT dashboard's contextual filters. Only filter by true grouping constraints.
            if batch_id and str(batch_id).lower() != 'all':
                if str(batch_id).isdigit():
                    responses = responses.filter(student_id__batch_id=batch_id)
                else:
                    try:
                        start_year = int(str(batch_id).replace(" ", "").split("-")[0])
                        responses = responses.filter(student_id__batch_id__batch_year=start_year)
                    except ValueError:
                        pass
            if division and str(division).lower() != 'all': 
                responses = responses.filter(student_id__division=division)
        else:
            if any([batch_id, academic_year, class_year, semester, division]):
                if batch_id and str(batch_id).lower() != 'all':
                    if str(batch_id).isdigit():
                        responses = responses.filter(student_id__batch_id=batch_id)
                    else:
                        try:
                            start_year = int(str(batch_id).replace(" ", "").split("-")[0])
                            responses = responses.filter(student_id__batch_id__batch_year=start_year)
                        except ValueError:
                            pass
                if academic_year and str(academic_year).lower() != 'all': responses = responses.filter(student_id__academic_year=academic_year)
                if class_year and str(class_year).lower() != 'all': responses = responses.filter(student_id__class_year=class_year)
                if semester and str(semester).lower() != 'all': responses = responses.filter(student_id__semester=semester)
                if division and str(division).lower() != 'all': responses = responses.filter(student_id__division=division)

        # 2. Get questions: Specifically for this survey
        questions = SurveyQuestion.objects.filter(survey_id=survey)
        
        # Identify unique statements and teacher names
        unique_statements = []
        teacher_names = set()
        
        # Deduplication for cumulative stats: Priority Grouping by CO ID, falling back to text
        canonical_questions = []
        co_id_to_canon = {} # co_id_id -> canon_question
        text_to_canon = {}  # text -> canon_question
        q_id_to_canonical_id = {} # every_q_id -> canonical_id
        
        for q in questions:
            text = q.question_text.strip()
            canon_q = None
            
            if q.co_id_id:
                if q.co_id_id not in co_id_to_canon:
                    co_id_to_canon[q.co_id_id] = q
                    canonical_questions.append(q)
                canon_q = co_id_to_canon[q.co_id_id]
            else:
                if text not in text_to_canon:
                    text_to_canon[text] = q
                    canonical_questions.append(q)
                canon_q = text_to_canon[text]
            
            q_id_to_canonical_id[q.question_id] = canon_q.question_id

        # Identify unique statements and teacher names from CANONICAL questions
        for q in canonical_questions:
            text = q.question_text.strip()
            parts = text.split('|')
            if len(parts) >= 2:
                t_name = parts[0].strip()
                stmt = parts[1].strip()
                teacher_names.add(t_name)
                if stmt not in unique_statements:
                    unique_statements.append(stmt)
            else:
                stmt = text
                if stmt not in unique_statements:
                    unique_statements.append(stmt)
                teacher_names.add('General')

        q_map = {} # question_id -> {statement, teacher}
        for q in questions:
             text = q.question_text.strip()
             parts = text.split('|')
             if len(parts) >= 2:
                 q_map[q.question_id] = {'statement': parts[1].strip(), 'teacher': parts[0].strip()}
             else:
                 q_map[q.question_id] = {'statement': text, 'teacher': 'General'}

        # Aggregate scores
        from collections import defaultdict
        # teacher_scores[teacher][statement] = [scores...]
        teacher_scores = defaultdict(lambda: defaultdict(list))
        
        for res in responses.prefetch_related('answers'):
            for ans in res.answers.all():
                q_info = q_map.get(ans.question_id_id)
                if q_info:
                    teacher_scores[q_info['teacher']][q_info['statement']].append(ans.answer_value)
        # 4. Aggregate Responses (Deduplicated by Student Enrollment)
        responses_dict = {} # enrollment_no -> res_item
        
        for res in responses.prefetch_related('answers'):
            # Determine student identity
            enrollment = res.enrollment_no or (res.student_id.enrollment_no if res.student_id else "N/A")
            name = res.respondent_name or (res.student_id.name if res.student_id else "Guest")
            roll_no = res.student_id.roll_no if res.student_id else "N/A"
            
            # Use enrollment as unique key (if available)
            identity_key = enrollment if enrollment != "N/A" else f"guest_{res.response_id}"
            
            # Map existing answers to canonical versions
            current_answers = {}
            for ans in res.answers.all():
                canon_id = q_id_to_canonical_id.get(ans.question_id_id)
                if canon_id:
                    current_answers[canon_id] = ans.answer_value
            
            if identity_key in responses_dict:
                # Merge answers into existing row
                responses_dict[identity_key]['answers'].update(current_answers)
            else:
                responses_dict[identity_key] = {
                    'id': res.response_id,
                    'enrollment': enrollment,
                    'roll_no': roll_no,
                    'name': name,
                    'submitted_at': res.submitted_at,
                    'answers': current_answers
                }
        
        # Sort by roll number numerically, then by enrollment as fallback
        responses_list = list(responses_dict.values())
        def sort_key(x):
            rn = str(x.get('roll_no', '') or '')
            try:
                return (int(rn), x.get('enrollment', ''))
            except (ValueError, TypeError):
                return (99999, x.get('enrollment', ''))
        responses_list.sort(key=sort_key)

        # Build Teacher Matrix (only if it looks like a matrix/indirect survey)
        teacher_data = []
        has_matrix = any('|' in q.question_text for q in canonical_questions)
        if has_matrix:
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
                teacher_data.append(row)
            teacher_data.sort(key=lambda x: x['achieved_score'], reverse=True)

        return Response({
            'survey': SurveyMasterSerializer(survey).data,
            'statements': [
                {
                    "id": q.question_id,
                    "co_id": q.co_id_id,
                    "co_number": q.co_id.co_number if q.co_id else None,
                    "number": (
                        q.po_id.po_number if q.po_id else
                        (q.pso_id.pso_number if q.pso_id else
                         (q.co_id.co_number if q.co_id else f"Q{q.question_id}"))
                    ),
                    "type": 'PO' if q.po_id else ('PSO' if q.pso_id else 'CO'),
                    "description": (
                        q.po_id.description if q.po_id else
                        (q.pso_id.description if q.pso_id else
                         (q.co_id.description if q.co_id else ''))
                    ),
                    "question_text": q.question_text,
                    "question_id": q.question_id
                } for q in canonical_questions
            ] if not has_matrix else unique_statements,
            'responses': responses_list,
            'teachers': teacher_data,
            'total_responses': len(responses_list)
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
        
        if survey.survey_category in ['indirect', 'course_exit']:
            if batch_id and str(batch_id).lower() != 'all':
                if str(batch_id).isdigit():
                    responses = responses.filter(student_id__batch_id=batch_id)
                else:
                    try:
                        start_year = int(str(batch_id).replace(" ", "").split("-")[0])
                        responses = responses.filter(student_id__batch_id__batch_year=start_year)
                    except ValueError:
                        pass
            # Do NOT filter student_id__academic_year for OIT/CES 
             # because student records represent their admission/latest state, which differs from survey context year
        else:
            if batch_id and str(batch_id).lower() != 'all':
                if str(batch_id).isdigit():
                    responses = responses.filter(student_id__batch_id=batch_id)
                else:
                    try:
                        start_year = int(str(batch_id).replace(" ", "").split("-")[0])
                        responses = responses.filter(student_id__batch_id__batch_year=start_year)
                    except ValueError:
                        pass
            if academic_year and str(academic_year).lower() != 'all': responses = responses.filter(student_id__academic_year=academic_year)

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
