from django.db import models
from academics.models import Course, CO
from users.models import User, Student

class Assessment(models.Model):
    assessment_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.CASCADE)
    assessment_name = models.CharField(max_length=100)
    ASSESSMENT_TYPES = [
        ('CIS', 'CIS'),
        ('SAR', 'SAR'),
        ('OTHER', 'OTHER'),
    ]
    assessment_type = models.CharField(max_length=20, choices=ASSESSMENT_TYPES)
    max_marks = models.IntegerField()
    weightage = models.FloatField()
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField()
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.assessment_name

class AssessmentCOMapping(models.Model):
    mapping_id = models.AutoField(primary_key=True)
    assessment_id = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    co_id = models.ForeignKey(CO, on_delete=models.CASCADE)
    co_weightage = models.FloatField()

    def __str__(self):
        return f"{self.assessment_id.assessment_name} - {self.co_id.co_number}"

class MarksEntry(models.Model):
    entry_id = models.AutoField(primary_key=True)
    assessment_id = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    student_id = models.ForeignKey(Student, on_delete=models.CASCADE)
    marks_obtained = models.FloatField()
    entered_by = models.ForeignKey(User, on_delete=models.PROTECT)
    entered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_id.roll_no} - {self.assessment_id.assessment_name}"
