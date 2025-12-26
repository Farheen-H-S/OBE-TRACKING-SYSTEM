from django.db import models
import uuid

class StressSurvey(models.Model):
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
    name = models.CharField(max_length=255, help_text="academic/emotional/lifestyle")

    def __str__(self):
        return self.name

class StressQuestion(models.Model):
    survey = models.ForeignKey(StressSurvey, on_delete=models.CASCADE, related_name='questions')
    category = models.ForeignKey(StressCategory, on_delete=models.CASCADE, related_name='questions')
    # 'question_text' field inferred as necessary despite not being explicitly in the truncated table description
    question_text = models.TextField(help_text="The actual question text")
    is_active = models.BooleanField(default=True, help_text="Enables/disables question")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.category.name}] {self.question_text[:50]}"

class SurveySessionToken(models.Model):
    token = models.CharField(max_length=255, unique=True, help_text="Unique anonymous token")
    survey = models.ForeignKey(StressSurvey, on_delete=models.CASCADE)
    is_used = models.BooleanField(default=False, help_text="Prevents duplicate submission")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.token

class StressResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.CharField(max_length=255, help_text="Anonymous session token")
    survey = models.ForeignKey(StressSurvey, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(StressQuestion, on_delete=models.CASCADE, related_name='responses')
    response_value = models.IntegerField(help_text="Scale 0-4")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Response {self.response_value} for {self.question}"
