from django.urls import path
from .views import (
    AssessmentListCreateAPIView, AssessmentDetailAPIView,
    MarksListCreateAPIView, EvidenceUploadView, EvidenceListView
)

urlpatterns = [
    path('', AssessmentListCreateAPIView.as_view(), name='assessment-list-create'),
    path('<int:pk>/', AssessmentDetailAPIView.as_view(), name='assessment-detail'),
    path('marks/', MarksListCreateAPIView.as_view(), name='marks-list-create'),
    path('<int:pk>/evidence/', EvidenceUploadView.as_view(), name='evidence-upload'),
    path('<int:pk>/evidence/list/', EvidenceListView.as_view(), name='evidence-list'),
]
