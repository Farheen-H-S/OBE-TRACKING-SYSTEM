from django.urls import path
from .views import (
    CalculateDirectCISView, DirectCISReportView,
    ListIndirectToolsView, SubmitIndirectSurveyView,
    IndirectCISReportView
)

urlpatterns = [
    path('direct/', CalculateDirectCISView.as_view(), name='calculate-direct-cis'),
    path('direct/report/', DirectCISReportView.as_view(), name='direct-cis-report'),
    path('indirect/tools/', ListIndirectToolsView.as_view(), name='list-indirect-tools'),
    path('indirect/surveys/', SubmitIndirectSurveyView.as_view(), name='submit-indirect-survey'),
    path('indirect/report/', IndirectCISReportView.as_view(), name='indirect-cis-report'),
]
