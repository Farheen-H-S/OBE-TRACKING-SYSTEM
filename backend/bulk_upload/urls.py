from django.urls import path
from .views import (
    BulkStudentUploadView, BulkMarksUploadView, DownloadStudentTemplateView, 
    PromoteStudentsView, BulkCISUploadView, BulkCourseUploadView,
    DownloadCourseTemplateView, DownloadCISTemplateView,
    DownloadCISMultiSheetTemplateView, BulkCISApplyView
)

urlpatterns = [
    path('students/', BulkStudentUploadView.as_view(), name='bulk-student-upload'),
    path('students/template/', DownloadStudentTemplateView.as_view(), name='download-student-template'),
    path('students/promote/', PromoteStudentsView.as_view(), name='promote-students'),
    path('marks/', BulkMarksUploadView.as_view(), name='bulk-marks-upload'),
    path('cis/', BulkCISUploadView.as_view(), name='bulk-cis-upload'),
    path('cis/template-multi/', DownloadCISMultiSheetTemplateView.as_view(), name='download-cis-template-multi'),
    path('cis/bulk-apply/', BulkCISApplyView.as_view(), name='bulk-cis-apply'),
    path('cis/template/', DownloadCISTemplateView.as_view(), name='download-cis-template'),
    path('courses/', BulkCourseUploadView.as_view(), name='bulk-course-upload'),
    path('courses/template/', DownloadCourseTemplateView.as_view(), name='download-course-template'),
]
