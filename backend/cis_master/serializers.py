from rest_framework import serializers
from .models import CISNature, CISType, CISTerm

class CISNatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = CISNature
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class CISTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CISType
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class CISTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = CISTerm
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
