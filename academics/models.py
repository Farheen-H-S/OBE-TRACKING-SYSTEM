from django.db import models

class Program(models.Model):
    program_id = models.AutoField(primary_key=True)
    program_name = models.CharField(max_length=100)
    duration = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_program'

    def __str__(self):
        return self.program_name

class Scheme(models.Model):
    scheme_id = models.AutoField(primary_key=True)
    scheme_name = models.CharField(max_length=50)
    start_year = models.IntegerField()
    end_year = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_scheme'

    def __str__(self):
        return self.scheme_name

class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    course_code = models.CharField(max_length=20)
    course_name = models.CharField(max_length=150)
    semester = models.IntegerField()
    program_id = models.ForeignKey(Program, on_delete=models.PROTECT, db_column='program_id')
    scheme_id = models.ForeignKey(Scheme, on_delete=models.PROTECT, db_column='scheme_id')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_course'
        unique_together = ('course_code', 'scheme_id')

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

class CO(models.Model):
    co_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    co_number = models.CharField(max_length=10)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_co'
        unique_together = ('course_id', 'co_number')

    def __str__(self):
        return f"{self.co_number} ({self.course_id.course_code})"

class PO(models.Model):
    po_id = models.AutoField(primary_key=True)
    program_id = models.ForeignKey(Program, on_delete=models.PROTECT, db_column='program_id')
    po_number = models.CharField(max_length=10)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_po'
        unique_together = ('program_id', 'po_number')

    def __str__(self):
        return self.po_number

class PSO(models.Model):
    pso_id = models.AutoField(primary_key=True)
    program_id = models.ForeignKey(Program, on_delete=models.PROTECT, db_column='program_id')
    pso_number = models.CharField(max_length=10)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_pso'
        unique_together = ('program_id', 'pso_number')

    def __str__(self):
        return self.pso_number

class COPOMapping(models.Model):
    mapping_id = models.AutoField(primary_key=True)
    co_id = models.ForeignKey(CO, on_delete=models.CASCADE, db_column='co_id')
    po_id = models.ForeignKey(PO, on_delete=models.CASCADE, db_column='po_id')
    weightage = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_copo_mapping'
        unique_together = ('co_id', 'po_id')

class COPSOMapping(models.Model):
    mapping_id = models.AutoField(primary_key=True)
    co_id = models.ForeignKey(CO, on_delete=models.CASCADE, db_column='co_id')
    pso_id = models.ForeignKey(PSO, on_delete=models.CASCADE, db_column='pso_id')
    weightage = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_copso_mapping'
        unique_together = ('co_id', 'pso_id')

class Batch(models.Model):
    batch_id = models.AutoField(primary_key=True)
    batch_year = models.IntegerField()
    program_id = models.ForeignKey(Program, on_delete=models.PROTECT, db_column='program_id')
    scheme_id = models.ForeignKey(Scheme, on_delete=models.PROTECT, db_column='scheme_id')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_batch'
        unique_together = ('batch_year', 'program_id')
        verbose_name_plural = "Batches"

    def __str__(self):
        return f"{self.program_id.program_name} - {self.batch_year}"

class COTarget(models.Model):
    target_id = models.AutoField(primary_key=True)
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id')
    academic_year = models.CharField(max_length=9)
    batch_id = models.ForeignKey(Batch, on_delete=models.PROTECT, db_column='batch_id', null=True, blank=True)
    target_value = models.FloatField()
    set_by = models.ForeignKey('users.User', on_delete=models.PROTECT, db_column='set_by')
    status = models.CharField(max_length=20, default='PENDING', choices=[
        ('PENDING', 'Pending'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ])
    remarks = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'co_target'
        unique_together = ('co_id', 'academic_year', 'batch_id')

    def __str__(self):
        return f"Target for {self.co_id.co_number} ({self.academic_year})"
