from django.urls import path
from .views import (
    UserListCreateAPIView, UserDetailAPIView, 
    RoleListAPIView
)

urlpatterns = [
    path('users/', UserListCreateAPIView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserDetailAPIView.as_view(), name='user-detail'),
    path('roles/', RoleListAPIView.as_view(), name='role-list'),
]
