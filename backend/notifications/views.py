from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from rest_framework import serializers

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:20]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

class MarkNotificationReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response({"status": "read"})
        except Notification.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

class OTSAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, Q
        
        # Security: HOD/Admin only
        user_role = getattr(request.user.role_id, 'role_name', '').upper()
        if user_role not in ['HOD', 'ADMIN']:
            return Response({"error": "Unauthorized"}, status=403)

        # 1. Module Distribution
        module_stats = Notification.objects.values('module').annotate(
            total=Count('notification_id'),
            unread=Count('notification_id', filter=Q(is_read=False))
        ).order_by('-total')

        # 2. Priority Stats
        priority_stats = Notification.objects.values('priority').annotate(
            total=Count('notification_id')
        )

        return Response({
            "modules": module_stats,
            "priorities": priority_stats,
            "system_health": "Healthy",
            "active_users": User.objects.filter(is_active=True).count()
        })
from users.models import User, UserRole
from .utils import broadcast_notification

class BroadcastNotificationAPIView(APIView):
    """
    Allows HODs or Admins to send a notification to all users of a specific role.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check permissions (HOD or Admin)
        user_role = getattr(request.user.role_id, 'role_name', '').upper()
        if user_role not in ['HOD', 'ADMIN']:
            return Response({"error": "Unauthorized. Only HODs or Admins can broadcast."}, status=403)

        role_to_target = request.data.get('target_role') 
        user_id = request.data.get('user_id')
        title = request.data.get('title')
        message = request.data.get('message')
        n_type = request.data.get('type', 'INFO') 
        module = request.data.get('module', 'GENERAL')
        priority = request.data.get('priority', 'NORMAL')
        action_link = request.data.get('action_link')
        send_email = request.data.get('send_email', True)

        if not role_to_target and not user_id:
            return Response({"error": "target_role or user_id is required"}, status=400)
            
        if not title or not message:
            return Response({"error": "title and message are required"}, status=400)

        # 1. Determine Recipients
        if role_to_target == 'SingleUser' and user_id:
            recipients = User.objects.filter(pk=user_id)
        elif role_to_target == 'AllStaff':
            # Target everything except Students
            recipients = User.objects.exclude(role_id__role_name__iexact='Student').filter(is_active=True)
        elif isinstance(role_to_target, list):
            # Target specific list of roles
            recipients = User.objects.filter(role_id__role_name__in=role_to_target, is_active=True)
        elif isinstance(role_to_target, str) and ',' in role_to_target:
            # Handle comma-separated string
            roles = [r.strip() for r in role_to_target.split(',')]
            recipients = User.objects.filter(role_id__role_name__in=roles, is_active=True)
        else:
            # Single role name
            target_role_obj = UserRole.objects.filter(role_name__iexact=role_to_target).first()
            if not target_role_obj:
                return Response({"error": f"Role '{role_to_target}' not found"}, status=404)
            recipients = User.objects.filter(role_id=target_role_obj, is_active=True)
        
        if not recipients.exists():
            return Response({"error": "No active users found for the target selection"}, status=404)

        success = broadcast_notification(
            recipients_queryset=recipients, 
            title=title, 
            message=message, 
            notification_type=n_type,
            module=module,
            priority=priority,
            action_link=action_link,
            send_email=send_email
        )
        
        if success:
            msg = f"Message sent to {recipients.count()} user(s)."
            return Response({"message": msg})
        else:
            return Response({"error": "Failed to send broadcast"}, status=500)
