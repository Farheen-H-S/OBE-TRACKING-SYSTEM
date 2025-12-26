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
    list_display = ('category', 'question_text_preview', 'is_active', 'survey')
    list_filter = ('category', 'is_active', 'survey')
    
    def question_text_preview(self, obj):
        return obj.question_text[:50]

@admin.register(SurveySessionToken)
class SurveySessionTokenAdmin(admin.ModelAdmin):
    list_display = ('token', 'survey', 'is_used', 'created_at')
    list_filter = ('is_used', 'survey')
    search_fields = ('token',)

@admin.register(StressResponse)
class StressResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'response_value', 'created_at')
    list_filter = ('response_value', 'question__survey')
