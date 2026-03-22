from django.urls import path
from .views import (
    CalculateAttainmentView, COAttainmentView, POAttainmentView, 
    PSOAttainmentView, CreateSnapshotView, SnapshotHistoryView,
    BatchEvaluationReportView, IndirectAttainmentReportView, 
    IndirectAttainmentSummaryView, SubmitATRView,
    POContributingCoursesView, PSOContributingCoursesView, 
    CourseCOBreakdownView, CourseStatusView,
    POBatchAttainmentView, PSOBatchAttainmentView
)

urlpatterns = [
    path('calculate/', CalculateAttainmentView.as_view(), name='calculate-attainment'),
    path('co/', COAttainmentView.as_view(), name='co-attainment'),
    path('po/', POAttainmentView.as_view(), name='po-attainment'),
    path('pso/', PSOAttainmentView.as_view(), name='pso-attainment'),
    path('snapshot/', CreateSnapshotView.as_view(), name='create-snapshot'),
    path('snapshot/history/', SnapshotHistoryView.as_view(), name='snapshot-history'),
    path('batch-report/', BatchEvaluationReportView.as_view(), name='batch-evaluation-report'),
    path('indirect-report/', IndirectAttainmentReportView.as_view(), name='indirect-attainment-report'),
    path('indirect-summary/', IndirectAttainmentSummaryView.as_view(), name='indirect-attainment-summary'),
    path('atr/submit/', SubmitATRView.as_view(), name='submit-atr'),
    path('po/<int:po_id>/courses/', POContributingCoursesView.as_view(), name='po-contributing-courses'),
    path('pso/<int:pso_id>/courses/', PSOContributingCoursesView.as_view(), name='pso-contributing-courses'),
    path('course/<int:course_id>/cos/', CourseCOBreakdownView.as_view(), name='course-co-breakdown'),
    path('course-status/', CourseStatusView.as_view(), name='course-status'),
    path('po/batch/', POBatchAttainmentView.as_view(), name='po-batch-attainment'),
    path('pso/batch/', PSOBatchAttainmentView.as_view(), name='pso-batch-attainment'),
]

