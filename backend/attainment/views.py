from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import COAttainment, POAttainment, PSOAttainment, AttainmentSnapshot, POBatchAttainment, PSOBatchAttainment
from rest_framework.permissions import AllowAny

from .serializers import (
    COAttainmentSerializer, POAttainmentSerializer, 
    PSOAttainmentSerializer, AttainmentSnapshotSerializer,
    POBatchAttainmentSerializer, PSOBatchAttainmentSerializer
)
from django.db.models import Avg
from django.http import HttpResponse

# from academics.models import Course, Program
# from users.models import User

from .attainment_service import AttainmentService
from .report_service import ReportService
from .indirect_report_service import IndirectReportService
import traceback
from audit.utils import log_action
from reports.utils import save_generated_report
from academics.models import Course, Program, Batch

def resolve_batch(batch_id, program_id=None):
    """
    Resolves a batch_id (which could be a PK or a string like '2025-26') to a Batch object.
    If program_id is provided, it attempts to find the batch that has courses in that program first (better for multiple schemes).
    """
    if not batch_id:
        return None
    try:
        # Try as PK (integer)
        return Batch.objects.get(pk=batch_id)
    except (ValueError, Batch.DoesNotExist):
        # Try as batch_year (string representation)
        # Handle formats like '2025-26' or '2025'
        try:
            year_val = int(str(batch_id).split('-')[0].strip())
            
            # If program_id is provided, look for a batch that has courses in this program
            if program_id:
                # We look for a batch of this year that has any courses in this program 
                # OR matches the scheme of courses in this program
                batch = Batch.objects.filter(batch_year=year_val, courses__program_id=program_id).first()
                if batch:
                    return batch
                    
                # Fallback: find the first active batch for this year and match it to a likely scheme for the program
                course = Course.objects.filter(program_id=program_id).first()
                if course and course.scheme_id:
                    batch = Batch.objects.filter(batch_year=year_val, scheme_id=course.scheme_id).first()
                    if batch:
                        return batch

            # Match against batch_year to ensure compatibility with existing data
            return Batch.objects.filter(batch_year=year_val).first()
        except (ValueError, IndexError):
            return None

class CalculateAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        course_id = request.data.get('course_id')
        academic_year = request.data.get('academic_year', '2023-24') # Default fallback
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # RBAC: Faculty or HOD/Coordinator/Admin
        user = request.user
        if user.is_authenticated and user.role_id.role_name == "Faculty":
            from users.models import FacultyCourseAssignment
            if not FacultyCourseAssignment.objects.filter(faculty_id=user, course_id=course_id, is_active=True).exists():
                return Response({"error": "You can only calculate attainment for your assigned courses."}, status=status.HTTP_403_FORBIDDEN)
        elif user.is_authenticated and user.role_id.role_name not in ["Admin", "HOD", "Coordinator"]:
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            results = AttainmentService.calculate_attainment(course_id, academic_year)
            if results:
                # Log the calculation
                user = request.user if request.user and not request.user.is_anonymous else None
                log_action(user, 'CALCULATE', 'Course', course_id, remark=f"Attainment calculated for {academic_year}")
                
                return Response({
                    "message": f"Attainment calculation completed for course {course_id}",
                    "results": results
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Insufficient data for calculation"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class COAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        academic_year = request.query_params.get('academic_year')
        
        queryset = COAttainment.objects.filter(is_active=True)
        if program_id:
            queryset = queryset.filter(course_id__program_id=program_id)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
            
        serializer = COAttainmentSerializer(queryset, many=True)
        return Response({"CO attainment": serializer.data}, status=status.HTTP_200_OK)


class POAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        academic_year = request.query_params.get('academic_year')
        
        queryset = POAttainment.objects.filter(is_active=True)
        if program_id:
            queryset = queryset.filter(po_id__program_id=program_id)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
            
        serializer = POAttainmentSerializer(queryset, many=True)
        return Response({"PO attainment": serializer.data}, status=status.HTTP_200_OK)


class PSOAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        academic_year = request.query_params.get('academic_year')
        
        queryset = PSOAttainment.objects.filter(is_active=True)
        if program_id:
            queryset = queryset.filter(pso_id__program_id=program_id)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
            
        serializer = PSOAttainmentSerializer(queryset, many=True)
        return Response({"PSO attainment": serializer.data}, status=status.HTTP_200_OK)


class POBatchAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        batch_id = request.query_params.get('batch_id')
        program_id = request.query_params.get('program_id')
        
        queryset = POBatchAttainment.objects.all()
        if batch_id:
            batch = resolve_batch(batch_id, program_id=program_id)
            if batch:
                queryset = queryset.filter(batch_id=batch)
            else:
                # If batch_id was provided but not found, return empty
                return Response({"PO batch attainment": []}, status=status.HTTP_200_OK)
        if program_id:
            queryset = queryset.filter(po_id__program_id=program_id)
            
        serializer = POBatchAttainmentSerializer(queryset, many=True)
        return Response({"PO batch attainment": serializer.data}, status=status.HTTP_200_OK)


class PSOBatchAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        batch_id = request.query_params.get('batch_id')
        program_id = request.query_params.get('program_id')
        
        queryset = PSOBatchAttainment.objects.all()
        if batch_id:
            batch = resolve_batch(batch_id, program_id=program_id)
            if batch:
                queryset = queryset.filter(batch_id=batch)
            else:
                # If batch_id was provided but not found, return empty
                return Response({"PSO batch attainment": []}, status=status.HTTP_200_OK)
        if program_id:
            queryset = queryset.filter(pso_id__program_id=program_id)
            
        serializer = PSOBatchAttainmentSerializer(queryset, many=True)
        return Response({"PSO batch attainment": serializer.data}, status=status.HTTP_200_OK)


class CreateSnapshotView(APIView):
    def post(self, request):
        month = request.data.get('month')
        year = request.data.get('year')
        if not month or not year:
            return Response({"error": "month and year are required"}, status=status.HTTP_400_BAD_REQUEST)
        course = Course.objects.first()
        verified_by = request.user if request.user and not request.user.is_anonymous else User.objects.first()
        if not course or not verified_by:
             return Response({"error": "Initial data missing for snapshot"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        snapshot = AttainmentSnapshot.objects.create(month=month, year=year, course_id=course, attainment_value=0.0, verified_by=verified_by, remarks="Initial snapshot")
        return Response({"snapshot_id": snapshot.snapshot_id}, status=status.HTTP_201_CREATED)

class SnapshotHistoryView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        snapshots = AttainmentSnapshot.objects.all()
        serializer = AttainmentSnapshotSerializer(snapshots, many=True)
        return Response({"snapshot list": serializer.data}, status=status.HTTP_200_OK)

class BatchEvaluationReportView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        batch_id = request.query_params.get('batch_id')
        
        if not program_id or not batch_id:
            return Response({"error": "program_id and batch_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            batch = resolve_batch(batch_id, program_id=program_id)
            if not batch:
                 return Response({"error": f"Batch {batch_id} not found"}, status=status.HTTP_404_NOT_FOUND)
            
            academic_year = request.query_params.get('academic_year')
            if not academic_year:
                academic_year = f"{batch.start_year}-{batch.end_year}"

            excel_data = ReportService.generate_batch_evaluation_report(program_id, batch)
            
            # Save to database
            user = request.user if request.user and not request.user.is_anonymous else None
            program = Program.objects.get(pk=program_id)
            
            filename = f'PO_Attainment_Report_Batch_{batch.batch_id}.xlsx'
            save_generated_report(
                user=user,
                report_type='Batch',
                year=academic_year,
                file_content=excel_data,
                filename=filename,
                program=program,
                batch=batch
            )
            
            # Log action
            log_action(user, 'CREATE', 'Report', batch.batch_id, remark=f"Batch evaluation report generated for {academic_year}")

            excel_data.seek(0)
            response = HttpResponse(
                excel_data.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename={filename}'
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class IndirectAttainmentReportView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        batch_id = request.query_params.get('batch_id')
        
        if not program_id or not batch_id:
            return Response({"error": "program_id and batch_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            batch = resolve_batch(batch_id, program_id=program_id)
            if not batch:
                 return Response({"error": f"Batch {batch_id} not found"}, status=status.HTTP_404_NOT_FOUND)
            
            academic_year = request.query_params.get('academic_year')
            if not academic_year:
                academic_year = f"{batch.start_year}-{batch.end_year}"
                 
            excel_data = IndirectReportService.generate_indirect_attainment_report(program_id, batch_id)
            # Save to database
            user = request.user if request.user and not request.user.is_anonymous else None
            program = Program.objects.get(pk=program_id)
            
            filename = f'Indirect_Attainment_Report_{batch.batch_id}.xlsx'
            save_generated_report(
                user=user,
                report_type='Indirect',
                year=academic_year,
                file_content=excel_data,
                filename=filename,
                program=program,
                batch=batch
            )
            
            # Log action
            log_action(user, 'CREATE', 'Report', batch.batch_id, remark=f"Indirect attainment report generated for {academic_year}")

            excel_data.seek(0)
            response = HttpResponse(
                excel_data.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename={filename}'
            return response
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class IndirectAttainmentSummaryView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        batch_id = request.query_params.get('batch_id')
        
        if not program_id or not batch_id:
            return Response({"error": "program_id and batch_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            batch = resolve_batch(batch_id, program_id=program_id)
            if not batch:
                 return Response({"error": f"Batch {batch_id} not found"}, status=status.HTTP_404_NOT_FOUND)
            
            summary = IndirectReportService.get_indirect_attainment_summary_data(program_id, batch_id)
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmitATRView(APIView):
    def post(self, request):
        co_id = request.data.get('co_id')
        course_id = request.data.get('course_id')
        academic_year = request.data.get('academic_year')
        action_proposed = request.data.get('action_proposed')
        
        if not academic_year or not action_proposed:
            return Response({"error": "academic_year and action_proposed are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not co_id and not course_id:
            return Response({"error": "Either co_id or course_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # RBAC: Only assigned Faculty or HOD/Coordinator can submit ATR
        user = request.user
        
        try:
            from .models import CourseATR, COAttainment
            
            if course_id:
                # Consolidated Course-Level ATR
                course = get_object_or_404(Course, pk=course_id)
                
                # RBAC Check
                if user.is_authenticated and user.role_id.role_name == "Faculty":
                    from users.models import FacultyCourseAssignment
                    if not FacultyCourseAssignment.objects.filter(faculty_id=user, course_id=course, is_active=True).exists():
                        return Response({"error": "You are not assigned to this course."}, status=status.HTTP_403_FORBIDDEN)
                
                # Ensure we handle AY spacing consistently
                ay_clean = academic_year.replace(' ', '')
                ay_spaced = ay_clean.replace('-', ' - ')
                from django.db import models
                ay_query = models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_spaced)

                # Create or Update CourseATR
                # We use update_or_create but with a filter that handles AY variations
                atr_obj = CourseATR.objects.filter(ay_query, course_id=course).first()
                if atr_obj:
                    atr_obj.action_proposed = action_proposed
                    atr_obj.atr_status = 'submitted'
                    atr_obj.save()
                else:
                    CourseATR.objects.create(
                        course_id=course,
                        academic_year=academic_year,
                        action_proposed=action_proposed,
                        atr_status='submitted'
                    )
                
                # Mark all pending CO attainments as submitted
                COAttainment.objects.filter(
                    ay_query,
                    course_id=course, 
                    atr_status='pending'
                ).update(atr_status='submitted', action_proposed=action_proposed)
                
                report_generated = AttainmentService.check_and_generate_report(course_id, academic_year, user if not user.is_anonymous else None)
                log_action(user if not user.is_anonymous else None, 'CREATE', 'CourseATR', course_id, remark=f"Consolidated ATR submitted for {academic_year}")
                
                return Response({
                    "message": "Consolidated ATR submitted successfully",
                    "report_generated": report_generated
                }, status=status.HTTP_200_OK)
            
            else:
                # Existing Per-CO ATR logic (backward compatibility)
                att = COAttainment.objects.filter(co_id=co_id, academic_year=academic_year).first()
                if not att:
                     return Response({"error": "Attainment record not found"}, status=status.HTTP_404_NOT_FOUND)
                
                # RBAC Check
                if user.is_authenticated and user.role_id.role_name == "Faculty":
                    from users.models import FacultyCourseAssignment
                    if not FacultyCourseAssignment.objects.filter(faculty_id=user, course_id=att.course_id, is_active=True).exists():
                        return Response({"error": "You are not assigned to this course."}, status=status.HTTP_403_FORBIDDEN)

                att.action_proposed = action_proposed
                att.atr_status = 'submitted'
                att.save()
                
                report_generated = AttainmentService.check_and_generate_report(att.course_id.course_id, academic_year, user if not user.is_anonymous else None)
                log_action(user if not user.is_anonymous else None, 'UPDATE', 'COAttainment', att.attainment_id, remark=f"ATR submitted for CO {att.co_id.co_number}")
                
                return Response({
                    "message": "ATR submitted successfully",
                    "report_generated": report_generated
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class POContributingCoursesView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request, po_id):
        academic_year = request.query_params.get('academic_year')
        from academics.models import COPOMapping, Course
        
        # Find COs mapping to this PO
        mappings = COPOMapping.objects.filter(po_id=po_id).select_related('co_id', 'co_id__course_id')
        
        course_data = {}
        for m in mappings:
            course = m.co_id.course_id
            if course.course_id not in course_data:
                # Calculate course level (average of COs)
                # For backtracking, we can just fetch the pre-calculated POAttainment or calculate on the fly
                # But here we want the contribution of THIS course to THIS PO.
                # Contribution = Sum(CO_Attainment * Weight) / 3
                from .models import COAttainment
                co_atts = COAttainment.objects.filter(course_id=course, academic_year=academic_year, is_active=True)
                co_att_map = {a.co_id_id: a.overall_attainment for a in co_atts}
                
                # Fetch all COs of this course that map to this PO
                course_mappings = COPOMapping.objects.filter(po_id=po_id, co_id__course_id=course)
                contribution = 0
                for cm in course_mappings:
                    co_val = co_att_map.get(cm.co_id_id, 0)
                    contribution += (co_val * (cm.weightage or 0))
                
                course_data[course.course_id] = {
                    "course_id": course.course_id,
                    "course_name": course.course_name,
                    "course_code": course.course_code,
                    "level": round(contribution / 3, 2)
                }
        
        return Response({"courses": list(course_data.values())}, status=status.HTTP_200_OK)

class PSOContributingCoursesView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request, pso_id):
        academic_year = request.query_params.get('academic_year')
        from academics.models import COPSOMapping, Course
        
        mappings = COPSOMapping.objects.filter(pso_id=pso_id).select_related('co_id', 'co_id__course_id')
        
        course_data = {}
        for m in mappings:
            course = m.co_id.course_id
            if course.course_id not in course_data:
                from .models import COAttainment
                co_atts = COAttainment.objects.filter(course_id=course, academic_year=academic_year, is_active=True)
                co_att_map = {a.co_id_id: a.overall_attainment for a in co_atts}
                
                course_mappings = COPSOMapping.objects.filter(pso_id=pso_id, co_id__course_id=course)
                contribution = 0
                for cm in course_mappings:
                    co_val = co_att_map.get(cm.co_id_id, 0)
                    contribution += (co_val * (cm.weightage or 0))
                
                course_data[course.course_id] = {
                    "course_id": course.course_id,
                    "course_name": course.course_name,
                    "course_code": course.course_code,
                    "level": round(contribution / 3, 2)
                }
        
        return Response({"courses": list(course_data.values())}, status=status.HTTP_200_OK)

class CourseCOBreakdownView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request, course_id):
        academic_year = request.query_params.get('academic_year')
        po_id = request.query_params.get('po_id')
        pso_id = request.query_params.get('pso_id')
        
        preview_data = AttainmentService.get_attainment_preview(course_id, academic_year)
        
        # Add contribution weight context if backtracking from PO/PSO
        from academics.models import COPOMapping, COPSOMapping
        for item in preview_data:
            co_id = item['co_id']
            weight = None
            if po_id:
                mapping = COPOMapping.objects.filter(co_id=co_id, po_id=po_id).first()
                weight = mapping.weightage if mapping else 0
            elif pso_id:
                mapping = COPSOMapping.objects.filter(co_id=co_id, pso_id=pso_id).first()
                weight = mapping.weightage if mapping else 0
            
            # Map numeric weight (1,2,3) to percentage (assuming max weight 3 = 100%)
            # Or just provide the raw weight. Frontend shows `${weight}%`. 
            # If weight is 3, it shows 3%. Let's calculate percentage if that's expected,
            # but usually in these systems weight 3 is just level 3.
            # Looking at screenshot 3, it shows "undefined%".
            # Let's provide it as a percentage of 3.
            if weight is not None:
                item['contribution_weight'] = round((weight / 3.0) * 100, 1) if weight > 0 else 0
            else:
                item['contribution_weight'] = None

        return Response({"cos": preview_data}, status=status.HTTP_200_OK)

class CourseStatusView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        academic_year = request.query_params.get('academic_year')
        batch_id = request.query_params.get('batch_id')
        program_id = request.query_params.get('program_id')
        
        if not academic_year or not batch_id:
            return Response({"error": "academic_year and batch_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # In this view, batch_id is used as part of logical filtering if needed,
        # but interestingly, the original code didn't use batch_id for the Course.objects.filter.
        # However, let's resolve it to ensure it's valid if we want to add filtering later.
        batch = resolve_batch(batch_id, program_id=program_id)
        if not batch:
             return Response({"error": f"Batch {batch_id} not found"}, status=status.HTTP_404_NOT_FOUND)
            
        courses = Course.objects.filter(is_active=True)
        if program_id and program_id != 'All':
            courses = courses.filter(program_id=program_id)
            
        data = {}
        for course in courses:
            data[course.course_id] = AttainmentService.get_course_status_summary(course.course_id, academic_year)
            
        return Response(data, status=status.HTTP_200_OK)
