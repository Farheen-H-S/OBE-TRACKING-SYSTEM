from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from django.utils import timezone
from .models import User, FacultyCourseAssignment, Student
from academics.models import AcademicSetup, Course, COTarget
from reports.models import Report
from attainment.models import COAttainment

class CoordinatorDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        dept = user.department
        
        if not dept:
            return Response({"error": "No department assigned to this Coordinator."}, status=status.HTTP_400_BAD_REQUEST)

        academic_setup = AcademicSetup.objects.first()
        academic_year = academic_setup.academic_year if academic_setup else "2025-26"
        year_str = academic_year

        # 1. Academic Info
        academic_data = {
            "academic_year": year_str,
            "department": dept.program_name,
            "semester_type": academic_setup.semester_type if academic_setup else "Odd/Even",
            "scheme": academic_setup.scheme_id.scheme_name if academic_setup and academic_setup.scheme_id else "N/A",
            "effective_from": academic_setup.updated_at.strftime('%d/%m/%Y') if academic_setup else "N/A"
        }

        # 2. OBE Process Health Metrics (Similar to HOD but for Coordinator)
        courses = Course.objects.filter(program_id=dept, is_active=True)
        total_course_count = courses.count() or 1
        
        # Mapping
        mapped_count = courses.filter(mapping_status='COMPLETED').count()
        mapping_health = {
            "title": "CO-PO-PSO Mapping",
            "percentage": round((mapped_count / total_course_count) * 100),
            "stats": f"Completed:\n{mapped_count}/{total_course_count} courses",
            "data": [["Status", "Percentage"], ["Mapped", mapped_count], ["Pending", total_course_count - mapped_count]]
        }

        # Verification
        verified_reports = Report.objects.filter(course_id__in=courses, status='Approved').count()
        pending_reports = Report.objects.filter(course_id__in=courses, status='Draft').count()
        total_reports = verified_reports + pending_reports or 1
        verification_health = {
            "title": "Report verification Status",
            "percentage": round((verified_reports / total_reports) * 100),
            "stats": f"Verified:{verified_reports}\nPending:{pending_reports}",
            "data": [["Status", "Percentage"], ["Verified", verified_reports], ["Pending", pending_reports]]
        }

        # Target Management
        targets_set = COTarget.objects.filter(course_id__in=courses).values('course_id').distinct().count()
        target_health = {
            "title": "Target management",
            "percentage": round((targets_set / total_course_count) * 100),
            "stats": f"Targets assigned:\n{targets_set}/{total_course_count} courses",
            "data": [["Status", "Percentage"], ["Assigned", targets_set], ["Pending", total_course_count - targets_set]]
        }

        # Target Achieved (Real Calculation based on CO Attainment)
        co_atts = COAttainment.objects.filter(academic_year=year_str, course_id__in=courses)
        achieved_co_count = co_atts.filter(gap__lte=0).count()
        total_co_count = co_atts.count() or 1
        achieved_perc = round((achieved_co_count / total_co_count) * 100)
        
        achieved_health = {
            "title": "Target achived",
            "percentage": achieved_perc,
            "stats": f"Target\nAchived:{achieved_perc}%\nPending:{100-achieved_perc}%",
            "data": [["Status", "Percentage"], ["Achieved", achieved_perc], ["Pending", 100-achieved_perc]]
        }

        # 3. Assessment Coverage Status (Per Subject)
        subject_coverage = []
        for course in courses[:4]: # Limit to top 4 for dashboard overview
            # Calculate CO attainment average for this course
            course_att = COAttainment.objects.filter(course_id=course, academic_year=year_str).aggregate(Avg('overall_attainment'))['overall_attainment__avg'] or 0
            course_att_perc = round((course_att / 3.0) * 100)
            
            subject_coverage.append({
                "subject": course.course_name,
                "co_attainment": f"{course_att_perc}%",
                # Mocking status detail items for now as coverage models might be complex
                "details": [
                    {"label": "FA-TH", "status": "uploaded"},
                    {"label": "FA-PR", "status": "uploaded"},
                    {"label": "SA-TH", "status": "uploaded"}
                ]
            })

        # 4. DAC Report Submission Status (Months ok/no)
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        now = timezone.now()
        dac_status = []
        for i, m in enumerate(months, 1):
            # Check if any report was approved in this month
            has_report = Report.objects.filter(
                course_id__program_id=dept, 
                approved_at__month=i,
                status='Approved'
            ).exists()
            dac_status.append({"month": m, "status": "ok" if has_report else "no"})

        return Response({
            "academic": academic_data,
            "health": [mapping_health, verification_health, target_health, achieved_health],
            "coverage": subject_coverage,
            "dac_reports": dac_status
        }, status=status.HTTP_200_OK)
