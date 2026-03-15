from django.urls import path
from .views import (
    SurveyMasterListCreateView, 
    SurveyMasterDetailView, 
    SubmitSurveyResponseView, 
    SurveyStatsView, 
    SurveyLookupView, 
    SurveyExportView,
    CheckSurveyParticipationView
)

urlpatterns = [
    path('', SurveyMasterListCreateView.as_view(), name='survey-list'),
    path('lookup/', SurveyLookupView.as_view(), name='survey-lookup'),
    path('check-participation/', CheckSurveyParticipationView.as_view(), name='check-participation'),
    path('<int:pk>/', SurveyMasterDetailView.as_view(), name='survey-detail'),
    path('respond/', SubmitSurveyResponseView.as_view(), name='survey-respond'),
    path('<int:survey_id>/responses/', SurveyStatsView.as_view(), name='survey-stats'),
    path('<int:pk>/export/', SurveyExportView.as_view(), name='survey-export'),
]
