from django.contrib import admin
from .models import (
    StressMaster,
    StressCategory,
    StressQuestion,
    SurveySessionToken,
    StressResponse
)


@admin.register(StressMaster)
class StressMasterAdmin(admin.ModelAdmin):
    list_display = ('title', 'month', 'year', 'is_active', 'end_date', 'created_at')
    list_filter = ('year', 'month', 'is_active')
    search_fields = ('title',)
    readonly_fields = ('created_at',)


@admin.register(StressCategory)
class StressCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(StressQuestion)
class StressQuestionAdmin(admin.ModelAdmin):
    list_display = ('survey_id', 'category_id', 'question_text_preview', 'is_active')
    list_filter = ('survey_id', 'category_id', 'is_active')
    search_fields = ('question_text',)
    readonly_fields = ('created_at',)

    def question_text_preview(self, obj):
        return obj.question_text[:50]

    question_text_preview.short_description = 'Question'


@admin.register(SurveySessionToken)
class SurveySessionTokenAdmin(admin.ModelAdmin):
    list_display = ('token', 'survey_id', 'is_used', 'created_at')
    list_filter = ('survey_id', 'is_used')
    search_fields = ('token',)
    readonly_fields = ('token', 'created_at')


@admin.register(StressResponse)
class StressResponseAdmin(admin.ModelAdmin):
    list_display = ('response_id', 'survey_id', 'question_id', 'token', 'response_value', 'batch_id', 'created_at')
    list_filter = ('survey_id', 'response_value', 'batch_id')
    readonly_fields = ('created_at',)
