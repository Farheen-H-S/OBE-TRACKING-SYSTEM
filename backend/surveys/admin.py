from django.contrib import admin
from .models import SurveyMaster, SurveyQuestion, SurveyResponse


class SurveyQuestionInline(admin.TabularInline):
    model = SurveyQuestion
    extra = 1


@admin.register(SurveyMaster)
class SurveyMasterAdmin(admin.ModelAdmin):
    list_display = (
        'survey_id',
        'survey_name',
        'survey_category',
        'academic_year',
        'semester',
        'is_active',
        'is_anonymous',
    )
    list_filter = (
        'survey_category',
        'academic_year',
        'semester',
        'is_active',
    )
    search_fields = (
        'survey_name',
        'course_id__course_name',
    )
    inlines = [SurveyQuestionInline]


@admin.register(SurveyQuestion)
class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = (
        'question_id',
        'survey_id',
        'question_text',
        'co_id',
        'po_id',
        'is_active',
    )
    list_filter = (
        'survey_id',
        'is_active',
    )
    search_fields = (
        'question_text',
    )


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = (
        'response_id',
        'survey_id',
        'question_id',
        'student_id',
        'user_id',
        'response_value',
        'submitted_at',
    )
    list_filter = (
        'survey_id',
        'submitted_at',
    )
    search_fields = (
        'student_id__roll_no',
        'user_id__name',
    )
