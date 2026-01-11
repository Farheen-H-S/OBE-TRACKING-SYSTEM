from django.db import models
from academics.models import Course
from users.models import User

class TeachingPlan(models.Model):
    id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    faculty = models.ForeignKey(User, on_delete=models.CASCADE)
    academic_year = models.CharField(max_length=9)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Plan for {self.course.course_code}"
