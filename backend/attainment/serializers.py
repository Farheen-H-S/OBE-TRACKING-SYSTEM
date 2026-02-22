from rest_framework import serializers
from .models import COAttainment, POAttainment, PSOAttainment, AttainmentSnapshot

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

class AttainmentSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttainmentSnapshot
        fields = '__all__'
