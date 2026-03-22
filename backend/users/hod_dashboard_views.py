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
from attainment.models import COAttainment, POAttainment, PSOAttainment
from .permissions import IsHOD

class HODDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        user = request.user
        
        # Get filters from query params
        dept_id = request.query_params.get('dept_id')
        scheme_id = request.query_params.get('scheme_id')
        academic_year = request.query_params.get('academic_year')
        class_filter = request.query_params.get('class_name') # FY, SY, TY

        # Default Department
        if dept_id:
            try:
                from academics.models import Program
                dept = Program.objects.get(program_id=dept_id)
            except Exception:
                dept = user.department
        else:
            dept = user.department
            
        if not dept:
            return Response({"error": "No department assigned or selected."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Academic Info (Dynamic based on filters or Setup)
        academic_setup = AcademicSetup.objects.select_related('scheme_id').first()
        
        final_academic_year = academic_year or (academic_setup.academic_year if academic_setup else "2025-26")
        
        # Determine Scheme
        if scheme_id:
            from academics.models import Scheme
            try:
                current_scheme = Scheme.objects.get(scheme_id=scheme_id)
                scheme_name = current_scheme.scheme_name
            except Exception:
                scheme_name = academic_setup.scheme_id.scheme_name if academic_setup and academic_setup.scheme_id else "N/A"
        else:
            scheme_name = academic_setup.scheme_id.scheme_name if academic_setup and academic_setup.scheme_id else "N/A"

        academic_data = {
            "academic_year": final_academic_year,
            "department": dept.program_name,
            "semester_type": academic_setup.semester_type if academic_setup else "Odd/Even",
            "scheme": scheme_name,
            "effective_from": academic_setup.updated_at.strftime('%d/%m/%Y') if academic_setup else "N/A"
        }

        # 2. Stress Survey Status
        now = timezone.now()
        current_stress = StressMaster.objects.filter(month=now.month, year=now.year).first()
        stress_status_flag = "Conducted" if current_stress and current_stress.is_active else "Not conducted"

        # 3. Teacher Feedback Survey Status
        from surveys.models import SurveyMaster
        year_str = final_academic_year.replace(" ", "")
        teacher_survey = SurveyMaster.objects.filter(survey_category='feedback', academic_year=year_str, is_active=True).first()
        teacher_survey_status = "Conducted" if teacher_survey else "Not conducted"

        # 4. Total Students Distribution (FY, SY, TY using the class_year field)
        try:
            fy_count = Student.objects.filter(program_id=dept, class_year='FY', is_active=True).count()
            sy_count = Student.objects.filter(program_id=dept, class_year='SY', is_active=True).count()
            ty_count = Student.objects.filter(program_id=dept, class_year='TY', is_active=True).count()
            total_students_count = fy_count + sy_count + ty_count
        except Exception:
            fy_count, sy_count, ty_count, total_students_count = 0, 0, 0, 0

        # 5. Course & Faculty Overview
        # Get all courses for this department
        courses = Course.objects.filter(program_id=dept, is_active=True)
        if scheme_id:
            courses = courses.filter(scheme_id=scheme_id)
            
        if class_filter and class_filter in ['FY', 'SY', 'TY']:
            courses = courses.filter(class_year=class_filter).distinct()
            
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
        if targets_set == 0:
            achieved_perc = 0
        else:
            po_attainments = POAttainment.objects.filter(academic_year=year_str, course_id__in=courses)
            average_gap = po_attainments.aggregate(Avg('gap'))['gap__avg'] or 0
            # If gap is 0 or negative, achievement is 100%. If gap is positive, we estimate achievement.
            achieved_perc = max(0, min(100, 100 - (average_gap * 20)))
        
        achieved_health = [
            ["Status", "Percentage"],
            ["Target Achieved", achieved_perc],
            ["Target Not Achieved", 100 - achieved_perc],
        ]

        # 7. Overall PO & PSO Attainment (Bar Chart) - Real data for department-wide averages
        dept_po_stats = POAttainment.objects.filter(academic_year=year_str, course_id__in=courses).values('po_id__po_number').annotate(avg_att=Avg('normalized_value')).order_by('po_id__po_number')
        
        attainment_bar_data = [["Outcome", "Percentage", { "role": "style" }]]
        
        # We reuse colors but loop them
        colors = ["#4285f4", "#ea4335", "#fbbc05", "#34a853", "#ff6d01", "#46bdc6"]
        idx = 0
        
        if dept_po_stats.exists():
            for stat in dept_po_stats:
                label = stat['po_id__po_number'].upper()
                avg_val = round((stat['avg_att'] / 3.0) * 100, 1) # Convert level 3 to 100%
                attainment_bar_data.append([label, avg_val, colors[idx % len(colors)]])
                idx += 1
        else:
            # Fallback if no PO data
            attainment_bar_data.extend([["PO 1", 0, "#4285f4"], ["PO 2", 0, "#ea4335"], ["PO 3", 0, "#fbbc05"]])
            
        # Also grab PSOs for the same chart
        dept_pso_stats = PSOAttainment.objects.filter(academic_year=year_str, course_id__in=courses).values('pso_id__pso_number').annotate(avg_att=Avg('normalized_value')).order_by('pso_id__pso_number')
        if dept_pso_stats.exists():
            for stat in dept_pso_stats:
                label = stat['pso_id__pso_number'].upper()
                avg_val = round((stat['avg_att'] / 3.0) * 100, 1) # Convert level 3 to 100%
                attainment_bar_data.append([label, avg_val, colors[idx % len(colors)]])
                idx += 1 

        # Calculate unassigned courses count
        unassigned_courses = courses.exclude(course_id__in=[ca.course_id_id for ca in course_assignments]).count()

        # Final Academic Object (Merging all top stats)
        academic_response = {
            **academic_data,
            "students_distribution": {
                "total": total_students_count,
                "FY": fy_count,
                "SY": sy_count,
                "TY": ty_count
            },
            "stress_survey_conducted": stress_status_flag,
            "teacher_survey_conducted": teacher_survey_status,
            "pending_reports_approval": pending_reports
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
