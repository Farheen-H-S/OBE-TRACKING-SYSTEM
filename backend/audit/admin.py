from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('log_id', 'user_id', 'action', 'entity_name', 'entity_id', 'created_at')
    list_filter = ('action', 'entity_name', 'created_at')
    search_fields = ('entity_name', 'remark', 'ip_address')
    readonly_fields = ('created_at',)
