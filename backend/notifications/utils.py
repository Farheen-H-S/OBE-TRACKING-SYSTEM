from django.core.mail import send_mail
from django.conf import settings
from .models import Notification
import logging
import smtplib
import threading

logger = logging.getLogger(__name__)

def _send_email_async(subject, message, recipient_list):
    """Internal helper to send email in a thread with retry logic."""
    from django.core.mail import send_mail
    import time
    
    max_retries = 3
    retry_delay = 5 # seconds
    
    for attempt in range(max_retries):
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                fail_silently=False,
            )
            logger.info(f"Background email delivered successfully to {recipient_list}")
            return # Success
        except Exception as e:
            logger.warning(
                f"Attempt {attempt + 1}/{max_retries} failed for {recipient_list}: "
                f"{type(e).__name__}: {e}"
            )
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                logger.error(f"All {max_retries} attempts failed for {recipient_list}")

def _broadcast_email_async(subject, message, email_list):
    """Internal helper to send bulk emails in a thread with retry logic."""
    from django.core.mail import get_connection, EmailMessage
    import time
    
    max_retries = 2
    retry_delay = 10 # seconds
    
    for attempt in range(max_retries):
        try:
            connection = get_connection()
            messages = [
                EmailMessage(subject, message, settings.DEFAULT_FROM_EMAIL, [email], connection=connection)
                for email in email_list if email
            ]
            connection.send_messages(messages)
            logger.info(f"Background broadcast delivered successfully to {len(email_list)} users.")
            return # Success
        except Exception as e:
            logger.warning(
                f"Broadcast attempt {attempt + 1}/{max_retries} failed: "
                f"{type(e).__name__}: {e}"
            )
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                logger.error(f"Broadcasting failed after {max_retries} attempts.")

def send_obe_notification(recipient, title, message, notification_type='INFO', module='GENERAL', priority='NORMAL', action_link=None, send_email=True):
    """
    Sends a system notification. 
    1. Creates an in-app Notification record with module/priority/link.
    2. Attempts to send an email if requested AND recipient is NOT a student.
       Email errors (e.g. invalid/test addresses) are caught and logged so the
       in-app notification is always created successfully.
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
    except Exception as e:
        logger.error(f"Failed to create in-app notification for {getattr(recipient, 'email', '?')}: {e}")
        return False

    # 2. Send Email (Only for non-students)
    is_student = (recipient.role_id and recipient.role_id.role_name.lower() == 'student')
    if send_email and recipient.email and not is_student:
        subject = f"[{priority}] {title}" if priority == 'CRITICAL' else title
        # Dispatch to background thread to prevent timeout
        threading.Thread(
            target=_send_email_async,
            args=(subject, message, [recipient.email]),
            daemon=True
        ).start()

    return True


def broadcast_notification(recipients_queryset, title, message, notification_type='INFO', module='GENERAL', priority='NORMAL', action_link=None, send_email=True):
    """
    Sends notification to a group of users.
    Efficiently handles bulk email and database records.
    Email delivery errors (e.g. test/sample addresses) are caught and logged
    so that in-app notifications are always created.
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
    except Exception as e:
        logger.error(f"Failed to bulk-create in-app notifications: {e}")
        return False

    # 2. Bulk Email (Filter out students)
    if send_email:
        staff_recipients = recipients_queryset.exclude(role_id__role_name__iexact='Student')
        email_list = list(staff_recipients.values_list('email', flat=True))

        if email_list:
            subject = f"[{priority}] {title}" if priority == 'CRITICAL' else title
            # Dispatch to background thread to prevent timeout
            threading.Thread(
                target=_broadcast_email_async,
                args=(subject, message, email_list),
                daemon=True
            ).start()

    return True
