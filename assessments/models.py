from django.db import models
from academics.models import Course, CO
from users.models import User, Student

class Assessment(models.Model):
    assessment_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    assessment_name = models.CharField(max_length=100)
    assessment_type = models.CharField(max_length=50) # Exam, Quiz, Assignment, etc.
    max_marks = models.IntegerField()
    weightage = models.FloatField()
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField()
    evidence_file = models.FileField(upload_to='assessments/evidence/', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, db_column='created_by')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'assessments_assessment'

    def __str__(self):
        return f"{self.assessment_name} - {self.course_id.course_name} ({self.academic_year})"

class AssessmentCOMapping(models.Model):
    mapping_id = models.AutoField(primary_key=True)
    assessment_id = models.ForeignKey(Assessment, on_delete=models.CASCADE, db_column='assessment_id')
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id')
    co_weightage = models.FloatField()

    class Meta:
        db_table = 'assessments_assessment_co_mapping'

    def __str__(self):
        return f"{self.assessment_id.assessment_name} - {self.co_id.co_number}"

class MarksEntry(models.Model):
    entry_id = models.AutoField(primary_key=True)
    assessment_id = models.ForeignKey(Assessment, on_delete=models.PROTECT, db_column='assessment_id')
    student_id = models.ForeignKey(Student, on_delete=models.PROTECT, db_column='student_id')
    marks_obtained = models.FloatField()
    entered_by = models.ForeignKey(User, on_delete=models.PROTECT, db_column='entered_by')
    entered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assessments_marks_entry'

    def __str__(self):
        return f"{self.student_id.name} - {self.assessment_id.assessment_name}"
