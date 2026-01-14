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
        read_only_fields = ('survey_id', 'created_at')


class StressCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StressCategory
        fields = '__all__'
        read_only_fields = ('category_id',)


class StressQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StressQuestion
        fields = '__all__'
        read_only_fields = ('question_id', 'created_at')


class SurveySessionTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveySessionToken
        fields = '__all__'
        read_only_fields = ('token_id', 'created_at', 'is_used')


class StressResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = StressResponse
        fields = '__all__'
        read_only_fields = ('response_id', 'created_at')

    def validate(self, attrs):
        token = attrs.get('token')
        question = attrs.get('question_id')

        if StressResponse.objects.filter(token=token, question_id=question).exists():
            raise serializers.ValidationError(
                "Response for this question already submitted using this token."
            )

        return attrs
