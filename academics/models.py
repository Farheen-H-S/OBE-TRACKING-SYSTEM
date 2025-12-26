from django.db import models

class Program(models.Model):
    program_id = models.AutoField(primary_key=True)
    program_name = models.CharField(max_length=100)

    def __str__(self):
        return self.program_name

class Scheme(models.Model):
    scheme_id = models.AutoField(primary_key=True)
    scheme_name = models.CharField(max_length=100)
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.scheme_name

class Batch(models.Model):
    id = models.AutoField(primary_key=True)
    batch_year = models.IntegerField(help_text="Year of admission")
    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name='batches')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='batches', db_column='p_id')

    class Meta:
        verbose_name_plural = "Batches"

    def __str__(self):
        return f"{self.program.program_name} - {self.batch_year}"

class Course(models.Model):
    id = models.AutoField(primary_key=True)
    course_code = models.CharField(max_length=20)
    course_name = models.CharField(max_length=100)
    semester = models.IntegerField()
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='courses')

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

class CO(models.Model):
    id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='cos')
    co_number = models.CharField(max_length=20, help_text="co1/co2/co3 etc")
    description = models.TextField()
    target = models.FloatField(help_text="Target attainment level")

    class Meta:
        verbose_name = "Course Outcome"
        verbose_name_plural = "Course Outcomes"

    def __str__(self):
        return f"{self.course.course_code} - {self.co_number}"

class PO(models.Model):
    id = models.AutoField(primary_key=True)
    po_number = models.CharField(max_length=20, help_text="po1/po2/po3 etc")
    description = models.TextField()
    attainment = models.FloatField(null=True, blank=True)
    # Adding program link as implied by typical structure, though strict schema didn't show it explicitly, 
    # M5 (PSO) has it, but M4 (PO) doesn't. 
    # I will stick to schema from image strictly for PO to strictly follow "correct output".
    # Wait, if PO doesn't have program, it's global? Let's assume global or shared.

    class Meta:
        verbose_name = "Program Outcome"
        verbose_name_plural = "Program Outcomes"

    def __str__(self):
        return self.po_number

class PSO(models.Model):
    id = models.AutoField(primary_key=True)
    pso_number = models.CharField(max_length=20, help_text="pso1/pso2")
    description = models.TextField()
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='psos')

    class Meta:
        verbose_name = "Program Specific Outcome"
        verbose_name_plural = "Program Specific Outcomes"

    def __str__(self):
        return f"{self.program.program_name} - {self.pso_number}"

class COPOMapping(models.Model):
    id = models.AutoField(primary_key=True)
    co = models.ForeignKey(CO, on_delete=models.CASCADE, related_name='po_mappings')
    po = models.ForeignKey(PO, on_delete=models.CASCADE, related_name='co_mappings')
    weightage = models.FloatField(help_text="mapping weight 1/2/3")

    def __str__(self):
        return f"{self.co.co_number} - {self.po.po_number} ({self.weightage})"

class COPSOMapping(models.Model):
    id = models.AutoField(primary_key=True)
    co = models.ForeignKey(CO, on_delete=models.CASCADE, related_name='pso_mappings')
    pso = models.ForeignKey(PSO, on_delete=models.CASCADE, related_name='co_mappings')
    weightage = models.FloatField(help_text="mapping weight 1/2/3")

    def __str__(self):
        return f"{self.co.co_number} - {self.pso.pso_number} ({self.weightage})"
