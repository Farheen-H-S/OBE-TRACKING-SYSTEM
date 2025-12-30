from django.contrib import admin
from .models import COAttainment, POAttainment, Backtracking, AttainmentSnapshot

@admin.register(COAttainment)
class COAttainmentAdmin(admin.ModelAdmin):
    list_display = ('attainment_id', 'co', 'course', 'overall_attainment', 'attainment_level', 'academic_year', 'is_active')
    list_filter = ('academic_year', 'attainment_level', 'is_active')
    search_fields = ('co__co_number', 'course__course_name', 'academic_year')

@admin.register(POAttainment)
class POAttainmentAdmin(admin.ModelAdmin):
    list_display = ('attainment_id', 'po', 'course', 'po_value', 'academic_year', 'is_active')
    list_filter = ('academic_year', 'is_active')
    search_fields = ('po__po_number', 'course__course_name', 'academic_year')

@admin.register(Backtracking)
class BacktrackingAdmin(admin.ModelAdmin):
    list_display = ('id', 'course', 'co', 'po', 'final_po_contribution', 'academic_year', 'is_active')
    list_filter = ('academic_year', 'is_active')
    search_fields = ('course__course_name', 'co__co_number', 'po__po_number', 'academic_year')

@admin.register(AttainmentSnapshot)
class AttainmentSnapshotAdmin(admin.ModelAdmin):
    list_display = ('snapshot_id', 'month', 'year', 'course', 'attainment_value', 'calculation_type', 'source', 'is_locked')
    list_filter = ('year', 'month', 'calculation_type', 'source', 'is_locked')
    search_fields = ('course__course_name', 'year')
