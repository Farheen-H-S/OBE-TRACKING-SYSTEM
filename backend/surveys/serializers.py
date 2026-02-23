from rest_framework import serializers
from .models import SurveyMaster, SurveyQuestion, SurveyResponse, SurveyAnswer


class SurveyQuestionSerializer(serializers.ModelSerializer):
    co_number = serializers.CharField(source='co_id.co_number', read_only=True)
    
    class Meta:
        model = SurveyQuestion
        fields = '__all__'
        read_only_fields = ('question_id',)


class SurveyMasterSerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = SurveyMaster
        fields = '__all__'
        read_only_fields = ('survey_id',)

    def create(self, validated_data):
        # Extract questions from request data if present (not in validated_data because it's read_only in the field definition but we'll handle it manually)
        questions_data = self.context['request'].data.get('questions', [])
        survey = SurveyMaster.objects.create(**validated_data)
        
        for q_data in questions_data:
            SurveyQuestion.objects.create(
                survey_id=survey,
                question_text=q_data.get('question_text'),
                co_id_id=q_data.get('co_id'),
                po_id_id=q_data.get('po_id'),
                is_active=q_data.get('is_active', True)
            )
        return survey


class SurveyResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyResponse
        fields = '__all__'
        read_only_fields = ('response_id', 'submitted_at')


class SurveyAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAnswer
        fields = '__all__'
        read_only_fields = ('answer_id',)
