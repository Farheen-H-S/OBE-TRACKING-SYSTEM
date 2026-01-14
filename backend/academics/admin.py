from django.contrib import admin
from .models import Program, Scheme, Batch, Course, CO, PO, PSO, COPOMapping, COPSOMapping, COTarget

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('program_id', 'program_name', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('program_name',)

@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = ('scheme_id', 'scheme_name', 'start_year', 'end_year', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('scheme_name',)

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('batch_id', 'program_id', 'batch_year', 'scheme_id', 'is_active', 'created_at', 'updated_at')
    list_filter = ('program_id', 'scheme_id', 'is_active')
    search_fields = ('batch_year',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('course_id', 'course_code', 'course_name', 'program_id', 'semester', 'is_active', 'created_at', 'updated_at')
    list_filter = ('program_id', 'semester', 'is_active')
    search_fields = ('course_code', 'course_name')

@admin.register(CO)
class COAdmin(admin.ModelAdmin):
    list_display = ('co_id', 'co_number', 'course_id', 'is_active', 'created_at', 'updated_at')
    list_filter = ('course_id', 'is_active')
    search_fields = ('co_number',)

@admin.register(PO)
class POAdmin(admin.ModelAdmin):
    list_display = ('po_id', 'po_number', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('po_number',)

@admin.register(PSO)
class PSOAdmin(admin.ModelAdmin):
    list_display = ('pso_id', 'pso_number', 'program_id', 'is_active', 'created_at', 'updated_at')
    list_filter = ('program_id', 'is_active')
    search_fields = ('pso_number',)

@admin.register(COPOMapping)
class COPOMappingAdmin(admin.ModelAdmin):
    list_display = ('mapping_id', 'co_id', 'po_id', 'weightage', 'created_at', 'updated_at')
    list_filter = ('co_id__course_id', 'po_id')
    search_fields = ('co_id__co_number', 'po_id__po_number')

@admin.register(COPSOMapping)
class COPSOMappingAdmin(admin.ModelAdmin):
    list_display = ('mapping_id', 'co_id', 'pso_id', 'weightage', 'created_at', 'updated_at')
    list_filter = ('co_id__course_id', 'pso_id')
    search_fields = ('co_id__co_number', 'pso_id__pso_number')
@admin.register(COTarget)
class COTargetAdmin(admin.ModelAdmin):
    pass # add code