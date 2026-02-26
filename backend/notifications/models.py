from django.db import models
from users.models import User

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('INFO', 'Information'),
        ('SUCCESS', 'Success'),
        ('WARNING', 'Warning'),
        ('DANGER', 'Alert/Danger'),
    ]

    MODULE_CHOICES = [
        ('ATR', 'ATR Module'),
        ('COURSE', 'Course Management'),
        ('REPORT', 'Report Approval'),
        ('SURVEY', 'Survey Module'),
        ('STRESS', 'Stress Analysis'),
        ('AUDIT', 'Audit Module'),
        ('GENERAL', 'General System'),
    ]

    PRIORITY_CHOICES = [
        ('CRITICAL', 'Critical'),
        ('IMPORTANT', 'Important'),
        ('NORMAL', 'Normal'),
    ]

    notification_id = models.AutoField(primary_key=True)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES, default='INFO')
    
    # New Plan Fields
    module = models.CharField(max_length=20, choices=MODULE_CHOICES, default='GENERAL')
    priority = models.CharField(max_length=15, choices=PRIORITY_CHOICES, default='NORMAL')
    action_link = models.CharField(max_length=255, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority}] {self.title} - {self.recipient.name}"
