from django.db import models

class Survey(models.Model):
    survey_id = models.AutoField(primary_key=True)
    survey_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.survey_name
