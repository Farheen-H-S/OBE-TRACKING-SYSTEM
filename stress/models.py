from django.db import models
import uuid

class StressSurvey(models.Model):
    survey_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255, help_text="survey title")
    month = models.IntegerField(help_text="1/12")
    year = models.IntegerField()
    is_active = models.BooleanField(default=False, help_text="only one survey active at a time")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_active:
            # Deactivate all other surveys
            StressSurvey.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super(StressSurvey, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.month}/{self.year})"

class StressCategory(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, help_text="academic/emotional/lifestyle")

    def __str__(self):
        return self.name

class StressQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    survey_id = models.ForeignKey(StressSurvey, on_delete=models.CASCADE, related_name='questions', db_column='survey_id')
    category_id = models.ForeignKey(StressCategory, on_delete=models.CASCADE, related_name='questions', db_column='category_id')
    # 'question_text' field inferred as necessary despite not being explicitly in the truncated table description
    question_text = models.TextField(help_text="The actual question text")
    is_active = models.BooleanField(default=True, help_text="Enables/disables question")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.category_id.name}] {self.question_text[:50]}"

class SurveySessionToken(models.Model):
    token_id = models.AutoField(primary_key=True)
    token = models.CharField(max_length=255, unique=True, help_text="Unique anonymous token")
    survey_id = models.ForeignKey(StressSurvey, on_delete=models.CASCADE, db_column='survey_id')
    is_used = models.BooleanField(default=False, help_text="Prevents duplicate submission")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.token

class StressResponse(models.Model):
    response_id = models.AutoField(primary_key=True)
    token = models.CharField(max_length=255, help_text="Anonymous session token")
    survey_id = models.ForeignKey(StressSurvey, on_delete=models.CASCADE, related_name='responses', db_column='survey_id')
    question_id = models.ForeignKey(StressQuestion, on_delete=models.CASCADE, related_name='responses', db_column='question_id')
    response_value = models.IntegerField(help_text="Scale 0-4")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Response {self.response_value} for {self.question_id}"
