from django.urls import path
from .views import (
    AuditLogListView, VerifyRecordView, AddRemarkView
)

urlpatterns = [
    path('audit/logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('audit/verify/', VerifyRecordView.as_view(), name='verify-record'),
    path('audit/remark/', AddRemarkView.as_view(), name='add-remark'),
]
