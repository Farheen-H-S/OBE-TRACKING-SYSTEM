from rest_framework import serializers
from .models import Report, DACReport, AuditorBoard
import os


class ReportSerializer(serializers.ModelSerializer):
    file_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='user_id_created.name', read_only=True)

    file_exists = serializers.SerializerMethodField()

    batch_display_name = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'report_id', 'course_id', 'program_id', 'batch_id', 'report_type', 
            'year', 'report_file', 'user_id_created', 'user_id_approved', 
            'status', 'auditor_remark', 'created_at', 'updated_at',
            'file_name', 'created_by_name', 'file_exists', 'batch_display_name',
            'scheme_id', 'scheme_name'
        ]
        read_only_fields = (
            'created_at',
            'updated_at',
            'user_id_created',
        )

    def get_file_exists(self, obj):
        if obj.report_file and obj.report_file.name:
            return os.path.exists(obj.report_file.path)
        return False

    def get_batch_display_name(self, obj):
        if obj.batch_id:
            year = obj.batch_id.batch_year
            return f"{year}-{(year + 1) % 100:02d}"
        return None

    def get_file_name(self, obj):
        if obj.report_file:
            return os.path.basename(obj.report_file.name)
        return "Unknown file"

    scheme_id = serializers.SerializerMethodField()
    scheme_name = serializers.SerializerMethodField()

    def get_scheme_id(self, obj):
        if obj.batch_id and obj.batch_id.scheme_id:
            return obj.batch_id.scheme_id.scheme_id
        if obj.course_id and obj.course_id.scheme_id:
            return obj.course_id.scheme_id.scheme_id
        return None

    def get_scheme_name(self, obj):
        if obj.batch_id and obj.batch_id.scheme_id:
            return obj.batch_id.scheme_id.scheme_name
        if obj.course_id and obj.course_id.scheme_id:
            return obj.course_id.scheme_id.scheme_name
        return "N/A"


class DACReportSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    program_name = serializers.CharField(source='program_id.program_name', read_only=True)
    batch_display_name = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    file_exists = serializers.SerializerMethodField()

    class Meta:
        model = DACReport
        fields = [
            'dac_report_id', 'program_id', 'batch_id', 'academic_year', 
            'class_name', 'semester', 'file', 'uploaded_by', 'uploaded_at', 
            'status', 'auditor_remark', 'uploaded_by_name', 'program_name', 
            'batch_display_name', 'file_name', 'file_exists',
            'scheme_id', 'scheme_name'
        ]
        read_only_fields = (
            'uploaded_at',
            'uploaded_by',
        )

    def get_batch_display_name(self, obj):
        if obj.batch_id:
            year = obj.batch_id.batch_year
            return f"{year}-{(year + 1) % 100:02d}"
        return None

    def get_file_exists(self, obj):
        if obj.file and obj.file.name:
            return os.path.exists(obj.file.path)
        return False

    def get_file_name(self, obj):
        if obj.file:
            return os.path.basename(obj.file.name)
        return "Unknown file"

    scheme_id = serializers.SerializerMethodField()
    scheme_name = serializers.SerializerMethodField()

    def get_scheme_id(self, obj):
        if obj.batch_id and obj.batch_id.scheme_id:
            return obj.batch_id.scheme_id.scheme_id
        return None

    def get_scheme_name(self, obj):
        if obj.batch_id and obj.batch_id.scheme_id:
            return obj.batch_id.scheme_id.scheme_name
        return "N/A"
class AuditorBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditorBoard
        fields = ['content', 'updated_at']
