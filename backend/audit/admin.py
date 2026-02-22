from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'log_id', 'user_id', 'role_id', 'action',
        'entity_name', 'entity_id', 'created_at'
    )
    list_filter = ('action', 'entity_name', 'role_id', 'created_at')
    search_fields = ('entity_name', 'remark', 'ip_address', 'user_id__name')
    readonly_fields = ('created_at', 'user_id', 'role_id')
    date_hierarchy = 'created_at'
