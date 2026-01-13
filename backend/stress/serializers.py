from rest_framework import serializers
from .models import (
    StressSurvey,
    StressCategory,
    StressQuestion,
    SurveySessionToken,
    StressResponse
)


class StressSurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = StressSurvey
        fields = '__all__'
        read_only_fields = ('created_at',)


class StressCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StressCategory
        fields = '__all__'


class StressQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StressQuestion
        fields = '__all__'
        read_only_fields = ('created_at',)


class SurveySessionTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveySessionToken
        fields = '__all__'
        read_only_fields = ('created_at',)


class StressResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = StressResponse
        fields = '__all__'
        read_only_fields = ('id', 'created_at')
