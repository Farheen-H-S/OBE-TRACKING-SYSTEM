from django.urls import path
from .views import (
    ReportListCreateView, ReportDetailView, 
    ReportVerificationView, ApproveReportView, RejectReportView
)

urlpatterns = [
    path('', ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
    path('verification/', ReportVerificationView.as_view(), name='report-verification'),
    path('<int:pk>/approve/', ApproveReportView.as_view(), name='report-approve'),
    path('<int:pk>/reject/', RejectReportView.as_view(), name='report-reject'),
]
