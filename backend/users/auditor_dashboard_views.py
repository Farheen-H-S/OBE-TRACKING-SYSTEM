from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from reports.models import Report, DACReport
from audit.models import AuditLog
from academics.models import AcademicSetup


class AuditorDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        academic_setup = AcademicSetup.objects.first()
        academic_year = academic_setup.academic_year if academic_setup else "2025-26"

        # 1. Top Stats
        verified_reports = Report.objects.filter(status='Verified').count()
        approved_reports = Report.objects.filter(status='Approved').count()
        pending_reports = Report.objects.filter(status__in=['Draft', 'Pending']).count()
        total_reports = Report.objects.count() or 1

        verified_dac = DACReport.objects.filter(status='Verified').count()
        pending_dac = DACReport.objects.filter(status='Pending').count()
        total_dac = DACReport.objects.count() or 1

        top_stats = {
            "academic_year": academic_year,
            "verified_reports": verified_reports,
            "approved_reports": approved_reports,
            "pending_reports": pending_reports,
            "total_reports": Report.objects.count(),
            "verified_dac": verified_dac,
            "pending_dac": pending_dac,
            "total_dac": DACReport.objects.count(),
            "report_verification_pct": round((verified_reports / total_reports) * 100),
            "dac_verification_pct": round((verified_dac / total_dac) * 100),
        }

        # 2. Recent Audit Activity (last 20)
        recent_logs = AuditLog.objects.select_related('user_id', 'role_id').order_by('-created_at')[:20]
        activity_rows = []
        for log in recent_logs:
            activity_rows.append({
                "log_id": log.log_id,
                "date": log.created_at.strftime('%d/%m/%Y'),
                "time": log.created_at.strftime('%I:%M %p'),
                "username": log.user_id.name if log.user_id else "System",
                "role": log.role_id.role_name if log.role_id else "—",
                "action": log.action,
                "description": f"{log.action} on {log.entity_name} (ID: {log.entity_id})",
            })

        return Response({
            "top_stats": top_stats,
            "activity_log": activity_rows,
        }, status=status.HTTP_200_OK)
