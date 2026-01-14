from rest_framework import serializers
from .models import COAttainment, AttainmentSnapshot # , CourseAttainment, COPOMappingAttainment

class COAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = COAttainment
        fields = '__all__'

class CourseAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        # model = CourseAttainment
        fields = '__all__'

class COPOMappingAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        # model = COPOMappingAttainment
        fields = '__all__'

class AttainmentSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttainmentSnapshot
        fields = '__all__'
