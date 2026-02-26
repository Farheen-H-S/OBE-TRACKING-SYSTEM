from django.core.mail import send_mail
from django.conf import settings
from .models import Notification
import logging

logger = logging.getLogger(__name__)

def send_obe_notification(recipient, title, message, notification_type='INFO', module='GENERAL', priority='NORMAL', action_link=None, send_email=True):
    """
    Sends a system notification. 
    1. Creates an in-app Notification record with module/priority/link.
    2. Sends an email if requested AND recipient is NOT a student.
    """
    try:
        # 1. Create In-App Notification
        Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            module=module,
            priority=priority,
            action_link=action_link
        )
        
        # 2. Send Email (Only for non-students)
        is_student = (recipient.role_id and recipient.role_id.role_name.lower() == 'student')
        if send_email and recipient.email and not is_student:
            # Prefix title with priority if it's Critical
            subject = f"[{priority}] {title}" if priority == 'CRITICAL' else title
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=False,
            )
            return True
            
    except Exception as e:
        logger.error(f"Failed to send notification to {recipient.email}: {str(e)}")
        return False
    
    return True

def broadcast_notification(recipients_queryset, title, message, notification_type='INFO', module='GENERAL', priority='NORMAL', action_link=None, send_email=True):
    """
    Sends notification to a group of users.
    Efficiently handles bulk email and database records.
    """
    try:
        # 1. Bulk create in-app notifications
        notifications = [
            Notification(
                recipient=user,
                title=title,
                message=message,
                notification_type=notification_type,
                module=module,
                priority=priority,
                action_link=action_link
            ) for user in recipients_queryset
        ]
        Notification.objects.bulk_create(notifications)

        # 2. Bulk Email (Filter out students)
        if send_email:
            # Only send emails to users whose role is NOT 'Student'
            staff_recipients = recipients_queryset.exclude(role_id__role_name__iexact='Student')
            email_list = list(staff_recipients.values_list('email', flat=True))
            
            if email_list:
                from django.core.mail import get_connection, EmailMessage
                connection = get_connection()
                
                subject = f"[{priority}] {title}" if priority == 'CRITICAL' else title
                messages = [
                    EmailMessage(subject, message, settings.DEFAULT_FROM_EMAIL, [email], connection=connection)
                    for email in email_list if email
                ]
                connection.send_messages(messages)
                
        return True
    except Exception as e:
        logger.error(f"Broadcast failed: {str(e)}")
        return False
