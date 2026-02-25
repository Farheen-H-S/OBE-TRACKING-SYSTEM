from django.urls import path
from .views import BulkStudentUploadView, BulkMarksUploadView, DownloadStudentTemplateView, PromoteStudentsView

urlpatterns = [
    path('students/', BulkStudentUploadView.as_view(), name='bulk-student-upload'),
    path('students/template/', DownloadStudentTemplateView.as_view(), name='download-student-template'),
    path('students/promote/', PromoteStudentsView.as_view(), name='promote-students'),
    path('marks/', BulkMarksUploadView.as_view(), name='bulk-marks-upload'),
]
