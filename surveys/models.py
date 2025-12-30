from django.db import models

class SurveyMaster(models.Model):
    CATEGORY_CHOICES = [
        ('feedback', 'Feedback'),
        ('course_exit', 'Course Exit'),
        ('indirect', 'Indirect'),
    ]

    survey_id = models.AutoField(primary_key=True)
    survey_name = models.CharField(max_length=150)
    survey_category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField(null=True, blank=True)
    course = models.ForeignKey('academics.Course', on_delete=models.SET_NULL, null=True, blank=True, db_column='course_id')
    is_anonymous = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'survey_master'
        verbose_name = "Survey Master"
        verbose_name_plural = "Survey Masters"

    def __str__(self):
        return self.survey_name


class SurveyQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    survey = models.ForeignKey(SurveyMaster, on_delete=models.CASCADE, db_column='survey_id', related_name='questions')
    question_text = models.TextField()
    co = models.ForeignKey('academics.CO', on_delete=models.SET_NULL, null=True, blank=True, db_column='co_id')
    po = models.ForeignKey('academics.PO', on_delete=models.SET_NULL, null=True, blank=True, db_column='po_id')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'survey_question'
        verbose_name = "Survey Question"
        verbose_name_plural = "Survey Questions"

    def __str__(self):
        return f"Q: {self.question_text[:50]}..."


class SurveyResponse(models.Model):
    response_id = models.AutoField(primary_key=True)
    survey = models.ForeignKey(SurveyMaster, on_delete=models.CASCADE, db_column='survey_id', related_name='responses')
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, db_column='question_id', related_name='responses')
    student = models.ForeignKey('users.Student', on_delete=models.SET_NULL, null=True, blank=True, db_column='student_id')
    faculty = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, db_column='faculty_id')
    response_value = models.IntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'survey_response'
        verbose_name = "Survey Response"
        verbose_name_plural = "Survey Responses"

    def __str__(self):
        return f"Response to {self.survey.survey_name} (ID: {self.response_id})"
