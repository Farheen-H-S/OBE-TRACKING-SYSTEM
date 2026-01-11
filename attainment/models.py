from django.db import models
from academics.models import Course, CO, PO, PSO

class COAttainment(models.Model):
    attainment_id = models.AutoField(primary_key=True)
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id')
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    direct_attainment = models.FloatField()
    indirect_attainment = models.FloatField()
    overall_attainment = models.FloatField()
    gap = models.FloatField()
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'attainment_co_attainment'

class CourseAttainment(models.Model):
    attainment_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    direct_attainment = models.FloatField()
    indirect_attainment = models.FloatField()
    overall_attainment = models.FloatField()
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'attainment_course_attainment'

class COPOMappingAttainment(models.Model):
    mapping_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id')
    po_id = models.ForeignKey(PO, on_delete=models.PROTECT, db_column='po_id')
    direct_attainment = models.FloatField()
    indirect_attainment = models.FloatField()
    co_po_weightage = models.FloatField()
    final_po_contribution = models.FloatField()
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'attainment_co_po_mapping'

class AttainmentSnapshot(models.Model):
    snapshot_id = models.AutoField(primary_key=True)
    month = models.IntegerField(null=True, blank=True)
    year = models.CharField(max_length=9)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id', null=True, blank=True)
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id', null=True, blank=True)
    po_id = models.ForeignKey(PO, on_delete=models.PROTECT, db_column='po_id', null=True, blank=True)
    pso_id = models.ForeignKey(PSO, on_delete=models.PROTECT, db_column='pso_id', null=True, blank=True)
    attainment_value = models.FloatField()
    calculation_date = models.DateTimeField(auto_now_add=True)
    verified_by = models.ForeignKey('users.User', on_delete=models.PROTECT, db_column='verified_by')
    remarks = models.TextField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)

    class Meta:
        db_table = 'attainment_snapshot'
