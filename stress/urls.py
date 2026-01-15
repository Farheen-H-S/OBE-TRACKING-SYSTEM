from django.urls import path
from .views import (
    StressMasterListCreateView, 
    StressMasterDetailView, 
    StressResponseCreateView,
    SurveySessionTokenCreateView
)

urlpatterns = [
    path('surveys/', StressMasterListCreateView.as_view(), name='stress-survey-list'),
    path('surveys/<int:pk>/', StressMasterDetailView.as_view(), name='stress-survey-detail'),
    path('responses/', StressResponseCreateView.as_view(), name='stress-response-create'),
    path('tokens/', SurveySessionTokenCreateView.as_view(), name='stress-token-create'),
]
