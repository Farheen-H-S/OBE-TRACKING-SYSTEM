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
    course_id = models.ForeignKey(
        'academics.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='course_id'
    )
    is_anonymous = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'survey_master'
        verbose_name = 'Survey Master'
        verbose_name_plural = 'Survey Masters'

    def __str__(self):
        return self.survey_name


class SurveyQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    survey_id = models.ForeignKey(
        SurveyMaster,
        on_delete=models.PROTECT,
        related_name='questions',
        db_column='survey_id'
    )
    question_text = models.TextField()
    co_id = models.ForeignKey(
        'academics.CO',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='co_id'
    )
    po_id = models.ForeignKey(
        'academics.PO',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='po_id'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'survey_question'
        verbose_name = 'Survey Question'
        verbose_name_plural = 'Survey Questions'

    def __str__(self):
        return f"Q: {self.question_text[:50]}..."


class SurveyResponse(models.Model):
    response_id = models.AutoField(primary_key=True)
    survey_id = models.ForeignKey(
        SurveyMaster,
        on_delete=models.PROTECT,
        related_name='responses',
        db_column='survey_id'
    )
    question_id = models.ForeignKey(
        SurveyQuestion,
        on_delete=models.PROTECT,
        related_name='responses',
        db_column='question_id'
    )
    student_id = models.ForeignKey(
        'users.Student',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='student_id'
    )
    user_id = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='user_id'
    )
    response_value = models.IntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'survey_response'
        verbose_name = 'Survey Response'
        verbose_name_plural = 'Survey Responses'

    def __str__(self):
        return f"Response to {self.survey_id.survey_name} (ID: {self.response_id})"
