from .models import AuditLog

def get_client_ip(request):
    """
    Extract client IP address from request headers.
    Handles proxies and load balancers.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_action(user, action, entity_name, entity_id, old_value=None, new_value=None, remark=None, ip_address=None, request=None):
    """
    Utility function to create an audit log entry.
    """
    try:
        # Get role from user object
        role = getattr(user, 'role_id', None)
        
        # Auto-extract IP if request is provided and ip_address is not explicitly passed
        if request and not ip_address:
            ip_address = get_client_ip(request)
            
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
