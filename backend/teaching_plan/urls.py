from django.urls import path
from .views import TeachingPlanListCreateView, TeachingPlanDetailView, BulkUploadTopicsView

urlpatterns = [
    path('', TeachingPlanListCreateView.as_view(), name='teaching-plan-list'),
    path('<int:pk>/', TeachingPlanDetailView.as_view(), name='teaching-plan-detail'),
    path('<int:pk>/upload-topics/', BulkUploadTopicsView.as_view(), name='upload-topics'),
]
