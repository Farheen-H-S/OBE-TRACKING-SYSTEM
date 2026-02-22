from django.urls import path
from .views import (
    AssessmentListCreateAPIView, AssessmentDetailAPIView,
    SaveAssessmentMarksView, EvidenceUploadView, EvidenceListView,
    CisEvidenceUploadView
)

urlpatterns = [
    path('', AssessmentListCreateAPIView.as_view(), name='assessment-list-create'),
    path('<int:pk>/', AssessmentDetailAPIView.as_view(), name='assessment-detail'),
    path('marks/', SaveAssessmentMarksView.as_view(), name='save-assessment-marks'),
    path('<int:pk>/evidence/', EvidenceUploadView.as_view(), name='evidence-upload'),
    path('<int:pk>/evidence/', EvidenceListView.as_view(), name='evidence-list'),
    path('cis-evidence/upload/', CisEvidenceUploadView.as_view(), name='cis-evidence-upload'),
]
