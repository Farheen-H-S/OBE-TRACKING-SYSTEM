from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# m1: stress_survey (Master)
class StressMaster(models.Model):
    survey_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255, help_text="Survey title")
    month = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        help_text="1-12"
    )
    year = models.IntegerField()
    is_active = models.BooleanField(default=False, help_text="Only one survey active at a time")
    end_date = models.DateTimeField(null=True, blank=True, help_text="Deadline for survey submission")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stress_survey"
        unique_together = ('month', 'year')

    def save(self, *args, **kwargs):
        if self.is_active:
            # Ensure only one survey is active at a time
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
        help_text="Academic/Emotional/Lifestyle"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "stress_category"

    def __str__(self):
        return self.name


# m3: stress_question
class StressQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    survey_id = models.ForeignKey(
        StressMaster,
        on_delete=models.CASCADE,
        related_name='questions',
        db_column='survey_id'
    )
    category_id = models.ForeignKey(
        StressCategory,
        on_delete=models.CASCADE,
        related_name='questions',
        db_column='category_id'
    )
    question_text = models.TextField(help_text="The actual question text")
    is_reverse = models.BooleanField(default=False, help_text="If true, high score (4) is good/positive. If false, high score (4) is stress.")
    is_active = models.BooleanField(default=True, help_text="Enables/disables question")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stress_question"
        unique_together = ('survey_id', 'question_text')

    def __str__(self):
        return f"[{self.category_id.name}] {self.question_text[:50]}"


# m4: stress_session_token (Anonymous Access)
class SurveySessionToken(models.Model):
    token_id = models.AutoField(primary_key=True)
    token = models.CharField(max_length=255, unique=True, help_text="Unique anonymous token")
    survey_id = models.ForeignKey(
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


# m5: stress_response
class StressResponse(models.Model):
    response_id = models.AutoField(primary_key=True)
    token = models.ForeignKey(
        SurveySessionToken,
        on_delete=models.CASCADE,
        related_name='responses',
        to_field='token',
        db_column='token'
    )
    survey_id = models.ForeignKey(
        StressMaster,
        on_delete=models.CASCADE,
        related_name='responses',
        db_column='survey_id'
    )
    question_id = models.ForeignKey(
        StressQuestion,
        on_delete=models.CASCADE,
        related_name='responses',
        db_column='question_id'
    )
    response_value = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(4)],
        help_text="Scale 0-4"
    )
    batch_id = models.ForeignKey(
        'academics.Batch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="batch_id",
        related_name="stress_responses"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stress_response"
        unique_together = ('token', 'question_id')

    def __str__(self):
        return f"Response {self.response_value} for {self.question_id}"
