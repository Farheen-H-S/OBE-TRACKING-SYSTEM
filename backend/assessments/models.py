from django.db import models
from academics.models import Course, CO
from users.models import User, Student

class Assessment(models.Model):
    assessment_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    assessment_name = models.CharField(max_length=100)
    ASSESSMENT_TYPES = [
        ('SA_TH', 'Summative Theory'),
        ('FA_TH', 'Formative Theory'),
        ('SA_PR', 'Summative Practical'),
        ('FA_PR', 'Formative Practical'),
        ('SLA', 'Self Learning Assessment'),
        ('CES', 'Course Exit Survey'),
    ]

    assessment_type = models.CharField(max_length=20, choices=ASSESSMENT_TYPES)
    max_marks = models.IntegerField()
    weightage = models.FloatField() # Here, weightage is just internal distribution inside ONE course.
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField()
    user_id = models.ForeignKey(User, on_delete=models.PROTECT, db_column='user_id')

    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (
            'course_id',
            'assessment_name',
            'academic_year',
            'semester'
        )

    def __str__(self):
        return self.assessment_name

class AssessmentCOMapping(models.Model):
    mapping_id = models.AutoField(primary_key=True)
    assessment_id = models.ForeignKey(Assessment, on_delete=models.PROTECT, db_column='assessment_id')
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id')
    co_weightage = models.FloatField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('assessment_id', 'co_id')

    def __str__(self):
        return f"{self.assessment_id.assessment_name} - {self.co_id.co_number}"

class MarksEntry(models.Model):
    entry_id = models.AutoField(primary_key=True)
    assessment_id = models.ForeignKey(Assessment, on_delete=models.PROTECT, db_column='assessment_id')
    student_id = models.ForeignKey(Student, on_delete=models.PROTECT, db_column='student_id')
    marks_obtained = models.FloatField()
    user_id = models.ForeignKey(User, on_delete=models.PROTECT, db_column='user_id')
    entered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('assessment_id', 'student_id')

    def __str__(self):
        return f"{self.student_id.roll_no} - {self.assessment_id.assessment_name}"
