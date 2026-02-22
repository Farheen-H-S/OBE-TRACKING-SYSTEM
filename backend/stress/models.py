from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# m1: stress_survey (Monthly approved survey)
class StressMaster(models.Model):
    survey_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255, help_text="Survey title")
    month = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        help_text="1-12"
    )
    year = models.IntegerField()
    approved_question_set = models.ForeignKey(
        'StressQuestionSet',
        on_delete=models.PROTECT,
        related_name='surveys',
        db_column='question_set_id'
    )
    is_active = models.BooleanField(default=False, help_text="Only one survey active at a time")
    end_date = models.DateTimeField(null=True, blank=True, help_text="Deadline for survey submission")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stress_survey"
        unique_together = ('month', 'year')

    def save(self, *args, **kwargs):
        if self.is_active:
            StressMaster.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.month}/{self.year})"


# m2: stress_category
class StressCategory(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="Academic / Emotional / Lifestyle"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "stress_category"

    def __str__(self):
        return self.name


# m3: stress_question (Global question bank)
class StressQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    category = models.ForeignKey(
        StressCategory,
        on_delete=models.PROTECT,
        related_name='questions',
        db_column='category_id'
    )
    question_text = models.TextField(unique=True)
    is_reverse = models.BooleanField(
        default=False,
        help_text="If true, high score (4) is positive. If false, high score indicates stress."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "stress_question"

    def __str__(self):
        return f"[{self.category.name}] {self.question_text[:50]}"


# m4: stress_question_set (Predefined sets)
class StressQuestionSet(models.Model):
    question_set_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stress_question_set"

    def __str__(self):
        return self.name


# m5: stress_question_set_question (Mapping table)
class StressQuestionSetQuestion(models.Model):
    question_set = models.ForeignKey(
        StressQuestionSet,
        on_delete=models.CASCADE,
        related_name='set_questions',
        db_column='question_set_id'
    )
    question = models.ForeignKey(
        StressQuestion,
        on_delete=models.PROTECT,
        related_name='question_sets',
        db_column='question_id'
    )

    class Meta:
        db_table = "stress_question_set_question"
        unique_together = ('question_set', 'question')


# m6: stress_session_token (Anonymous access)
class SurveySessionToken(models.Model):
    token_id = models.AutoField(primary_key=True)
    token = models.CharField(max_length=255, unique=True, help_text="Unique anonymous token")
    survey = models.ForeignKey(
        StressMaster,
        on_delete=models.CASCADE,
        related_name='tokens',
        db_column='survey_id'
    )
    is_used = models.BooleanField(default=False, help_text="Prevents duplicate submission")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stress_session_token"

    def __str__(self):
        return self.token


# m7: stress_response
class StressSubmission(models.Model):
    submission_id = models.AutoField(primary_key=True)

    token = models.OneToOneField(
        SurveySessionToken,
        on_delete=models.CASCADE,
        related_name='submission',
    )

    survey = models.ForeignKey(
        StressMaster,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_column='survey_id'
    )

    batch = models.ForeignKey(
        'academics.Batch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stress_submissions'
    )

    submitted_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.token.survey_id != self.survey_id:
            raise ValueError("Token does not belong to this survey")
        super().save(*args, **kwargs)

    class Meta:
        db_table = "stress_submission"

class StressAnswer(models.Model):
    answer_id = models.AutoField(primary_key=True)

    submission = models.ForeignKey(
        StressSubmission,
        on_delete=models.CASCADE,
        related_name='answers',
        db_column='submission_id'
    )

    question = models.ForeignKey(
        StressQuestion,
        on_delete=models.PROTECT,
        db_column='question_id'
    )

    response_value = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(4)]
    )

    class Meta:
        db_table = "stress_answer"
        unique_together = ('submission', 'question')


# INITIAL
# class StressResponse(models.Model):
#     response_id = models.AutoField(primary_key=True)
#     token = models.ForeignKey(
#         SurveySessionToken,
#         on_delete=models.CASCADE,
#         related_name='responses',
#         to_field='token',
#         db_column='token'
#     )
#     survey = models.ForeignKey(
#         StressMaster,
#         on_delete=models.CASCADE,
#         related_name='responses',
#         db_column='survey_id'
#     )
#     question = models.ForeignKey(
#         StressQuestion,
#         on_delete=models.CASCADE,
#         related_name='responses',
#         db_column='question_id'
#     )
#     response_value = models.IntegerField(
#         validators=[MinValueValidator(0), MaxValueValidator(4)],
#         help_text="Scale 0-4"
#     )
#     batch = models.ForeignKey(
#         'academics.Batch',
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         db_column="batch_id",
#         related_name="stress_responses"
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#
#     class Meta:
#         db_table = "stress_response"
#         unique_together = ('token', 'question')
#
#     def __str__(self):
#         return f"Response {self.response_value} for {self.question_id}"

class StressActionPlan(models.Model):
    action_id = models.AutoField(primary_key=True)
    survey = models.ForeignKey(
        'StressMaster',
        on_delete=models.CASCADE,
        related_name='action_plans',
        db_column='survey_id'
    )
    batch = models.ForeignKey(
        'academics.Batch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stress_action_plans'
    )
    analysis_remarks = models.TextField(help_text="HOD's analysis of the stress data")
    action_taken = models.TextField(help_text="Steps taken to address high stress")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "stress_action_plan"
        unique_together = ('survey', 'batch')

    def __str__(self):
        batch_name = self.batch.batch_name if self.batch else "Overall"
        return f"Action Plan for {self.survey.title} - {batch_name}"
