from rest_framework import serializers
from .models import COAttainment, POAttainment, PSOAttainment, AttainmentSnapshot, POBatchAttainment, PSOBatchAttainment

class COAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = COAttainment
        fields = '__all__'

class POAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = POAttainment
        fields = '__all__'

class PSOAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PSOAttainment
        fields = '__all__'

class POBatchAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = POBatchAttainment
        fields = '__all__'

class PSOBatchAttainmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PSOBatchAttainment
        fields = '__all__'

class AttainmentSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttainmentSnapshot
        fields = '__all__'
