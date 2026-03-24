from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Report, DACReport, AuditorBoard, AuditPeriod
from .serializers import ReportSerializer, DACReportSerializer, AuditorBoardSerializer, AuditPeriodSerializer
from .pagination import StandardResultsSetPagination
from audit.utils import log_action
from django.db.models import Q
from django.http import HttpResponse, FileResponse
from attainment.report_service import ReportService
from attainment.indirect_report_service import IndirectReportService
import io

class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Report.objects.all()
        if user.is_authenticated and user.role_id.role_name == "Auditor":
            queryset = queryset.filter(status='Approved')
        return queryset

import os

class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    
    def perform_destroy(self, instance):
        # Delete the file from the disk
        if instance.report_file and os.path.exists(instance.report_file.path):
            try:
                os.remove(instance.report_file.path)
            except Exception:
                pass
        instance.delete()

class ReportVerificationView(generics.ListAPIView):
    """
    List reports that are pending verification (Draft or Pending).
    """
    serializer_class = ReportSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Report.objects.filter(status__in=['Draft', 'Pending', 'Rejected'])
        
        program_id = self.request.query_params.get('program_id')
        scheme_id = self.request.query_params.get('scheme_id')
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if scheme_id:
            queryset = queryset.filter(
                Q(batch_id__scheme_id=scheme_id) | Q(course_id__scheme_id=scheme_id)
            ).distinct()
            
        return queryset.order_by('-created_at')

class ApproveReportView(APIView):
    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
            report.status = 'Approved'
            report.user_id_approved = request.user if request.user and not request.user.is_anonymous else None
            report.save()
            
            # Log action
            user = request.user if request.user and not request.user.is_anonymous else None
            log_action(user, 'APPROVE', 'Report', pk, remark=f"Report approved: {report.report_file.name}")
            
            return Response({"message": "Report approved successfully"}, status=status.HTTP_200_OK)
        except Report.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectReportView(APIView):
    def post(self, request, pk):
        remark = request.data.get('remark', '')
        try:
            report = Report.objects.get(pk=pk)
            report.status = 'Rejected'
            report.auditor_remark = remark # Save remark
            report.save()
            
            # Log action
            user = request.user if request.user and not request.user.is_anonymous else None
            log_action(user, 'UPDATE', 'Report', pk, remark=f"Report rejected: {remark}")
            
            return Response({"message": "Report rejected successfully"}, status=status.HTTP_200_OK)
        except Report.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

