from rest_framework import serializers
from .models import Assessment, AssessmentCOMapping, MarksEntry

class AssessmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course_id.course_name', read_only=True)
    class Meta:
        model = Assessment
        fields = '__all__'

class AssessmentCOMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentCOMapping
        fields = '__all__'

class MarksEntrySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student_id.name', read_only=True)
    roll_no = serializers.CharField(source='student_id.roll_no', read_only=True)
    class Meta:
        model = MarksEntry
        fields = '__all__'
