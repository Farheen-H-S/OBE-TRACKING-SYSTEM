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

    def validate(self, data):
        # Username validation logic (moved from validate_username for clarity if needed, 
        # but validate_username is also fine. Let's keep validate_username for single field check)
        
        # Admin department validation
        role_obj = data.get('role_id')
        role_name = ""
        if role_obj:
            role_name = role_obj.role_name.upper()
        elif self.instance:
            role_name = self.instance.role_id.role_name.upper()
            
        if role_name == 'ADMIN' and data.get('department'):
            # Automatically clear/nullify department if role is Admin instead of raising error?
            # User requested "validation", so raising error is safer if frontend fails.
            raise serializers.ValidationError({"department": "Admin users should not have an associated department."})
            
        return data

    def validate_username(self, value):
        if value:
            # Check if another user already has this username
            user_id = self.instance.user_id if self.instance else None
            if User.objects.filter(username=value).exclude(user_id=user_id).exists():
                raise serializers.ValidationError("This username is already taken.")
        return value

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
