from django.urls import path
from .views import (
    CalculateAttainmentView, COAttainmentView, POAttainmentView, 
    PSOAttainmentView, CreateSnapshotView, SnapshotHistoryView
)

urlpatterns = [
    path('attainment/calculate/', CalculateAttainmentView.as_view(), name='calculate-attainment'),
    path('attainment/co/', COAttainmentView.as_view(), name='co-attainment'),
    path('attainment/po/', POAttainmentView.as_view(), name='po-attainment'),
    path('attainment/pso/', PSOAttainmentView.as_view(), name='pso-attainment'),
    path('attainment/snapshot/', CreateSnapshotView.as_view(), name='create-snapshot'),
    path('attainment/snapshot/history/', SnapshotHistoryView.as_view(), name='snapshot-history'),
]
