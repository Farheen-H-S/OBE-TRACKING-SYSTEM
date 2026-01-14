from rest_framework import serializers
from .models import TeachingPlan


class TeachingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingPlan
        fields = '__all__'
        read_only_fields = ('teaching_plan_id',)
