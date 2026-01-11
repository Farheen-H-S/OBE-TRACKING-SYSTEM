from django.db import models

class CISNature(models.Model):
    nature_id = models.AutoField(primary_key=True)
    nature_name = models.CharField(max_length=50, unique=True) # Direct / Indirect
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'cis_nature'

class CISType(models.Model):
    type_id = models.AutoField(primary_key=True)
    nature_id = models.ForeignKey(CISNature, on_delete=models.CASCADE, db_column='nature_id')
    type_name = models.CharField(max_length=100) # CO Attainment, PO Attainment, etc.
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'cis_type'

class CISTerm(models.Model):
    term_id = models.AutoField(primary_key=True)
    type_id = models.ForeignKey(CISType, on_delete=models.CASCADE, db_column='type_id')
    term_name = models.CharField(max_length=100) # Sessional 1, Sessional 2, Final Exam
    weightage = models.FloatField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'cis_term'
