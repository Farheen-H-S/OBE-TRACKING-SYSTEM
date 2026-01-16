from django.urls import path
from .views import CourseIndirectAttainmentListCreateView, ActivityIndirectAttainmentListCreateView

urlpatterns = [
    path('course/', CourseIndirectAttainmentListCreateView.as_view(), name='course-indirect-attainment-list'),
    path('activity/', ActivityIndirectAttainmentListCreateView.as_view(), name='activity-indirect-attainment-list'),
]
