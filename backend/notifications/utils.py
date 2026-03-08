from django.core.mail import send_mail
from django.conf import settings
from .models import Notification
import logging
import smtplib

logger = logging.getLogger(__name__)

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
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=False,
            )
        except smtplib.SMTPException as e:
            # Email delivery failed (bad address, auth error, connection issue, etc.)
            # Log a warning and continue — the in-app notification was already saved.
            logger.warning(
                f"Email delivery failed for {recipient.email} (test/sample address?): "
                f"{type(e).__name__}: {e}"
            )
            return True  # In-app notification succeeded
        except Exception as e:
            logger.warning(
                f"Unexpected error sending email to {recipient.email}: {type(e).__name__}: {e}"
            )
            return True  # In-app notification succeeded

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
            try:
                from django.core.mail import get_connection, EmailMessage
                connection = get_connection()
                subject = f"[{priority}] {title}" if priority == 'CRITICAL' else title
                messages = [
                    EmailMessage(subject, message, settings.DEFAULT_FROM_EMAIL, [email], connection=connection)
                    for email in email_list if email
                ]
                connection.send_messages(messages)
            except smtplib.SMTPException as e:
                # Email delivery failed for the batch (bad addresses, auth, etc.)
                logger.warning(
                    f"Broadcast email delivery failed (test/sample addresses?): "
                    f"{type(e).__name__}: {e}"
                )
                return True  # In-app notifications already created
            except Exception as e:
                logger.warning(
                    f"Unexpected error during broadcast email: {type(e).__name__}: {e}"
                )
                return True  # In-app notifications already created

    return True
