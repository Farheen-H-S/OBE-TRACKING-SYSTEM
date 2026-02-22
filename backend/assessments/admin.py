from django.contrib import admin
from .models import Assessment, AssessmentCOMapping, MarksEntry

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('assessment_id', 'assessment_name', 'course_id', 'assessment_type', 'max_marks', 'academic_year', 'semester', 'is_active')
    list_filter = ('assessment_type', 'academic_year', 'semester', 'is_active')
    search_fields = ('assessment_name', 'course_id__course_name')

@admin.register(AssessmentCOMapping)
class AssessmentCOMappingAdmin(admin.ModelAdmin):
    list_display = ('mapping_id', 'assessment_id', 'co_id', 'co_weightage')
    list_filter = ('assessment_id__course_id',)

@admin.register(MarksEntry)
class MarksEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_id', 'assessment_id', 'student_id', 'marks_obtained', 'user_id')
    list_filter = ('assessment_id__course_id', 'assessment_id__academic_year', 'assessment_id__assessment_name')
    search_fields = ('student_id__roll_no', 'student_id__name')
