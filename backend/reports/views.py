from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer
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
