from django.db import models
from users.models import User

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('INFO', 'Information'),
        ('SUCCESS', 'Success'),
        ('WARNING', 'Warning'),
        ('DANGER', 'Alert/Danger'),
    ]

    notification_id = models.AutoField(primary_key=True)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES, default='INFO')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.name} - {self.title}"
