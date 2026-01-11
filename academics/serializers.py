from rest_framework import serializers
from .models import Program, Scheme, Course, CO, PO, PSO, COPOMapping, COPSOMapping, Batch, COTarget

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'

class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program_id.program_name', read_only=True)
    class Meta:
        model = Course
        fields = '__all__'

class COSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course_id.course_code', read_only=True)
    class Meta:
        model = CO
        fields = '__all__'

class POSerializer(serializers.ModelSerializer):
    class Meta:
        model = PO
        fields = '__all__'

class PSOSerializer(serializers.ModelSerializer):
    class Meta:
        model = PSO
        fields = '__all__'

class COPOMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = COPOMapping
        fields = '__all__'

class COPSOMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = COPSOMapping
        fields = '__all__'

class BatchSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program_id.program_name', read_only=True)
    class Meta:
        model = Batch
        fields = '__all__'

class COTargetSerializer(serializers.ModelSerializer):
    co_number = serializers.CharField(source='co_id.co_number', read_only=True)
    set_by_name = serializers.CharField(source='set_by.name', read_only=True)
    class Meta:
        model = COTarget
        fields = '__all__'
