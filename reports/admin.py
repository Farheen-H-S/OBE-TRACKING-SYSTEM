from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('course', 'year', 'status', 'created_by', 'approved_by', 'created_at')
    list_filter = ('status', 'year', 'course')
    search_fields = ('course__course_code', 'course__course_name', 'year')
