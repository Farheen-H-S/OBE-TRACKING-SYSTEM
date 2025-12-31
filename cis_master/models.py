from django.db import models

class CISNature(models.Model):
    nature_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True, help_text="Direct / Indirect")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "CIS Nature"
        verbose_name_plural = "CIS Natures"

class CISType(models.Model):
    type_id = models.AutoField(primary_key=True)
    nature_id = models.ForeignKey(CISNature, on_delete=models.CASCADE, related_name='types', db_column='nature_id')
    type_name = models.CharField(max_length=255, help_text="Internal / External / Co-curricular")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.type_name} ({self.nature_id.name})"

    class Meta:
        verbose_name = "CIS Type"
        verbose_name_plural = "CIS Types"

class CISTerm(models.Model):
    term_id = models.AutoField(primary_key=True)
    type_id = models.ForeignKey(CISType, on_delete=models.CASCADE, related_name='terms', db_column='type_id')
    term_code = models.CharField(max_length=50, help_text="FA-TH / SA-PR / CES")
    term_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.term_code} - {self.term_name}"

    class Meta:
        verbose_name = "CIS Term"
        verbose_name_plural = "CIS Terms"
