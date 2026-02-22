from .models import AuditLog

def log_action(user, action, entity_name, entity_id, old_value=None, new_value=None, remark=None, ip_address=None):
    """
    Utility function to create an audit log entry.
    """
    try:
        # Get role from user object
        role = getattr(user, 'role_id', None)
        
        AuditLog.objects.create(
            user_id=user if user and not user.is_anonymous else None,
            role_id=role,
            action=action,
            entity_name=entity_name,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            remark=remark,
            ip_address=ip_address
        )
    except Exception as e:
        # Log error but don't crash the main request
        print(f"Error creating audit log: {e}")
