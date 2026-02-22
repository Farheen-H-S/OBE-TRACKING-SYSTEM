from rest_framework.permissions import BasePermission

# ==========================
# Role-specific Permissions
# ==========================

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_id.role_name == "Admin"

class IsHOD(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_id.role_name == "HOD"

class IsFaculty(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_id.role_name == "Faculty"

class IsCoordinator(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_id.role_name == "Coordinator"

class IsAuditor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_id.role_name == "Auditor"

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_id.role_name == "Student"
