from django.db import models

class TeachingPlan(models.Model):
    teaching_plan_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey('academics.Course', on_delete=models.CASCADE, db_column='course_id')
    user_id = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    batch_id = models.ForeignKey('academics.Batch', on_delete=models.CASCADE, db_column='batch_id')
    scheme_id = models.ForeignKey('academics.Scheme', on_delete=models.CASCADE, db_column='scheme_id')
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_teaching_plan'
        verbose_name = "Teaching Plan"
        verbose_name_plural = "Teaching Plans"

    def __str__(self):
        return f"Plan for {self.course_id} ({self.academic_year})"


class TeachingPlanLecture(models.Model):
    lecture_id = models.AutoField(primary_key=True)
    teaching_plan_id = models.ForeignKey(TeachingPlan, on_delete=models.CASCADE, db_column='teaching_plan_id', related_name='lectures')
    lecture_no = models.IntegerField()
    lecture_date = models.DateField()
    unit_no = models.IntegerField()
    topic_planned = models.TextField()
    actual_topic = models.TextField(null=True, blank=True)
    co_id = models.ForeignKey('academics.CO', on_delete=models.SET_NULL, null=True, db_column='co_id')
    is_completed = models.BooleanField(default=False)
    remark = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_teaching_plan_lecture'
        verbose_name = "Teaching Plan Lecture"
        verbose_name_plural = "Teaching Plan Lectures"

    def __str__(self):
        return f"Lecture {self.lecture_no} - {self.teaching_plan_id}"
