from django.contrib import admin
from .models import StressSurvey, StressCategory, StressQuestion, SurveySessionToken, StressResponse

@admin.register(StressSurvey)
class StressSurveyAdmin(admin.ModelAdmin):
    list_display = ('title', 'month', 'year', 'is_active', 'created_at')
    list_filter = ('year', 'month', 'is_active')
    search_fields = ('title',)

@admin.register(StressCategory)
class StressCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(StressQuestion)
class StressQuestionAdmin(admin.ModelAdmin):
    list_display = ('category_id', 'question_text_preview', 'is_active', 'survey_id')
    list_filter = ('category_id', 'is_active', 'survey_id')
    
    def question_text_preview(self, obj):
        return obj.question_text[:50]

@admin.register(SurveySessionToken)
class SurveySessionTokenAdmin(admin.ModelAdmin):
    list_display = ('token', 'survey_id', 'is_used', 'created_at')
    list_filter = ('is_used', 'survey_id')
    search_fields = ('token',)

@admin.register(StressResponse)
class StressResponseAdmin(admin.ModelAdmin):
    list_display = ('response_id', 'question_id', 'response_value', 'created_at')
    list_filter = ('response_value', 'question_id__survey_id')
