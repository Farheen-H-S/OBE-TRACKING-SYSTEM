from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import datetime

from .models import User, FacultyCourseAssignment, Student
from academics.models import AcademicSetup, Course, COTarget, PO
from stress.models import StressMaster
from reports.models import Report
from attainment.models import COAttainment, POAttainment
from .permissions import IsHOD

class HODDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        user = request.user
        dept = user.department
        
        if not dept:
            return Response({"error": "No department assigned to this HOD."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Academic Info
        academic_setup = AcademicSetup.objects.select_related('scheme_id').first()
        academic_data = {
            "academic_year": academic_setup.academic_year if academic_setup else "2025-26",
            "department": dept.program_name,
            "semester_type": academic_setup.semester_type if academic_setup else "Odd/Even",
            "scheme": academic_setup.scheme_id.scheme_name if academic_setup and academic_setup.scheme_id else "N/A",
            "effective_from": academic_setup.updated_at.strftime('%d/%m/%Y') if academic_setup else "N/A"
        }

        # 2. Stress Survey Status
        now = timezone.now()
        current_stress = StressMaster.objects.filter(month=now.month, year=now.year).first()
        stress_status = {
            "month": now.strftime('%b'),
            "status": "Conducting" if current_stress and current_stress.is_active else "Not conducted"
        }

        # 3. DAC Report Status (Assuming 'DAC' report might be a specific type or just any approved report)
        # For now, let's check if there are any approved reports for this dept this year
        year_str = academic_data["academic_year"]
        dac_exists = Report.objects.filter(course_id__program_id=dept, year=year_str, status='Approved').exists()
        dac_status = {
            "month": now.strftime('%b'),
            "status": "Uploaded" if dac_exists else "Pending"
        }

        # 4. Total Students in Dept
        total_students = Student.objects.filter(program_id=dept, is_active=True).count()

        # 5. Course & Faculty Overview
        # Get all courses for this department
        courses = Course.objects.filter(program_id=dept, is_active=True)
        course_assignments = FacultyCourseAssignment.objects.filter(course_id__in=courses, is_active=True).select_related('faculty_id', 'course_id')
        
        assignment_map = {ca.course_id_id: ca for ca in course_assignments}
        
        course_overview = []
        for course in courses:
            assignment = assignment_map.get(course.course_id)
            course_overview.append({
                "id": course.course_id,
                "course_name": f"{course.course_name}({course.course_code})",
                "faculty": assignment.faculty_id.name if assignment else "Not Assigned",
                "completion": 0, # This would need a separate field or logic
                "attainment_status": course.co_status,
                "class_name": course.class_year or "N/A"
            })

        # 6. OBE Process Health Metrics
        total_course_count = courses.count() or 1
        
        # Mapping
        mapped_count = courses.filter(mapping_status='COMPLETED').count()
        mapping_health = [
            ["Status", "Percentage"],
            ["Completed", (mapped_count / total_course_count) * 100],
            ["Inprogress", ((total_course_count - mapped_count) / total_course_count) * 100],
        ]

        # Verification
        verified_reports = Report.objects.filter(course_id__in=courses, status='Approved').count()
        pending_reports = Report.objects.filter(course_id__in=courses, status='Draft').count()
        total_reports = verified_reports + pending_reports or 1
        verification_health = [
            ["Status", "Percentage"],
            ["Verified", (verified_reports / total_reports) * 100],
            ["Pending", (pending_reports / total_reports) * 100],
        ]

        # Target Management
        targets_set = COTarget.objects.filter(course_id__in=courses).values('course_id').distinct().count()
        target_health = [
            ["Status", "Percentage"],
            ["Target set", (targets_set / total_course_count) * 100],
            ["Target not set", ((total_course_count - targets_set) / total_course_count) * 100],
        ]

        # Target Achieved (Real Calculation based on PO Attainment Gap)
        # We calculate the average target achievement across all POs in the department
        po_attainments = POAttainment.objects.filter(academic_year=year_str, course_id__in=courses)
        average_gap = po_attainments.aggregate(Avg('gap'))['gap__avg'] or 0
        # If gap is 0 or negative, achievement is 100%. If gap is positive, we estimate achievement.
        # This is a simplified metric for the dashboard.
        achieved_perc = max(0, min(100, 100 - (average_gap * 20))) # 20 is a scaling factor for visualization
        
        achieved_health = [
            ["Status", "Percentage"],
            ["Target Achieved", achieved_perc],
            ["Target Not Achieved", 100 - achieved_perc],
        ]

        # 7. Overall CO Attainment (Bar Chart) - Real data for department-wide CO averages
        dept_co_stats = COAttainment.objects.filter(academic_year=year_str, course_id__in=courses).values('co_id__co_number').annotate(avg_att=Avg('overall_attainment')).order_by('co_id__co_number')
        
        attainment_bar_data = [["Course Outcome", "Percentage", { "role": "style" }]]
        colors = ["#4285f4", "#ea4335", "#fbbc05", "#34a853", "#ff6d01", "#46bdc6"]
        
        if dept_co_stats.exists():
            for i, stat in enumerate(dept_co_stats):
                co_label = stat['co_id__co_number'].upper()
                avg_val = round((stat['avg_att'] / 3.0) * 100, 1) # Convert level 3 to 100%
                attainment_bar_data.append([co_label, avg_val, colors[i % len(colors)]])
        else:
            # Fallback if no data
            attainment_bar_data.extend([
                ["CO 1", 0, "#4285f4"],
                ["CO 2", 0, "#4285f4"],
                ["CO 3", 0, "#4285f4"],
                ["CO 4", 0, "#4285f4"],
                ["CO 5", 0, "#4285f4"],
            ])

        # Final Academic Object (Merging all top stats)
        academic_response = {
            **academic_data,
            "total_students": total_students,
            "stress_survey_conducted": stress_status["status"] == "Conducting",
            "dac_report_uploaded": dac_status["status"] == "Uploaded"
        }

        # Health as Array for .map() in frontend
        health_array = [
            {
                "title": "CO-PO-PSO Mapping",
                "data": mapping_health,
                "percentage": round((mapped_count / total_course_count) * 100, 1),
                "stats": f"Completed: {mapped_count}/{total_course_count}"
            },
            {
                "title": "Report Verification",
                "data": verification_health,
                "percentage": round((verified_reports / total_reports) * 100, 1),
                "stats": f"Verified: {verified_reports}\nPending: {pending_reports}"
            },
            {
                "title": "Target Management",
                "data": target_health,
                "percentage": round((targets_set / total_course_count) * 100, 1),
                "stats": f"Target set: {targets_set}/{total_course_count}"
            },
            {
                "title": "Target Achieved",
                "data": achieved_health,
                "percentage": round(achieved_perc, 1),
                "stats": f"Achieved: {round(achieved_perc, 1)}%"
            }
        ]

        response_data = {
            "academic": academic_response,
            "health": health_array,
            "courses": course_overview,
            "attainment_bar_data": attainment_bar_data
        }

        return Response(response_data, status=status.HTTP_200_OK)
