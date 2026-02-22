from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        'course_id',
        'year',
        'status',
        'user_id_created',
        'user_id_approved',
        'created_at'
    )
    list_filter = ('status', 'year', 'course_id')
    search_fields = (
        'course_id__course_code',
        'course_id__course_name',
        'year'
    )
