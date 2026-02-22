from rest_framework import serializers
from .models import CourseIndirectAttainment, ActivityIndirectAttainment

class CourseIndirectAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseIndirectAttainment
        fields = '__all__'

class ActivityIndirectAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityIndirectAttainment
        fields = '__all__'
