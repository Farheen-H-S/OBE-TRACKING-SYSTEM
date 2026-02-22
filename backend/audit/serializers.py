from rest_framework import serializers
from .models import AuditLog # , ApprovalAction

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user_id.email')
    role_name = serializers.ReadOnlyField(source='role_id.role_name')

    class Meta:
        model = AuditLog
        fields = [
            'log_id', 'user_id', 'username', 'role_id', 'role_name', 
            'action', 'entity_name', 'entity_id', 'old_value', 'new_value', 
            'remark', 'ip_address', 'created_at'
        ]

class ApprovalActionSerializer(serializers.ModelSerializer):
    class Meta:
        # model = ApprovalAction
        fields = '__all__'
