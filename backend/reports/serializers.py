from rest_framework import serializers
from .models import Report, DACReport


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = (
            'created_at',
            'updated_at',
        )

class DACReportSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    program_name = serializers.CharField(source='program_id.program_name', read_only=True)
    batch_name = serializers.CharField(source='batch_id.batch_name', read_only=True)
    
    class Meta:
        model = DACReport
        fields = '__all__'
        read_only_fields = (
            'uploaded_at',
            'uploaded_by',
        )
