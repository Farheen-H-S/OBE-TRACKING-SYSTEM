from django.db import models

class COAttainment(models.Model):
    attainment_id = models.AutoField(primary_key=True)
    co_id = models.ForeignKey('academics.CO', on_delete=models.PROTECT, related_name='attainments', db_column='co_id')
    course_id = models.ForeignKey('academics.Course', on_delete=models.PROTECT, related_name='co_attainments', db_column='course_id')
    direct_attainment = models.FloatField()
    indirect_attainment = models.FloatField(null=True, blank=True)
    overall_attainment = models.FloatField(help_text="Weighted CO attainment (0.8L + 0.2M)")
    gap = models.FloatField(help_text="Target vs achieved")
    attainment_level = models.IntegerField(help_text="Level 1/2/3")
    academic_year = models.CharField(max_length=9, help_text="Academic year (e.g., 2024-25)")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'attainment_coattainment'
        verbose_name = "CO Attainment"
        verbose_name_plural = "CO Attainments"
        unique_together = ('co_id', 'academic_year')

    def __str__(self):
        return f"CO: {self.co_id} - {self.academic_year}"

class POAttainment(models.Model):
    attainment_id = models.AutoField(primary_key=True)
    po_id = models.ForeignKey('academics.PO', on_delete=models.PROTECT, related_name='attainments', db_column='po_id')
    course_id = models.ForeignKey('academics.Course', on_delete=models.PROTECT, related_name='po_attainments', db_column='course_id')
    po_value = models.FloatField(help_text="Raw PO value")
    normalized_value = models.FloatField()
    academic_year = models.CharField(max_length=9)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'attainment_poattainment'
        verbose_name = "PO Attainment"
        verbose_name_plural = "PO Attainments"
        unique_together = ('co_id', 'academic_year')

    def __str__(self):
        return f"PO: {self.po_id} - {self.academic_year}"

class Backtracking(models.Model):
    backtracking_id = models.AutoField(primary_key=True)
    course_id = models.ForeignKey('academics.Course', on_delete=models.PROTECT, related_name='backtracking_entries', db_column='course_id')
    co_id = models.ForeignKey('academics.CO', on_delete=models.PROTECT, related_name='backtracking_entries', db_column='co_id')
    po_id = models.ForeignKey('academics.PO', on_delete=models.PROTECT, related_name='backtracking_entries', db_column='po_id')
    direct_attainment = models.FloatField()
    indirect_attainment = models.FloatField()
    co_po_weightage = models.FloatField(help_text="CO -> PO mapping weight (1/2/3)")
    final_po_contribution = models.FloatField()
    remark = models.TextField(null=True, blank=True)
    academic_year = models.CharField(max_length=9)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'backtracking'
        verbose_name = "Backtracking"
        verbose_name_plural = "Backtracking Entries"
        unique_together = ('course_id', 'co_id', 'po_id', 'academic_year')

    def __str__(self):
        return f"Backtracking: {self.co_id} -> {self.po_id} ({self.academic_year})"

class AttainmentSnapshot(models.Model):
    CALCULATION_TYPE_CHOICES = [
        ('monthly', 'Monthly'),
        ('cumulative', 'Cumulative'),
    ]
    SOURCE_CHOICES = [
        ('direct', 'Direct'),
        ('indirect', 'Indirect'),
        ('combined', 'Combined'),
    ]

    snapshot_id = models.AutoField(primary_key=True)
    month = models.PositiveSmallIntegerField(help_text="Month (1-12)")
    year = models.PositiveSmallIntegerField(help_text="Academic year")
    course_id = models.ForeignKey('academics.Course', on_delete=models.PROTECT, related_name='attainment_snapshots', db_column='course_id')
    co_id = models.ForeignKey('academics.CO', on_delete=models.PROTECT, related_name='attainment_snapshots', db_column='co_id')
    po_id = models.ForeignKey('academics.PO', on_delete=models.PROTECT, null=True, blank=True, related_name='attainment_snapshots', db_column='po_id')
    pso_id = models.ForeignKey('academics.PSO', on_delete=models.PROTECT, null=True, blank=True, related_name='attainment_snapshots', db_column='pso_id')
    attainment_value = models.FloatField()
    calculation_type = models.CharField(max_length=15, choices=CALCULATION_TYPE_CHOICES)
    source = models.CharField(max_length=15, choices=SOURCE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    is_locked = models.BooleanField(default=False)

    class Meta:
        db_table = 'attainment_snapshot'
        verbose_name = "Attainment Snapshot"
        verbose_name_plural = "Attainment Snapshots"
        unique_together = ('month', 'year', 'course_id', 'co_id', 'po_id', 'pso_id', 'calculation_type', 'source')

    def __str__(self):
        return f"Snapshot {self.month}/{self.year} - {self.course_id}"
