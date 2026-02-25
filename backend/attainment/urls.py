from django.urls import path
from .views import (
    CalculateAttainmentView, COAttainmentView, POAttainmentView, 
    CalculateAttainmentView, COAttainmentView, POAttainmentView, 
    PSOAttainmentView, CreateSnapshotView, SnapshotHistoryView,
    BatchEvaluationReportView
)

urlpatterns = [
    path('calculate/', CalculateAttainmentView.as_view(), name='calculate-attainment'),
    path('co/', COAttainmentView.as_view(), name='co-attainment'),
    path('po/', POAttainmentView.as_view(), name='po-attainment'),
    path('pso/', PSOAttainmentView.as_view(), name='pso-attainment'),
    path('snapshot/', CreateSnapshotView.as_view(), name='create-snapshot'),
    path('snapshot/history/', SnapshotHistoryView.as_view(), name='snapshot-history'),
    path('batch-report/', BatchEvaluationReportView.as_view(), name='batch-evaluation-report'),
]
