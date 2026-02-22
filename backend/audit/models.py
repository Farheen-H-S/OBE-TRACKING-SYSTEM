from django.db import models

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'CREATE'),
        ('UPDATE', 'UPDATE'),
        ('DISABLE', 'DISABLE'),
        ('APPROVE', 'APPROVE'),
        ('VERIFY', 'VERIFY'),
        ('CALCULATE', 'CALCULATE'),
        ('LOCK', 'LOCK'),
        ('UNLOCK', 'UNLOCK'),
    ]

    log_id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(
        'users.User', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        db_column='user_id'
    )
    role_id = models.ForeignKey(
        'users.UserRole', 
        on_delete=models.PROTECT, 
        db_column='role_id'
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    entity_name = models.CharField(max_length=100)
    entity_id = models.IntegerField()
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    remark = models.TextField(null=True, blank=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} on {self.entity_name} ({self.entity_id})"

    class Meta:
        db_table = 'audit_log'
