from django.contrib import admin
from .models import (
    StressMaster,
    StressCategory,
    StressQuestion,
    SurveySessionToken,
    StressSubmission,
    StressAnswer,
    StressQuestionSet,
    StressQuestionSetQuestion
)


@admin.register(StressMaster)
class StressMasterAdmin(admin.ModelAdmin):
    list_display = ('title', 'month', 'year', 'is_active', 'end_date', 'created_at')
    list_filter = ('year', 'month', 'is_active')
    search_fields = ('title',)
    readonly_fields = ('created_at',)


@admin.register(StressCategory)
class StressCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name',)


@admin.register(StressQuestion)
class StressQuestionAdmin(admin.ModelAdmin):
    list_display = ('category', 'question_text_preview', 'is_reverse', 'is_active')
    list_filter = ('category', 'is_active', 'is_reverse')
    search_fields = ('question_text',)

    def question_text_preview(self, obj):
        return obj.question_text[:60]

    question_text_preview.short_description = 'Question'


@admin.register(SurveySessionToken)
class SurveySessionTokenAdmin(admin.ModelAdmin):
    list_display = ('token', 'survey', 'is_used', 'created_at')
    list_filter = ('survey', 'is_used')
    search_fields = ('token',)
    readonly_fields = ('token', 'created_at')


@admin.register(StressSubmission)
class StressSubmissionAdmin(admin.ModelAdmin):
    list_display = ('submission_id', 'survey', 'token', 'batch', 'submitted_at')
    list_filter = ('survey', 'batch')
    search_fields = ('token__token',)
    readonly_fields = ('submitted_at',)


@admin.register(StressAnswer)
class StressAnswerAdmin(admin.ModelAdmin):
    list_display = ('answer_id', 'submission', 'question', 'response_value')
    list_filter = ('question__category', 'response_value')
    search_fields = ('submission__token__token', 'question__question_text')


class StressQuestionSetQuestionInline(admin.TabularInline):
    model = StressQuestionSetQuestion
    extra = 1


@admin.register(StressQuestionSet)
class StressQuestionSetAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    inlines = [StressQuestionSetQuestionInline]


@admin.register(StressQuestionSetQuestion)
class StressQuestionSetQuestionAdmin(admin.ModelAdmin):
    list_display = ('question_set', 'question')
    list_filter = ('question_set',)
