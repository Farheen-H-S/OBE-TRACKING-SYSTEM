from rest_framework import serializers
from .models import SurveyMaster, SurveyQuestion, SurveyResponse


class SurveyMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyMaster
        fields = '__all__'
        read_only_fields = ('survey_id',)


class SurveyQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyQuestion
        fields = '__all__'
        read_only_fields = ('question_id',)


class SurveyResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyResponse
        fields = '__all__'
        read_only_fields = ('response_id', 'submitted_at')
