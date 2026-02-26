from django.urls import path
from .views import NotificationListAPIView, MarkNotificationReadAPIView, BroadcastNotificationAPIView

urlpatterns = [
    path('', NotificationListAPIView.as_view(), name='notification-list'),
    path('broadcast/', BroadcastNotificationAPIView.as_view(), name='broadcast-notification'),
    path('<int:pk>/read/', MarkNotificationReadAPIView.as_view(), name='mark-notification-read'),
]
