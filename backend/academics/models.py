from django.db import models

class Program(models.Model):
    program_id = models.AutoField(primary_key=True)
    program_name = models.CharField(max_length=100)
    duration = models.IntegerField(default=4)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.program_name

class Scheme(models.Model):
    scheme_id = models.AutoField(primary_key=True)
    scheme_name = models.CharField(max_length=100)
    start_year = models.IntegerField()
    end_year = models.IntegerField(null=True, blank=True)  # Optional
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.scheme_name

class Batch(models.Model):
    batch_id = models.AutoField(primary_key=True)
    batch_year = models.IntegerField(help_text="Year of admission (start)")
    start_year = models.IntegerField(null=True, blank=True)
    end_year = models.IntegerField(null=True, blank=True)
    scheme_id = models.ForeignKey(Scheme, on_delete=models.PROTECT, related_name='batches', db_column='scheme_id')
    # program_id removed: batches are global across departments
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Batches"
        unique_together = ('scheme_id', 'batch_year')

    def __str__(self):
        return f"{self.batch_year} ({self.scheme_id.scheme_name})"

class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    course_code = models.CharField(max_length=20)
    course_name = models.CharField(max_length=100)
    semester = models.IntegerField()
    program_id = models.ForeignKey(Program, on_delete=models.PROTECT, related_name='courses', db_column='p_id')
    scheme_id = models.ForeignKey(Scheme, on_delete=models.PROTECT, related_name='courses', db_column='scheme_id', null=True, blank=True)
    course_title = models.CharField(max_length=200, null=True, blank=True)
    course_abbr = models.CharField(max_length=50, null=True, blank=True)
    class_year = models.CharField(max_length=20, null=True, blank=True) # FY, SY, TY
    assessment_tools = models.JSONField(default=dict, null=True, blank=True)
    is_internal = models.BooleanField(default=True) # True = Internal, False = External
    co_status = models.CharField(max_length=20, default='PENDING') # PENDING, COMPLETED
    mapping_status = models.CharField(max_length=20, default='PENDING') # PENDING, COMPLETED
    course_atr = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    batches = models.ManyToManyField(Batch, related_name='courses', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('course_code', 'program_id')

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

class CO(models.Model):
    co_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='cos', db_column='c_id')
    co_number = models.CharField(max_length=20, help_text="co1/co2/co3 etc")
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Course Outcome"
        verbose_name_plural = "Course Outcomes"
        unique_together = ('course_id', 'co_number')

    def __str__(self):
        return f"{self.course_id.course_code} - {self.co_number}"

class PO(models.Model):
    po_id = models.AutoField(primary_key=True)
    program_id = models.ForeignKey(Program, on_delete=models.PROTECT, related_name='pos', db_column='p_id', null=True, blank=True)
    po_number = models.CharField(max_length=20, help_text="po1/po2/po3 etc")
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Program Outcome"
        verbose_name_plural = "Program Outcomes"

    def __str__(self):
        return self.po_number

class PSO(models.Model):
    pso_id = models.AutoField(primary_key=True)
    program_id = models.ForeignKey(Program, on_delete=models.PROTECT, related_name='psos', db_column='p_id')
    pso_number = models.CharField(max_length=20, help_text="pso1/pso2")
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Program Specific Outcome"
        verbose_name_plural = "Program Specific Outcomes"
        unique_together = ('program_id', 'pso_number')

    def __str__(self):
        return f"{self.program_id.program_name} - {self.pso_number}"

class COPOMapping(models.Model):
    mapping_id = models.AutoField(primary_key=True)
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, related_name='po_mappings', db_column='co_id')
    po_id = models.ForeignKey(PO, on_delete=models.PROTECT, related_name='co_mappings', db_column='po_id')
    weightage = models.IntegerField(null=True, blank=True, help_text="mapping weight 1/2/3")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('co_id', 'po_id')

    def __str__(self):
        return f"{self.co_id.co_number} - {self.po_id.po_number} ({self.weightage})"

