from django.urls import path
from .views import (
    ReportListCreateView, ReportDetailView, DownloadReportView,
    ReportVerificationView, ApproveReportView, RejectReportView,
    DACReportListCreateView, DACReportDetailView,
    ApproveDACReportView, RejectDACReportView,
    AuditorBoardView, AuditPeriodListView
)

urlpatterns = [
    path('', ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
    path('<int:pk>/download/', DownloadReportView.as_view(), name='report-download'),
    path('verification/', ReportVerificationView.as_view(), name='report-verification'),
    path('<int:pk>/approve/', ApproveReportView.as_view(), name='report-approve'),
    path('<int:pk>/reject/', RejectReportView.as_view(), name='report-reject'),
    
    # DAC Reports
    path('dac-reports/', DACReportListCreateView.as_view(), name='dac-report-list-create'),
    path('dac-reports/<int:pk>/', DACReportDetailView.as_view(), name='dac-report-detail'),
    path('dac-reports/<int:pk>/approve/', ApproveDACReportView.as_view(), name='dac-report-approve'),
    path('dac-reports/<int:pk>/reject/', RejectDACReportView.as_view(), name='dac-report-reject'),
    path('auditor-board/', AuditorBoardView.as_view(), name='auditor-board'),
    path('audit-periods/', AuditPeriodListView.as_view(), name='audit-periods'),
]
