from django.db import models
from academics.models import Course
from users.models import User

class Report(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reports')
    year = models.CharField(max_length=20, help_text="Academic Year")
    report_file = models.FileField(upload_to='reports/', help_text="PDF Report")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_reports', help_text="Author")
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_reports', help_text="Coordinator/HOD")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft', help_text="draft/approved/rejected")
    auditor_remark = models.TextField(blank=True, null=True, help_text="Auditor comments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report for {self.course.course_code} ({self.year})"
