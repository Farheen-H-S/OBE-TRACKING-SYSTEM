from django.db import models
from users.models import User

class BulkUploadJob(models.Model):
    MODULE_CHOICES = [
        ('students', 'Students'),
        ('CIS', 'CIS'),
        ('marks', 'Marks'),
        ('target', 'Target'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.AutoField(primary_key=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, db_column='uploaded_by')
    module_name = models.CharField(max_length=50, choices=MODULE_CHOICES)
    file_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_rows = models.IntegerField(null=True, blank=True)
    success_rows = models.IntegerField(null=True, blank=True)
    failed_rows = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bulk_upload_job'
        verbose_name = 'Bulk Upload Job'
        verbose_name_plural = 'Bulk Upload Jobs'

    def __str__(self):
        return f"{self.module_name} - {self.file_name} ({self.status})"
