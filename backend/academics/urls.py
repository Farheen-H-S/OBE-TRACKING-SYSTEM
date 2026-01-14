from django.urls import path
from .views import (
    ProgramListCreateAPIView, ProgramDetailAPIView,
    CourseListCreateAPIView, CourseDetailAPIView,
    CourseCOListCreateAPIView, CODetailAPIView,
    POListAPIView, PODetailAPIView,
    PSOListAPIView, PSODetailAPIView,
    MappingListCreateAPIView,
    TargetListCreateAPIView, TargetDetailAPIView,
    TargetSubmitAPIView, TargetApproveAPIView, TargetRejectAPIView
)

urlpatterns = [
    # Programs
    path('programs/', ProgramListCreateAPIView.as_view(), name='program-list-create'),
    path('programs/<int:pk>/', ProgramDetailAPIView.as_view(), name='program-detail'),

    # Courses
    path('courses/', CourseListCreateAPIView.as_view(), name='course-list-create'),
    path('courses/<int:pk>/', CourseDetailAPIView.as_view(), name='course-detail'),

    # Course Outcomes (COs)
    path('courses/<int:course_id>/cos/', CourseCOListCreateAPIView.as_view(), name='course-co-list-create'),
    path('cos/<int:pk>/', CODetailAPIView.as_view(), name='co-detail'),

    # POs & PSOs
    path('pos/', POListAPIView.as_view(), name='po-list'),
    path('pos/<int:pk>/', PODetailAPIView.as_view(), name='po-detail'),
    path('psos/', PSOListAPIView.as_view(), name='pso-list'),
    path('psos/<int:pk>/', PSODetailAPIView.as_view(), name='pso-detail'),

    # CO–PO / CO–PSO Mapping
    path('mappings/', MappingListCreateAPIView.as_view(), name='mapping-list-create'),

    # CO Targets
    path('targets/', TargetListCreateAPIView.as_view(), name='target-list-create'),
    path('targets/<int:pk>/', TargetDetailAPIView.as_view(), name='target-detail'),
    path('targets/<int:pk>/submit/', TargetSubmitAPIView.as_view(), name='target-submit'),
    path('targets/<int:pk>/approve/', TargetApproveAPIView.as_view(), name='target-approve'),
    path('targets/<int:pk>/reject/', TargetRejectAPIView.as_view(), name='target-reject'),
]