class COPSOMapping(models.Model):
    mapping_id = models.AutoField(primary_key=True)
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, related_name='pso_mappings', db_column='co_id')
    pso_id = models.ForeignKey(PSO, on_delete=models.PROTECT, related_name='co_mappings', db_column='pso_id')
    weightage = models.IntegerField(null=True, blank=True, help_text="mapping weight 1/2/3")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('co_id', 'pso_id')

    def __str__(self):
        return f"{self.co_id.co_number} - {self.pso_id.pso_number} ({self.weightage})"

class COTarget(models.Model):
    target_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey(Course, on_delete=models.PROTECT, db_column='course_id')
    co_id = models.ForeignKey(CO, on_delete=models.PROTECT, db_column='co_id', null=True, blank=True)
    academic_year = models.CharField(max_length=9)
    target_value = models.FloatField()
    set_by = models.ForeignKey('users.User', on_delete=models.PROTECT, null=True, blank=True, db_column='set_by')
    status = models.CharField(max_length=20, default='PENDING') # PENDING, SUBMITTED, APPROVED, REJECTED
    remarks = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'academics_co_target'

class POTarget(models.Model):
    target_id = models.AutoField(primary_key=True)
    po_id = models.ForeignKey(PO, on_delete=models.PROTECT, db_column='po_id')
    academic_year = models.CharField(max_length=9)
    target_value = models.FloatField()
    set_by = models.ForeignKey('users.User', on_delete=models.PROTECT, null=True, blank=True, db_column='set_by')
    status = models.CharField(max_length=20, default='PENDING')
    remarks = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'academics_po_target'
        unique_together = ('po_id', 'academic_year')

class PSOTarget(models.Model):
    target_id = models.AutoField(primary_key=True)
    pso_id = models.ForeignKey(PSO, on_delete=models.PROTECT, db_column='pso_id')
    academic_year = models.CharField(max_length=9)
    target_value = models.FloatField()
    set_by = models.ForeignKey('users.User', on_delete=models.PROTECT, null=True, blank=True, db_column='set_by')
    status = models.CharField(max_length=20, default='PENDING')
    remarks = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'academics_pso_target'
        unique_together = ('pso_id', 'academic_year')

class AcademicSetup(models.Model):
    SEMESTER_CHOICES = [
        ('Odd', 'Odd'),
        ('Even', 'Even'),
    ]
    
    academic_year = models.CharField(max_length=15, help_text="Example: 2025 - 26")
    scheme_id = models.ForeignKey(Scheme, on_delete=models.CASCADE, db_column='scheme_id')
    semester_type = models.CharField(max_length=10, choices=SEMESTER_CHOICES)
    curriculum_link = models.URLField(max_length=500, default="https://econtent.msbte.edu.in/curriculum_search/")
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.pk and AcademicSetup.objects.exists():
            existing = AcademicSetup.objects.first()
            self.pk = existing.pk
        super(AcademicSetup, self).save(*args, **kwargs)

    def __str__(self):
        return f"Academic Setup: {self.academic_year}, {self.scheme_id.scheme_name}, {self.semester_type}"

class ProgramStatement(models.Model):
    STATEMENT_TYPE_CHOICES = [
        ('INSTITUTE_VISION', 'Institute Vision'),
        ('INSTITUTE_MISSION', 'Institute Mission'),
        ('DEPT_VISION', 'Department Vision'),
        ('DEPT_MISSION', 'Department Mission'),
    ]
    statement_id = models.AutoField(primary_key=True)
    program_id = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='statements', db_column='p_id')
    statement_type = models.CharField(max_length=50, choices=STATEMENT_TYPE_CHOICES)
    statement_number = models.CharField(max_length=10, null=True, blank=True, help_text="M1, M2 etc.")
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_program_statement'
        verbose_name = "Program Statement"
        verbose_name_plural = "Program Statements"

    def __str__(self):
        return f"{self.program_id.program_name} - {self.statement_type} {self.statement_number or ''}"

class PEO(models.Model):
    peo_id = models.AutoField(primary_key=True)
    program_id = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='peos', db_column='p_id')
    peo_number = models.CharField(max_length=20, help_text="PEO 1, PEO 2 etc.")
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_peo'
        verbose_name = "Program Educational Objective"
        verbose_name_plural = "Program Educational Objectives"

    def __str__(self):
        return f"{self.program_id.program_name} - {self.peo_number}"
