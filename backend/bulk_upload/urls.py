from django.urls import path
from .views import BulkStudentUploadView, BulkMarksUploadView

urlpatterns = [
    path('students/', BulkStudentUploadView.as_view(), name='bulk-student-upload'),
    path('marks/', BulkMarksUploadView.as_view(), name='bulk-marks-upload'),
]
