from django.urls import path
from .views import (
    ProgramListCreateAPIView, ProgramDetailAPIView,
    CourseListCreateAPIView, CourseDetailAPIView,
    CourseCOListCreateAPIView, CODetailAPIView,
    POListCreateAPIView, PODetailAPIView,
    PSOListCreateAPIView, PSODetailAPIView,
    MappingListCreateAPIView,
    TargetListCreateAPIView, TargetDetailAPIView,
    TargetSubmitAPIView, TargetApproveAPIView, TargetRejectAPIView,
    AcademicSetupAPIView, SchemeListAPIView, SchemeDetailAPIView,
    BatchListAPIView, BatchDetailAPIView,
    ProgramStatementListCreateAPIView, PEOListCreateAPIView,
    CourseAssignmentAPIView, MyCoursesAPIView,
    COListAPIView
)

urlpatterns = [
    # Global Academic Setup
    path('academic-setup/', AcademicSetupAPIView.as_view(), name='academic-setup'),
    # Schemes
    path('schemes/list/', SchemeListAPIView.as_view(), name='scheme-list'),
    path('schemes/', SchemeListAPIView.as_view(), name='scheme-create'),
    path('schemes/<int:pk>/', SchemeDetailAPIView.as_view(), name='scheme-detail'),
    # Batches
    path('batches/list/', BatchListAPIView.as_view(), name='batch-list'),
    path('batches/', BatchListAPIView.as_view(), name='batch-create'),
    path('batches/<int:pk>/', BatchDetailAPIView.as_view(), name='batch-detail'),
    # Programs
    path('programs/', ProgramListCreateAPIView.as_view(), name='program-list-create'),
    path('programs/<int:pk>/', ProgramDetailAPIView.as_view(), name='program-detail'),

    # Courses
    path('courses/', CourseListCreateAPIView.as_view(), name='course-list-create'),
    path('courses/<int:pk>/', CourseDetailAPIView.as_view(), name='course-detail'),
    path('assign-course/', CourseAssignmentAPIView.as_view(), name='course-assign'),
    path('my-courses/', MyCoursesAPIView.as_view(), name='my-courses'),

    # Course Outcomes (COs)
    path('cos/', COListAPIView.as_view(), name='co-list'),
    path('courses/<int:course_id>/cos/', CourseCOListCreateAPIView.as_view(), name='course-co-list-create'),
    path('cos/<int:pk>/', CODetailAPIView.as_view(), name='co-detail'),

    # POs & PSOs
    path('pos/', POListCreateAPIView.as_view(), name='po-list-create'),
    path('pos/<int:pk>/', PODetailAPIView.as_view(), name='po-detail'),
    path('psos/', PSOListCreateAPIView.as_view(), name='pso-list-create'),
    path('psos/<int:pk>/', PSODetailAPIView.as_view(), name='pso-detail'),

    # CO–PO / CO–PSO Mapping
    path('mappings/', MappingListCreateAPIView.as_view(), name='mapping-list-create'),

    # CO Targets
    path('targets/', TargetListCreateAPIView.as_view(), name='target-list-create'),
    path('targets/<int:pk>/', TargetDetailAPIView.as_view(), name='target-detail'),
    path('targets/<int:pk>/submit/', TargetSubmitAPIView.as_view(), name='target-submit'),
    path('targets/<int:pk>/approve/', TargetApproveAPIView.as_view(), name='target-approve'),
    path('targets/<int:pk>/reject/', TargetRejectAPIView.as_view(), name='target-reject'),

    # Program Statements & PEOs
    path('program-statements/', ProgramStatementListCreateAPIView.as_view(), name='program-statement-list-create'),
    path('peos/', PEOListCreateAPIView.as_view(), name='peo-list-create'),
]
