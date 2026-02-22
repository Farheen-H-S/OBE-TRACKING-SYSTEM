from django.contrib import admin
from .models import UserRole, User, Student, FacultyCourseAssignment

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('role_id', 'role_name')
    search_fields = ('role_name',)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'name', 'email', 'role_id', 'is_active', 'created_at', 'updated_at')
    list_filter = ('role_id', 'is_active')
    search_fields = ('name', 'email')

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'roll_no', 'name', 'program_id', 'batch_id', 'semester', 'is_active', 'created_at', 'updated_at')
    list_filter = ('program_id', 'batch_id', 'semester', 'is_active')
    search_fields = ('name', 'roll_no', 'enrollment_no')

@admin.register(FacultyCourseAssignment)
class FacultyCourseAssignmentAdmin(admin.ModelAdmin):
    list_display = ('assignment_id', 'faculty_id', 'course_id', 'academic_year', 'semester', 'is_active', 'updated_at')
    list_filter = ('academic_year', 'semester', 'is_active')
    search_fields = ('faculty_id__name', 'course_id__course_name')
