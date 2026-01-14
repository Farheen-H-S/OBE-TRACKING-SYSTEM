from django.db import models
from academics.models import Course
from users.models import User


class Report(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    report_id = models.AutoField(primary_key=True)

    course_id = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name='reports',
        db_column='course_id'
    )

    year = models.CharField(
        max_length=20,
        help_text="Academic Year"
    )

    report_file = models.FileField(
        upload_to='reports/',
        help_text="PDF Report"
    )

    user_id_created = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reports',
        help_text="Author",
        db_column='created_by'
    )

    user_id_approved = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_reports',
        help_text="Coordinator/HOD",
        db_column='approved_by'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Draft',
        help_text="draft/approved/rejected"
    )

    auditor_remark = models.TextField(
        blank=True,
        null=True,
        help_text="Auditor comments"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report for {self.course_id.course_code} ({self.year})"
