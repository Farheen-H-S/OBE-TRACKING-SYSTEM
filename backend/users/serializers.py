from rest_framework import serializers
from .models import User, UserRole, Student, FacultyCourseAssignment

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['role_id', 'role_name', 'role_description']

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role_id.role_name', read_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'name', 'email', 'role_id', 'role_name', 'contact_no', 'is_active', 'created_at', 'updated_at', 'password']
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
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)        # hash new password if provided
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
