from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import COAttainment, POAttainment, PSOAttainment, AttainmentSnapshot
from rest_framework.permissions import AllowAny

from .serializers import (
    COAttainmentSerializer, POAttainmentSerializer, 
    PSOAttainmentSerializer, AttainmentSnapshotSerializer
)
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

class CalculateAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        course_id = request.data.get('course_id')
        academic_year = request.data.get('academic_year', '2023-24') # Default fallback
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
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
            excel_data = ReportService.generate_batch_evaluation_report(program_id, batch_id)
            
            # Save to database
            user = request.user if request.user and not request.user.is_anonymous else None
            program = Program.objects.get(pk=program_id)
            batch = Batch.objects.get(pk=batch_id)
            academic_year = f"{batch.start_year}-{batch.end_year}"
            
            filename = f'PO_Attainment_Report_Batch_{batch_id}.xlsx'
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
            log_action(user, 'CREATE', 'Report', batch_id, remark=f"Batch evaluation report generated for {academic_year}")

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
            excel_data = IndirectReportService.generate_indirect_attainment_report(program_id, batch_id)
            # Save to database
            user = request.user if request.user and not request.user.is_anonymous else None
            program = Program.objects.get(pk=program_id)
            batch = Batch.objects.get(pk=batch_id)
            academic_year = f"{batch.start_year}-{batch.end_year}"
            
            filename = f'Indirect_Attainment_Report_{batch_id}.xlsx'
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
            log_action(user, 'CREATE', 'Report', batch_id, remark=f"Indirect attainment report generated for {academic_year}")

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
            summary = IndirectReportService.get_indirect_attainment_summary_data(program_id, batch_id)
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmitATRView(APIView):
    def post(self, request):
        co_id = request.data.get('co_id')
        academic_year = request.data.get('academic_year')
        action_proposed = request.data.get('action_proposed')
        
        if not all([co_id, academic_year, action_proposed]):
            return Response({"error": "co_id, academic_year and action_proposed are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # co_id might be a CO object ID or a number. If it's a number, we need to find the CO.
            # But usually it's passed as the database ID.
            att = COAttainment.objects.filter(co_id=co_id, academic_year=academic_year).first()
            if not att:
                 return Response({"error": f"Attainment record not found for CO {co_id}"}, status=status.HTTP_404_NOT_FOUND)
                 
            att.action_proposed = action_proposed
            att.atr_status = 'submitted'
            att.save()
            
            user = request.user if request.user and not request.user.is_anonymous else None
            # Check if all other ATRs are cleared for this course to generate the report
            report_generated = AttainmentService.check_and_generate_report(att.course_id.course_id, academic_year, user)
            
            log_action(user, 'UPDATE', 'COAttainment', att.attainment_id, remark=f"ATR submitted for {att.co_id.co_number}")
            
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
        preview_data = AttainmentService.get_attainment_preview(course_id, academic_year)
        
        # We need to add contribution weight for the specific PO/PSO if requested?
        # Actually the frontend uses it generic. 
        # But let's add co mapping info
        for item in preview_data:
            co_id = item['co_id']
            # We don't know which PO/PSO the user is backtracking from here unless we pass it.
            # But the frontend design shows "CO Att.", "Weight".
            # This weight depends on the PO/PSO.
            pass

        return Response({"cos": preview_data}, status=status.HTTP_200_OK)
