from django.db import models
from academics.models import Course
from users.models import User


class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('Direct', 'Direct Attainment'),
        ('Indirect', 'Indirect Attainment'),
        ('Batch', 'Batch evaluation (PO/PSO)'),
    ]

    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Pending', 'Pending Approval'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Verified', 'Verified'),
    ]

    report_id = models.AutoField(primary_key=True)

    course_id = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name='reports',
        db_column='course_id',
        null=True,
        blank=True
    )

    program_id = models.ForeignKey(
        'academics.Program',
        on_delete=models.PROTECT,
        related_name='reports',
        db_column='program_id',
        null=True,
        blank=True
    )

    batch_id = models.ForeignKey(
        'academics.Batch',
        on_delete=models.PROTECT,
        related_name='reports',
        db_column='batch_id',
        null=True,
        blank=True
    )

    report_type = models.CharField(
        max_length=20,
        choices=REPORT_TYPE_CHOICES,
        default='Direct'
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

class DACReport(models.Model):
    dac_report_id = models.AutoField(primary_key=True)
    
    program_id = models.ForeignKey(
        'academics.Program',
        on_delete=models.PROTECT,
        related_name='dac_reports',
        db_column='program_id'
    )
    
    batch_id = models.ForeignKey(
        'academics.Batch',
        on_delete=models.SET_NULL,
        related_name='dac_reports',
        db_column='batch_id',
        null=True,
        blank=True
    )
    
    academic_year = models.CharField(
        max_length=20,
        help_text="Academic Year (e.g., 2025 - 26)"
    )
    
    class_name = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text="e.g., FY, SY, TY, Final Year"
    )
    
    semester = models.CharField(
        max_length=5,
        blank=True,
        null=True,
        help_text="e.g., 1, 2, 3..."
    )
    
    file = models.FileField(
        upload_to='dac_reports/',
        help_text="DAC Report file (PDF or Excel)"
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_dac_reports',
        db_column='uploaded_by'
    )
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    status = models.CharField(
        max_length=20,
        default='Pending',
        help_text="Pending/Approved/Rejected/Verified"
    )
    
    auditor_remark = models.TextField(
        blank=True,
        null=True,
        help_text="Rejection reason or auditor comments"
    )
    
    def __str__(self):
        return f"DAC Report - {self.academic_year}"

class AuditPeriod(models.Model):
    label = models.CharField(max_length=100)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.label

class AuditorBoard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='remarks_boards')
    audit_period = models.ForeignKey(AuditPeriod, on_delete=models.CASCADE, related_name='boards', null=True, blank=True)
    content = models.TextField(null=True, blank=True, help_text="JSON representation of the unified grid")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'audit_period')

    def __str__(self):
        return f"Board for {self.user.name} - {self.audit_period.label}"
