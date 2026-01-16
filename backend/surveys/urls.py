from django.urls import path
from .views import SurveyMasterListCreateView, SurveyMasterDetailView, SubmitSurveyResponseView

urlpatterns = [
    path('', SurveyMasterListCreateView.as_view(), name='survey-list'),
    path('<int:pk>/', SurveyMasterDetailView.as_view(), name='survey-detail'),
    path('respond/', SubmitSurveyResponseView.as_view(), name='survey-respond'),
]
