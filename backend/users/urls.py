from django.urls import path
from .views import (
    UserListCreateAPIView, UserDetailAPIView, 
    RoleListAPIView, LoginAPIView, LogoutAPIView,
    UserProfileAPIView, StudentListCreateAPIView, StudentDetailAPIView,
    ForgotPasswordAPIView, ResetPasswordAPIView
)
from rest_framework_simplejwt.views import TokenRefreshView
from .dashboard_views import AdminDashboardAPIView
from .hod_dashboard_views import HODDashboardAPIView
from .faculty_dashboard_views import FacultyDashboardAPIView
from .coordinator_dashboard_views import CoordinatorDashboardAPIView
from .auditor_dashboard_views import AuditorDashboardAPIView

urlpatterns = [
    path('auth/forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordAPIView.as_view(), name='reset-password'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('profile/', UserProfileAPIView.as_view(), name='user-profile'),
    path('', UserListCreateAPIView.as_view(), name='user-list-create'),
    path('dashboard/', AdminDashboardAPIView.as_view(), name='admin-dashboard'),
    path('hod-dashboard/', HODDashboardAPIView.as_view(), name='hod-dashboard'),
    path('faculty-dashboard/', FacultyDashboardAPIView.as_view(), name='faculty-dashboard'),
    path('coordinator-dashboard/', CoordinatorDashboardAPIView.as_view(), name='coordinator-dashboard'),
    path('auditor-dashboard/', AuditorDashboardAPIView.as_view(), name='auditor-dashboard'),
    path('<int:pk>/', UserDetailAPIView.as_view(), name='user-detail'),
    path('roles/', RoleListAPIView.as_view(), name='role-list'),
    path('students/', StudentListCreateAPIView.as_view(), name='student-list-create'),
    path('students/<int:pk>/', StudentDetailAPIView.as_view(), name='student-detail'),
]
