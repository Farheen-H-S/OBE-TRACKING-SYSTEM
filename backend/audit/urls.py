from django.urls import path
from .views import (
    AuditLogListView, VerifyRecordView, AddRemarkView
)

urlpatterns = [
    path('logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('verify/', VerifyRecordView.as_view(), name='verify-record'),
    path('remark/', AddRemarkView.as_view(), name='add-remark'),
]
