from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Report, DACReport
from .serializers import ReportSerializer, DACReportSerializer
from audit.utils import log_action

class ReportListCreateView(generics.ListCreateAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

class ReportVerificationView(generics.ListAPIView):
    """
    List reports that are pending verification (Draft or Pending).
    """
    serializer_class = ReportSerializer
    
    def get_queryset(self):
        return Report.objects.filter(status__in=['Draft', 'Pending']).order_by('-created_at')

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
            report.save()
            
            # Log action
            user = request.user if request.user and not request.user.is_anonymous else None
            log_action(user, 'UPDATE', 'Report', pk, remark=f"Report rejected: {remark}")
            
            return Response({"message": "Report rejected successfully"}, status=status.HTTP_200_OK)
        except Report.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

class DACReportListCreateView(generics.ListCreateAPIView):
    serializer_class = DACReportSerializer

    def get_queryset(self):
        queryset = DACReport.objects.all().order_by('-uploaded_at')
        
        # Apply filters if provided
        program_id = self.request.query_params.get('program_id')
        batch_id = self.request.query_params.get('batch_id')
        academic_year = self.request.query_params.get('academic_year')
        class_name = self.request.query_params.get('class_name')
        semester = self.request.query_params.get('semester')
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
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

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and not self.request.user.is_anonymous else None
        
        # If batch_id is a string year, resolve it
        batch_id = self.request.data.get('batch_id')
        if batch_id and isinstance(batch_id, str) and '-' in batch_id:
            from academics.models import Batch
            year = batch_id.split('-')[0].strip()
            batch = Batch.objects.filter(batch_year=year).first()
            if batch:
                serializer.validated_data['batch_id'] = batch
        
        instance = serializer.save(uploaded_by=user)
        
        # Log the upload action
        if user:
            log_action(user, 'CREATE', 'DACReport', instance.dac_report_id, remark=f"Uploaded DAC Report: {instance.file.name}")

class DACReportDetailView(generics.RetrieveDestroyAPIView):
    queryset = DACReport.objects.all()
    serializer_class = DACReportSerializer
    
    def perform_destroy(self, instance):
        user = self.request.user if self.request.user and not self.request.user.is_anonymous else None
        
        # Log the delete action
        if user:
            log_action(user, 'DELETE', 'DACReport', instance.dac_report_id, remark=f"Deleted DAC Report: {instance.file.name}")
            
        instance.delete()
