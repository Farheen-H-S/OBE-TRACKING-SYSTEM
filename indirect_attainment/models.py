from django.db import models
from academics.models import Course, CO
from users.models import Student

class IndirectAttainment(models.Model):
    record_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.CASCADE)
    co_id = models.ForeignKey(CO, on_delete=models.CASCADE)
    student_id = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True)
    ACTIVITY_TYPES = [
        ('Co-curricular', 'Co-curricular'),
        ('Industrial Visit', 'Industrial Visit'),
        ('Extra-curricular', 'Extra-curricular'),
    ]
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.course_id.course_code} - {self.activity_type}"
