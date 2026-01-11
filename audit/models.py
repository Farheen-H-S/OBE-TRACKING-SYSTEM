from django.db import models
from users.models import User, UserRole

class AuditLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    performed_by = models.ForeignKey(User, on_delete=models.PROTECT, db_column='performed_by')
    entity_name = models.CharField(max_length=100)
    entity_id = models.IntegerField()
    action = models.CharField(max_length=50) # CREATE, UPDATE, DELETE
    details = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_log'

class ApprovalAction(models.Model):
    action_id = models.AutoField(primary_key=True)
    entity_name = models.CharField(max_length=100) # Mapping, Target, Assessment, etc.
    entity_id = models.IntegerField()
    action = models.CharField(max_length=20, choices=[
        ('SUBMIT', 'Submit'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
    ])
    performed_by = models.ForeignKey(User, on_delete=models.PROTECT, db_column='performed_by')
    role_id = models.ForeignKey(UserRole, on_delete=models.PROTECT, db_column='role_id')
    remark = models.TextField(null=True, blank=True)
    performed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_approval_action'
