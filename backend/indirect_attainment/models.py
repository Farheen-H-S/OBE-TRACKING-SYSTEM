from django.db import models
from academics.models import Course, CO
from users.models import Student

class CourseIndirectAttainment(models.Model):
    attainment_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id')
    attainment_value = models.FloatField()
    academic_year = models.CharField(max_length=9)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'indirect_attainment_course'
        unique_together = ('course_id', 'co_id', 'academic_year')

    def __str__(self):
        return f"{self.course_id.course_code} - {self.co_id.co_number}"

class ActivityIndirectAttainment(models.Model):
    activity_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id')
    student_id = models.ForeignKey(Student, on_delete=models.PROTECT, null=True, blank=True, db_column='student_id')
    ACTIVITY_TYPES = [
        ('Co-curricular', 'Co-curricular'),
        ('Industrial Visit', 'Industrial Visit'),
        ('Extra-curricular', 'Extra-curricular'),
    ]
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'indirect_attainment_activity'
        unique_together = ('course_id', 'co_id', 'student_id', 'activity_type')

    def __str__(self):
        return f"{self.course_id.course_code} - {self.activity_type}"
