from rest_framework import serializers
from .models import (
    Program, Scheme, Course, CO, PO, PSO,
    COPOMapping, COPSOMapping, Batch, COTarget, POTarget, PSOTarget,
    AcademicSetup, ProgramStatement, PEO
)

class AcademicSetupSerializer(serializers.ModelSerializer):
    scheme_name = serializers.CharField(source='scheme_id.scheme_name', read_only=True)

    class Meta:
        model = AcademicSetup
        fields = '__all__'

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
    faculty_assigned = serializers.SerializerMethodField()
    faculty_assigned_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'course_id', 'course_code', 'course_name', 'course_title', 
            'course_abbr', 'semester', 'class_year', 'program_id', 
            'program_name', 'scheme_id', 'assessment_tools', 
            'faculty_assigned', 'faculty_assigned_name', 'is_internal', 'co_status', 'mapping_status',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_faculty_assigned(self, obj):
        from users.models import FacultyCourseAssignment
        assignment = FacultyCourseAssignment.objects.filter(course_id=obj, is_active=True).first()
        return assignment.faculty_id.user_id if assignment else None

    def get_faculty_assigned_name(self, obj):
        from users.models import FacultyCourseAssignment
        assignment = FacultyCourseAssignment.objects.filter(course_id=obj, is_active=True).first()
        return assignment.faculty_id.name if assignment else None


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
    scheme_name = serializers.CharField(
        source='scheme_id.scheme_name',
        read_only=True
    )

    class Meta:
        model = Batch
        fields = ['batch_id', 'batch_year', 'start_year', 'end_year', 'scheme_id', 'scheme_name', 'is_active', 'created_at', 'updated_at']


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
class ProgramStatementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramStatement
        fields = '__all__'

class PEOSerializer(serializers.ModelSerializer):
    class Meta:
        model = PEO
        fields = '__all__'

class POTargetSerializer(serializers.ModelSerializer):
    po_number = serializers.CharField(source='po_id.po_number', read_only=True)
    class Meta:
        model = POTarget
        fields = '__all__'

class PSOTargetSerializer(serializers.ModelSerializer):
    pso_number = serializers.CharField(source='pso_id.pso_number', read_only=True)
    class Meta:
        model = PSOTarget
        fields = '__all__'
