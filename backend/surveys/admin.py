from django.contrib import admin
from .models import SurveyMaster, SurveyQuestion, SurveyResponse, SurveyAnswer


class SurveyAnswerInline(admin.TabularInline):
    model = SurveyAnswer
    extra = 0
    readonly_fields = ('question_id', 'answer_value')


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
        'student_id',
        'user_id',
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
    inlines = [SurveyAnswerInline]


@admin.register(SurveyAnswer)
class SurveyAnswerAdmin(admin.ModelAdmin):
    list_display = ('answer_id', 'response_id', 'question_id', 'answer_value')
    list_filter = ('question_id',)
