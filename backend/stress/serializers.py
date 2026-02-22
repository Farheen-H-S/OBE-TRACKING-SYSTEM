from rest_framework import serializers
from .models import (
    StressMaster,
    StressCategory,
    StressQuestion,
    StressQuestionSet,
    StressQuestionSetQuestion,
    SurveySessionToken,
    StressSubmission,
    StressAnswer,
    StressActionPlan
)


class StressActionPlanSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source='batch.batch_name', read_only=True)

    class Meta:
        model = StressActionPlan
        fields = '__all__'
        read_only_fields = ('action_id', 'created_at', 'updated_at')


class StressMasterSerializer(serializers.ModelSerializer):
    response_count = serializers.SerializerMethodField()

    class Meta:
        model = StressMaster
        fields = '__all__'
        read_only_fields = ('survey_id', 'created_at')

    def get_response_count(self, obj):
        return obj.submissions.count()


class StressCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StressCategory
        fields = '__all__'
        read_only_fields = ('category_id',)


class StressQuestionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = StressQuestion
        fields = '__all__'
        read_only_fields = ('question_id',)


class StressQuestionSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = StressQuestionSet
        fields = '__all__'
        read_only_fields = ('question_set_id', 'created_at')


class StressQuestionSetQuestionSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    category = serializers.CharField(source='question.category.name', read_only=True)
    is_reverse = serializers.BooleanField(source='question.is_reverse', read_only=True)

    class Meta:
        model = StressQuestionSetQuestion
        fields = (
            'question_set',
            'question',
            'question_text',
            'category',
            'is_reverse',
        )



class SurveySessionTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveySessionToken
        fields = '__all__'
        read_only_fields = ('token_id', 'created_at', 'is_used')


class StressQuestionSetDetailSerializer(serializers.ModelSerializer):
    set_questions = StressQuestionSetQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = StressQuestionSet
        fields = ('question_set_id', 'name', 'description', 'is_active', 'created_at', 'set_questions')



# -------- NEW INPUT SERIALIZER (matches frontend payload) --------

class StressResponseInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    response_value = serializers.IntegerField(min_value=0, max_value=4)


class StressSubmissionSerializer(serializers.ModelSerializer):
    responses = StressResponseInputSerializer(write_only=True, many=True)

    survey_id = serializers.IntegerField(write_only=True)

    token_str = serializers.CharField(source='token.token', read_only=True)
    survey_title = serializers.CharField(source='survey.title', read_only=True)

    token = serializers.SlugRelatedField(
        slug_field='token',
        queryset=SurveySessionToken.objects.all()
    )

    class Meta:
        model = StressSubmission
        fields = (
            'submission_id',
            'survey_id',
            'survey',
            'token',
            'responses',
            'submitted_at',
            'token_str',
            'survey_title'
        )
        read_only_fields = ('submission_id', 'submitted_at', 'survey')

    def validate(self, attrs):
        token = attrs['token']
        survey_id = attrs['survey_id']

        if token.is_used:
            raise serializers.ValidationError("This token has already been used.")

        if token.survey_id != survey_id:
            raise serializers.ValidationError("Token does not belong to this survey.")

        return attrs

    def create(self, validated_data):
        responses_data = validated_data.pop('responses')
        survey_id = validated_data.pop('survey_id')

        validated_data['survey_id'] = survey_id
        submission = StressSubmission.objects.create(**validated_data)

        for item in responses_data:
            StressAnswer.objects.create(
                submission=submission,
                question_id=item['question_id'],
                response_value=item['response_value']
            )

        submission.token.is_used = True
        submission.token.save()

        return submission