class DownloadReportView(APIView):
    """
    Serves a report file. If the file is missing from disk (e.g., on Render),
    it attempts to regenerate it using stored metadata.
    """
    def get(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        
        # Check if file exists on disk
        if report.report_file and os.path.exists(report.report_file.path):
            return FileResponse(open(report.report_file.path, 'rb'), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        
        # Fallback: Regenerate the report
        try:
            excel_data = None
            filename = os.path.basename(report.report_file.name) if report.report_file else f"Report_{pk}.xlsx"
            
            if report.report_type == 'Batch':
                if report.program_id and report.batch_id:
                    excel_data = ReportService.generate_batch_evaluation_report(report.program_id.pk, report.batch_id)
            elif report.report_type == 'Direct':
                if report.course_id and report.year:
                    excel_data = ReportService.generate_course_attainment_report(report.course_id.pk, report.year)
            elif report.report_type == 'Indirect':
                if report.program_id and report.batch_id:
                    excel_data = IndirectReportService.generate_indirect_attainment_report(report.program_id.pk, report.batch_id.pk)
            
            if excel_data:
                # Save the regenerated file back to storage
                from .utils import save_generated_report
                save_generated_report(
                    user=report.user_id_created,
                    report_type=report.report_type,
                    year=report.year,
                    file_content=excel_data,
                    filename=filename,
                    course=report.course_id,
                    program=report.program_id,
                    batch=report.batch_id
                )
                
                excel_data.seek(0)
                response = HttpResponse(
                    excel_data.read(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = f'attachment; filename={filename}'
                return response
            else:
                return Response({"error": "Report file missing and could not be regenerated due to incomplete metadata."}, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({"error": f"Report regeneration failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ApproveDACReportView(APIView):
    def post(self, request, pk):
        try:
            report = DACReport.objects.get(pk=pk)
            report.status = 'Approved'
            report.save()
            
            # Log action
            user = request.user if request.user and not request.user.is_anonymous else None
            log_action(user, 'APPROVE', 'DACReport', pk, remark=f"DAC Report approved: {report.file.name}")
            
            return Response({"message": "DAC Report approved successfully"}, status=status.HTTP_200_OK)
        except DACReport.DoesNotExist:
            return Response({"error": "DAC Report not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectDACReportView(APIView):
    def post(self, request, pk):
        remark = request.data.get('remark', '')
        try:
            report = DACReport.objects.get(pk=pk)
            report.status = 'Rejected'
            report.auditor_remark = remark
            report.save()
            
            # Log action
            user = request.user if request.user and not request.user.is_anonymous else None
            log_action(user, 'UPDATE', 'DACReport', pk, remark=f"DAC Report rejected: {remark}")
            
            return Response({"message": "DAC Report rejected successfully"}, status=status.HTTP_200_OK)
        except DACReport.DoesNotExist:
            return Response({"error": "DAC Report not found"}, status=status.HTTP_404_NOT_FOUND)

class DACReportListCreateView(generics.ListCreateAPIView):
    serializer_class = DACReportSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = DACReport.objects.all().order_by('-uploaded_at')
        
        # Apply filters if provided
        program_id = self.request.query_params.get('program_id')
        batch_id = self.request.query_params.get('batch_id')
        scheme_id = self.request.query_params.get('scheme_id')
        academic_year = self.request.query_params.get('academic_year')
        class_name = self.request.query_params.get('class_name')
        semester = self.request.query_params.get('semester')
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if scheme_id:
            queryset = queryset.filter(batch_id__scheme_id=scheme_id)
        if batch_id:
            if isinstance(batch_id, str) and '-' in batch_id:
                # Handle "2025 - 26" or "2025-26"
                batch_year = batch_id.split('-')[0].strip()
                queryset = queryset.filter(batch_id__batch_year=batch_year)
            else:
                queryset = queryset.filter(batch_id=batch_id)
        if academic_year:
            # handle formats like "2025 - 26" or "2025-26"
            academic_year = academic_year.replace(" ", "")
            # Filter reports where academic_year contains the starting year (e.g. 2025)
            queryset = queryset.filter(academic_year__icontains=academic_year[:4])
        if class_name:
            queryset = queryset.filter(class_name=class_name)
        if semester:
            queryset = queryset.filter(semester=semester)
            
        return queryset

    def create(self, request, *args, **kwargs):
        if request.user.role_id.role_name not in ["Admin", "HOD", "Coordinator"]:
            return Response({"error": "Only HODs and Coordinators can upload DAC reports."}, status=status.HTTP_403_FORBIDDEN)
            
        # Intercept string batch_id (e.g. "2025 - 26") and map to pk before validation
        data = request.data.copy()
        batch_val = data.get('batch_id')
        if batch_val and isinstance(batch_val, str) and '-' in batch_val:
            from academics.models import Batch
            year = batch_val.split('-')[0].strip()
            batch = Batch.objects.filter(batch_year=year).first()
            if batch:
                data['batch_id'] = batch.pk
            else:
                data.pop('batch_id', None)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and not self.request.user.is_anonymous else None
        
        instance = serializer.save(uploaded_by=user)
        
        # Log the upload action
        if user:
            log_action(user, 'CREATE', 'DACReport', instance.dac_report_id, remark=f"Uploaded DAC Report: {instance.file.name}")

class DACReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DACReport.objects.all()
    serializer_class = DACReportSerializer
    
    def perform_update(self, serializer):
        user = self.request.user if self.request.user and not self.request.user.is_anonymous else None
        instance = serializer.save()
        if user:
            log_action(user, 'UPDATE', 'DACReport', instance.dac_report_id, remark=f"Updated DAC Report: {instance.file.name}")

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.file and not os.path.exists(instance.file.path):
            # Graceful error if file is missing (uploaded files cannot be regenerated)
            return Response({
                "error": "The uploaded DAC report file is missing from the server storage.",
                "detail": "Storage on Render is ephemeral. Please re-upload the document."
            }, status=status.HTTP_404_NOT_FOUND)
        return super().get(request, *args, **kwargs)

    def perform_destroy(self, instance):
        user = self.request.user if self.request.user and not self.request.user.is_anonymous else None
        
        # Log the delete action
        if user:
            log_action(user, 'DELETE', 'DACReport', instance.dac_report_id, remark=f"Deleted DAC Report: {instance.file.name}")
            
        # Delete the file from the disk
        if instance.file and os.path.exists(instance.file.path):
            try:
                os.remove(instance.file.path)
            except Exception:
                pass
                
        instance.delete()

class AuditPeriodListView(generics.ListAPIView):
    queryset = AuditPeriod.objects.all().order_by('-started_at')
    serializer_class = AuditPeriodSerializer
    permission_classes = [IsAuthenticated]

class AuditorBoardView(APIView):
    def get(self, request):
        """
        Retrieves the board content for a specific period.
        - Auditor role: retrieve their own board.
        - Other roles: retrieve the board for the first available auditor.
        """
        role_name = request.user.role_id.role_name if request.user.role_id else ''
        period_id = request.query_params.get('period_id')
        
        if period_id:
            period = get_object_or_404(AuditPeriod, pk=period_id)
        else:
            period = AuditPeriod.objects.filter(is_active=True).first()
            if not period:
                # If no active period, just return the last period
                period = AuditPeriod.objects.order_by('-started_at').first()
        
        if not period:
            return Response({'content': None, 'audit_period': None}, status=status.HTTP_200_OK)

        if role_name == 'Auditor':
            # Auditor fetches their own board for the selected period
            board, created = AuditorBoard.objects.get_or_create(user=request.user, audit_period=period)
        else:
            # Others: find the first Auditor user's board for this period
            from users.models import User
            auditor_user = User.objects.filter(role_id__role_name='Auditor').first()
            if auditor_user:
                board, created = AuditorBoard.objects.get_or_create(user=auditor_user, audit_period=period)
            else:
                return Response({'content': None, 'audit_period': period.id}, status=status.HTTP_200_OK)
        
        serializer = AuditorBoardSerializer(board)
        return Response(serializer.data)

    def patch(self, request):
        role_name = request.user.role_id.role_name if request.user.role_id else ''
        if role_name != 'Auditor':
            return Response({"error": "Only auditors can update remarks."}, status=status.HTTP_403_FORBIDDEN)
        
        if not request.user.is_active:
            return Response({"error": "Account frozen. Cannot save remarks."}, status=status.HTTP_403_FORBIDDEN)

        # Sync changes ONLY to the currently active period
        period = AuditPeriod.objects.filter(is_active=True).first()
        if not period:
            return Response({"error": "No active audit period found. Cannot save remarks."}, status=status.HTTP_400_BAD_REQUEST)
        
        board, created = AuditorBoard.objects.get_or_create(user=request.user, audit_period=period)
        
        serializer = AuditorBoardSerializer(board, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
