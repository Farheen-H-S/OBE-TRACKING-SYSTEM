from django.contrib import admin
from .models import TeachingPlan, TeachingPlanLecture

class TeachingPlanLectureInline(admin.TabularInline):
    model = TeachingPlanLecture
    extra = 1

@admin.register(TeachingPlan)
class TeachingPlanAdmin(admin.ModelAdmin):
    list_display = ('teaching_plan_id', 'course', 'faculty', 'batch', 'academic_year', 'semester', 'is_active')
    list_filter = ('academic_year', 'semester', 'is_active', 'faculty')
    search_fields = ('course__course_name', 'faculty__name', 'academic_year')
    inlines = [TeachingPlanLectureInline]

@admin.register(TeachingPlanLecture)
class TeachingPlanLectureAdmin(admin.ModelAdmin):
    list_display = ('lecture_id', 'teaching_plan', 'lecture_no', 'lecture_date', 'unit_no', 'is_completed')
    list_filter = ('is_completed', 'unit_no', 'teaching_plan__academic_year')
    search_fields = ('topic_planned', 'actual_topic', 'teaching_plan__course__course_name')
