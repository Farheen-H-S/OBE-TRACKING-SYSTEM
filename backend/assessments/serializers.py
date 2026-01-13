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
    assessment_name = serializers.CharField(source='assessment_id.name', read_only=True)
    co_number = serializers.CharField(source='co_id.co_number', read_only=True)

    class Meta:
        model = MarksEntry
        fields = '__all__'

    def validate_marks_obtained(self, value):
        """
        Ensure marks_obtained is between 0 and max_marks of the linked assessment.
        """
        assessment = self.instance.assessment_id if self.instance else self.initial_data.get('assessment_id')
        if not assessment:
            return value  # cannot validate without assessment_id; will be caught elsewhere

        # Fetch assessment object if we have ID
        from .models import Assessment
        if isinstance(assessment, int):
            assessment = Assessment.objects.filter(pk=assessment).first()
        if assessment and value is not None:
            if value < 0:
                raise serializers.ValidationError("Marks cannot be negative.")
            if value > assessment.max_marks:
                raise serializers.ValidationError(f"Marks cannot exceed {assessment.max_marks}.")
        return value
