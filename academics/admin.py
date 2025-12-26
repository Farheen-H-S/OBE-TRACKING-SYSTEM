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
    list_display = ('program', 'batch_year', 'scheme')
    list_filter = ('program', 'scheme')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('course_code', 'course_name', 'program', 'semester')
    list_filter = ('program', 'semester')
    search_fields = ('course_code', 'course_name')

@admin.register(CO)
class COAdmin(admin.ModelAdmin):
    list_display = ('co_number', 'course', 'target')
    list_filter = ('course',)

@admin.register(PO)
class POAdmin(admin.ModelAdmin):
    list_display = ('po_number', 'attainment')

@admin.register(PSO)
class PSOAdmin(admin.ModelAdmin):
    list_display = ('pso_number', 'program')
    list_filter = ('program',)

@admin.register(COPOMapping)
class COPOMappingAdmin(admin.ModelAdmin):
    list_display = ('co', 'po', 'weightage')
    list_filter = ('co__course', 'po')

@admin.register(COPSOMapping)
class COPSOMappingAdmin(admin.ModelAdmin):
    list_display = ('co', 'pso', 'weightage')
    list_filter = ('co__course', 'pso')
