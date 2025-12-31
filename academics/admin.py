from django.contrib import admin
from .models import Program, Scheme, Batch, Course, CO, PO, PSO, COPOMapping, COPSOMapping

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('program_name', 'program_id')
    search_fields = ('program_name',)

@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = ('scheme_name', 'start_year', 'end_year', 'is_active')
    list_filter = ('is_active',)

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('batch_id', 'program_id', 'batch_year', 'scheme_id')
    list_filter = ('program_id', 'scheme_id')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('course_id', 'course_code', 'course_name', 'program_id', 'semester')
    list_filter = ('program_id', 'semester')
    search_fields = ('course_code', 'course_name')

@admin.register(CO)
class COAdmin(admin.ModelAdmin):
    list_display = ('co_id', 'co_number', 'course_id', 'target')
    list_filter = ('course_id',)

@admin.register(PO)
class POAdmin(admin.ModelAdmin):
    list_display = ('po_id', 'po_number', 'attainment')

@admin.register(PSO)
class PSOAdmin(admin.ModelAdmin):
    list_display = ('pso_id', 'pso_number', 'program_id')
    list_filter = ('program_id',)

@admin.register(COPOMapping)
class COPOMappingAdmin(admin.ModelAdmin):
    list_display = ('mapping_id', 'co_id', 'po_id', 'weightage')
    list_filter = ('co_id__course_id', 'po_id')

@admin.register(COPSOMapping)
class COPSOMappingAdmin(admin.ModelAdmin):
    list_display = ('mapping_id', 'co_id', 'pso_id', 'weightage')
    list_filter = ('co_id__course_id', 'pso_id')
