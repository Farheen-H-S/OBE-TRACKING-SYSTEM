from django.urls import path
from .views import (
    StressMasterListCreateView, 
    StressMasterDetailView, 
    StressResponseCreateView,
    SurveySessionTokenCreateView,
    StressSurveyAnalyticsView,
    StressCategoryStatsView,
    AnonymousTokenGenerateView,
    StressReportExportView,
    StressQuestionListView
)

urlpatterns = [
    # Questions
    path('questions/', StressQuestionListView.as_view(), name='stress-question-list'),
    # Survey Admin
    path('surveys/', StressMasterListCreateView.as_view(), name='stress-survey-list'),
    path('surveys/<int:pk>/', StressMasterDetailView.as_view(), name='stress-survey-detail'),
    
    # Analytics & Reports
    path('surveys/<int:pk>/analytics/', StressSurveyAnalyticsView.as_view(), name='stress-survey-analytics'),
    path('surveys/<int:pk>/category-stats/', StressCategoryStatsView.as_view(), name='stress-category-stats'),
    path('surveys/<int:pk>/export/', StressReportExportView.as_view(), name='stress-report-export'),
    
    # Public Participation
    path('surveys/<int:pk>/public-entry/', AnonymousTokenGenerateView.as_view(), name='stress-public-entry'),
    path('responses/', StressResponseCreateView.as_view(), name='stress-response-create'),
    
    # Internal Token Management
    path('tokens/', SurveySessionTokenCreateView.as_view(), name='stress-token-create'),
]
