from rest_framework import serializers
from .models import CISNature, CISType, CISTerm

class CISNatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = CISNature
        fields = '__all__'

class CISTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CISType
        fields = '__all__'

class CISTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = CISTerm
        fields = '__all__'
