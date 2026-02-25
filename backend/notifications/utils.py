from django.core.mail import send_mail
from django.conf import settings
from .models import Notification
import logging

logger = logging.getLogger(__name__)

def send_obe_notification(recipient, title, message, notification_type='INFO', send_email=True):
    """
    Sends a system notification. 
    1. Creates an in-app Notification record.
    2. Sends an email if requested.
    """
    try:
        # 1. Create In-App Notification
        Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type
        )
        
        # 2. Send Email
        if send_email and recipient.email:
            send_mail(
                subject=title,
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
