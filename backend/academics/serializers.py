from rest_framework import serializers
from .models import (
    Program, Scheme, Course, CO, PO, PSO,
    COPOMapping, COPSOMapping, Batch, COTarget
)

# NOTE:
# Do NOT add auth logic here.
# Role-based filtering will be handled in views later.


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'
        # Later: restrict visibility based on user role (Admin/HOD/Faculty)


class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = '__all__'
        # Later: scheme access can be filtered by program ownership


class CourseSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(
        source='program_id.program_name',
        read_only=True
    )

    class Meta:
        model = Course
        fields = '__all__'
        # Later: faculty should see only assigned courses


class COSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(
        source='course_id.course_code',
        read_only=True
    )

    class Meta:
        model = CO
        fields = '__all__'
        # Later: CO edit permission based on faculty assignment


class POSerializer(serializers.ModelSerializer):
    class Meta:
        model = PO
        fields = '__all__'
        # Later: PO should be editable only by Admin/HOD


class PSOSerializer(serializers.ModelSerializer):
    class Meta:
        model = PSO
        fields = '__all__'
        # Later: PSO tied to department-level roles


class COPOMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = COPOMapping
        fields = '__all__'
        # Later: mapping updates restricted to curriculum committee roles


class COPSOMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = COPSOMapping
        fields = '__all__'
        # Later: mapping updates restricted to curriculum committee roles


class BatchSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(
        source='program_id.program_name',
        read_only=True
    )

    class Meta:
        model = Batch
        fields = '__all__'
        # Later: batch access depends on program & academic year


class COTargetSerializer(serializers.ModelSerializer):
    co_number = serializers.CharField(
        source='co_id.co_number',
        read_only=True
    )
    set_by_name = serializers.CharField(
        source='set_by.name',
        read_only=True
    )

    class Meta:
        model = COTarget
        fields = '__all__'
        # Later: only faculty teaching the course can set targets
