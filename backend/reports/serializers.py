from rest_framework import serializers
from .models import Report, DACReport
import os


class ReportSerializer(serializers.ModelSerializer):
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = (
            'created_at',
            'updated_at',
        )

    def get_file_name(self, obj):
        if obj.report_file:
            return os.path.basename(obj.report_file.name)
        return "Unknown file"


class DACReportSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    program_name = serializers.CharField(source='program_id.program_name', read_only=True)
    batch_name = serializers.CharField(source='batch_id.batch_name', read_only=True)
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = DACReport
        fields = '__all__'
        read_only_fields = (
            'uploaded_at',
            'uploaded_by',
        )

    def get_file_name(self, obj):
        if obj.file:
            return os.path.basename(obj.file.name)
        return "Unknown file"
class AuditorBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditorBoard
        fields = ['content', 'updated_at']
