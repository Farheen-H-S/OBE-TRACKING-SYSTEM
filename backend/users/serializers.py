from rest_framework import serializers
from .models import User, UserRole, Student, FacultyCourseAssignment

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['role_id', 'role_name', 'role_description']

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role_id.role_name', read_only=True)
    department_name = serializers.CharField(source='department.program_name', read_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'name', 'email', 'role_id', 'role_name', 'contact_no', 'department', 'department_name', 'username', 'date_of_joining', 'profile_picture', 'is_active', 'is_staff', 'is_superuser', 'created_at', 'updated_at', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)  # create user without password first
        if password:
            user.set_password(password)        # hash the password
            user.save()
        return user

    def update(self, instance, validated_data):
        request = self.context.get('request')
        is_admin = request and request.user.role_id.role_name.upper() == 'ADMIN'

        # RBAC: Non-admins cannot change role, department, or status
        if not is_admin:
            validated_data.pop('role_id', None)
            validated_data.pop('department', None)
            validated_data.pop('is_active', None)
            validated_data.pop('is_staff', None)
            validated_data.pop('is_superuser', None)
        else:
            # RBAC: Admin cannot disable itself
            if instance == request.user and validated_data.get('is_active') is False:
                validated_data.pop('is_active', None)

        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class StudentSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program_id.program_name', read_only=True)
    batch_year = serializers.IntegerField(source='batch_id.batch_year', read_only=True)

    class Meta:
        model = Student
        fields = '__all__'

class FacultyCourseAssignmentSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty_id.name', read_only=True)
    course_name = serializers.CharField(source='course_id.course_name', read_only=True)

    class Meta:
        model = FacultyCourseAssignment
        fields = '__all__'
