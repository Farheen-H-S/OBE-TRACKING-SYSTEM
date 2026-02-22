from django.contrib import admin
from .models import BulkUploadJob

@admin.register(BulkUploadJob)
class BulkUploadJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'uploaded_by', 'module_name', 'file_name', 'status', 'created_at')
    list_filter = ('module_name', 'status', 'created_at')
    search_fields = ('file_name', 'uploaded_by__email')
