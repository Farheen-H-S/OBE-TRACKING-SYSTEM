from django.contrib import admin
from .models import TeachingPlan, TeachingPlanLecture

class TeachingPlanLectureInline(admin.TabularInline):
    model = TeachingPlanLecture
    extra = 1

@admin.register(TeachingPlan)
class TeachingPlanAdmin(admin.ModelAdmin):
    list_display = ('teaching_plan_id', 'course_id', 'user_id', 'batch_id', 'academic_year', 'semester', 'is_active')
    list_filter = ('academic_year', 'semester', 'is_active', 'user_id')
    search_fields = ('course_id__course_name', 'user_id__name', 'academic_year')
    inlines = [TeachingPlanLectureInline]

@admin.register(TeachingPlanLecture)
class TeachingPlanLectureAdmin(admin.ModelAdmin):
    list_display = ('lecture_id', 'teaching_plan_id', 'lecture_no', 'lecture_date', 'unit_no', 'is_completed')
    list_filter = ('is_completed', 'unit_no', 'teaching_plan_id__academic_year')
    search_fields = ('topic_planned', 'actual_topic', 'teaching_plan_id__course_id__course_name')
