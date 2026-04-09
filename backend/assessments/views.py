import re
import os
import threading
from django.db import models
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from audit.utils import log_action
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from .models import Assessment, MarksEntry, CisEvidence, AssessmentCOMapping
from .serializers import AssessmentSerializer, MarksEntrySerializer, CisEvidenceSerializer
from users.models import User, Student
from academics.models import Course, CO


class AssessmentListCreateAPIView(APIView):
    def get(self, request) -> Response:
        course_id = request.query_params.get('course_id')
        queryset = Assessment.objects.filter(is_active=True)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        serializer = AssessmentSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request) -> Response:
        data = request.data.copy()

        # Normalize and set defaults
        if 'type' in data:
            data['assessment_type'] = data['type']
        data.setdefault('assessment_name', f"{data.get('type', 'Assessment')} - {data.get('course_id')}")
        data.setdefault('max_marks', 100)
        data.setdefault('academic_year', '2023-24')
        data.setdefault('semester', 1)

        # Determine creator
        set_by = request.user if request.user and not request.user.is_anonymous else User.objects.first()
        data['created_by'] = set_by.user_id

        serializer = AssessmentSerializer(data=data)
        if serializer.is_valid():
            assessment = serializer.save()
            log_action(request.user, 'CREATE', 'Assessment', assessment.assessment_id, new_value=serializer.data, request=request)
            return Response({"assessment_id": assessment.assessment_id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssessmentDetailAPIView(APIView):
    def put(self, request, pk: int) -> Response:
        assessment = get_object_or_404(Assessment, pk=pk)
        serializer = AssessmentSerializer(assessment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(request.user, 'UPDATE', 'Assessment', assessment.assessment_id, new_value=serializer.data, request=request)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from attainment.attainment_service import AttainmentService

class SaveAssessmentMarksView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [] # Bypass token validation to allow fallback logic below
    def get(self, request):
        course_id = request.query_params.get('course_id')
        tool_name = request.query_params.get('tool_name')
        academic_year = request.query_params.get('academic_year')
        
        semester = request.query_params.get('semester')
        
        if not course_id or not tool_name:
            return Response({"error": "course_id and tool_name are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        auth_filters = {
            'course_id': course_id,
            'assessment_name': tool_name,
            'is_active': True
        }
        if academic_year:
            auth_filters['academic_year'] = academic_year
        if semester:
            auth_filters['semester'] = semester
            
        # Get the most recently created/updated assessment matching the criteria
        assessment = Assessment.objects.filter(**auth_filters).order_by('-assessment_id').first()
        
        if not assessment:
            return Response([], status=status.HTTP_200_OK)
            
        marks = MarksEntry.objects.filter(assessment_id=assessment)
        co_mappings = AssessmentCOMapping.objects.filter(assessment_id=assessment)
        
        # Fetch CIS Evidence
        evidence = CisEvidence.objects.filter(
            course_id=course_id,
            academic_year=assessment.academic_year,
            semester=assessment.semester,
            assessment_tool=tool_name
        )
        
        return Response({
            "assessment_id": assessment.assessment_id,
            "max_marks": assessment.max_marks,
            "configuration": assessment.configuration,
            "marks_data": MarksEntrySerializer(marks, many=True).data,
            "co_mappings": [
                {"co_id": m.co_id.co_id if hasattr(m.co_id, 'co_id') else getattr(m, 'co_id_id', None), "weight": m.co_weightage} for m in co_mappings
            ],
            "evidence": CisEvidenceSerializer(evidence, many=True).data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        course_id = data.get('course_id')
        academic_year = data.get('academic_year')
        tool_type = data.get('tool_type') # e.g. FA_TH
        tool_name = data.get('tool_name') # e.g. Class Test 1
        max_marks = data.get('max_marks', 0)
        marks_data = data.get('marks_data', [])
        co_mappings = data.get('co_mappings', []) # [{co_id: 1, weight: 1.0}]
        configuration = data.get('configuration', {})
        semester = data.get('semester', 1)

        if not all([course_id, academic_year, tool_type, tool_name]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, pk=course_id)
        user = request.user if request.user.is_authenticated else User.objects.first()

        # RBAC: Faculty only enter marks for assigned courses
        if user.role_id.role_name == "Faculty":
            from users.models import FacultyCourseAssignment
            is_assigned = FacultyCourseAssignment.objects.filter(
                faculty_id=user, 
                course_id=course, 
                is_active=True
            ).exists()
            if not is_assigned:
                return Response({"error": "You are not assigned to this course and cannot enter marks."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            # 1. Upsert Assessment
            assessment, created = Assessment.objects.update_or_create(
                course_id=course,
                assessment_name=tool_name,
                academic_year=academic_year,
                semester=semester,
                defaults={
                    'assessment_type': tool_type,
                    'max_marks': max_marks,
                    'weightage': 1.0, 
                    'user_id': user,
                    'configuration': configuration,
                    'is_active': True
                }
            )

            # 2. Update CO Mappings (Aggregate by CO Number)
            AssessmentCOMapping.objects.filter(assessment_id=assessment).delete()
            co_weights = {}
            for mapping in co_mappings:
                co_num_val = str(mapping.get('co_id'))
                if not co_num_val: continue
                # Normalize CO number (e.g., "1" -> "CO1")
                if not co_num_val.upper().startswith("CO"):
                    co_num_norm = f"CO{co_num_val}"
                else:
                    co_num_norm = co_num_val.upper()
                
                weight = float(mapping.get('weight', 1.0))
                co_weights[co_num_norm] = co_weights.get(co_num_norm, 0) + weight

            for co_num, weight in co_weights.items():
                co_num = str(co_num).strip()
                # IMPROVED: Robust CO matching. 
                # Try exact match first, then by index suffix
                co_obj = CO.objects.filter(course_id=course, co_number__iexact=co_num).first()
                if not co_obj:
                    # Treat strictly "CO" as index 0 (CO1)
                    co_pos = 0 if co_num.upper() == "CO" else None
                    
                    if co_pos is None:
                        idx_match = re.search(r'\d+', co_num)
                        if idx_match:
                            idx = idx_match.group()
                            co_pos = int(idx) - 1
                    
                    if co_pos is not None:
                        # Enhanced matching: points to CO objects even if they have default names like "CO"
                        course_cos = list(CO.objects.filter(course_id=course).order_by('co_id'))
                        if 0 <= co_pos < len(course_cos):
                             co_obj = course_cos[co_pos]
                            
                        if not co_obj and (vars().get('idx')):
                            co_obj = CO.objects.filter(
                                course_id=course
                            ).filter(
                                Q(co_number__iendswith=idx) | 
                                Q(co_number__icontains=f".{idx}") |
                                Q(co_number__icontains=f" {idx}")
                            ).first()

                if co_obj:
                    AssessmentCOMapping.objects.create(
                        assessment_id=assessment,
                        co_id=co_obj,
                        co_weightage=weight
                    )

            # 3. Upsert Marks (OPTIMIZED)
            MarksEntry.objects.filter(assessment_id=assessment).delete()
            
            enrollment_nos = [item.get('enrollment_no') for item in marks_data if item.get('enrollment_no')]
            students_map = {
                s.enrollment_no: s 
                for s in Student.objects.filter(enrollment_no__in=enrollment_nos, program_id=course.program_id)
            }
            
            new_entries = []
            for item in marks_data:
                enrollment_no = item.get('enrollment_no')
                marks_obtained = item.get('marks')
                if enrollment_no and marks_obtained is not None:
                    student = students_map.get(enrollment_no)
                    if student:
                        try: 
                            val = float(marks_obtained)
                            new_entries.append(
                                MarksEntry(assessment_id=assessment, student_id=student, marks_obtained=val, user_id=user)
                            )
                        except (ValueError, TypeError):
                            # Skip non-numeric marks (e.g. '-', 'A', empty string) so they don't count as "appeared"
                            pass
            
            if new_entries:
                MarksEntry.objects.bulk_create(new_entries)

        # Trigger attainment recalculation in background to prevent request timeout
        def run_calculation():
            try:
                from attainment.attainment_service import AttainmentService
                from django.db import connection
                AttainmentService.calculate_attainment(course_id, academic_year, invalidate_cache=True)
                print(f"[Attainment] Background recalculation successful for course {course_id}")
            except Exception as e:
                print(f"[Attainment] Background recalculation failed: {e}")
            finally:
                from django.db import connection
                connection.close()

        threading.Thread(target=run_calculation, daemon=True).start()

        return Response({
            "message": "Marks saved. Attainment recalculation started in background.", 
            "assessment_id": assessment.assessment_id
        }, status=status.HTTP_201_CREATED)



class EvidenceUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, pk: int) -> Response:
        assessment = get_object_or_404(Assessment, pk=pk)
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"error": "File is required"}, status=status.HTTP_400_BAD_REQUEST)

        assessment.evidence_file = file_obj
        assessment.save()
        return Response({"message": "Evidence uploaded successfully", "assessment_id": assessment.assessment_id},
                        status=status.HTTP_200_OK)


class EvidenceListView(APIView):
    def get(self, request, pk: int) -> Response:
        assessment = get_object_or_404(Assessment, pk=pk)

        if not assessment.evidence_file:
            return Response({"message": "No evidence uploaded"}, status=status.HTTP_200_OK)

        if not os.path.exists(assessment.evidence_file.path):
            return Response({
                "error": "The uploaded evidence file is missing from the server storage.",
                "detail": "Storage on Render is ephemeral. Please re-upload the document."
            }, status=status.HTTP_404_NOT_FOUND)

        file_info = {
            "name": assessment.evidence_file.name,
            "url": getattr(assessment.evidence_file, 'url', None)
        }
        return Response({"files": [file_info]}, status=status.HTTP_200_OK)

class CisEvidenceUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        
        if request.user.is_authenticated:
            data['uploaded_by'] = request.user.pk
        else:
            # Fallback for dev/testing
            first_user = User.objects.first()
            if first_user:
                data['uploaded_by'] = first_user.pk
            else:
                return Response({"error": "No users found in database to assign upload ownership"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = CisEvidenceSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
