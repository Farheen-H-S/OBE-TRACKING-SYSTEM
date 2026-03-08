from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from django.utils import timezone
from .models import User, FacultyCourseAssignment, Student
from academics.models import AcademicSetup, Course, COTarget
from reports.models import Report, DACReport
from attainment.models import COAttainment, POAttainment, PSOAttainment
from assessments.models import Assessment, MarksEntry, CisEvidence

class CoordinatorDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get filters from query params
        dept_id = request.query_params.get('dept_id')
        scheme_id = request.query_params.get('scheme_id')
        academic_year = request.query_params.get('academic_year')
        class_name = request.query_params.get('class_name')

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

        academic_setup = AcademicSetup.objects.first()
        final_academic_year = academic_year or (academic_setup.academic_year if academic_setup else "2025-26")
        year_str = final_academic_year

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
        if scheme_id:
            courses = courses.filter(scheme_id=scheme_id)
        if class_name and class_name in ['FY', 'SY', 'TY']:
            courses = courses.filter(class_year=class_name).distinct()    
            
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
            
            # Determine tool status
            tools_json = course.assessment_tools or {}
            details = []
            
            # Helper to check if marks/evidence exist
            def check_tool_status(tool_name):
                # Using CisEvidence as the source of truth for if a tool is uploaded
                exists = CisEvidence.objects.filter(course_id=course, academic_year=year_str, assessment_tool=tool_name).exists()
                if not exists:
                    # Fallback check marks entry
                    assessments = Assessment.objects.filter(course_id=course, academic_year=year_str, assessment_type=tool_name)
                    if assessments.exists():
                        exists = MarksEntry.objects.filter(assessment_id__in=assessments).exists()
                return "uploaded" if exists else "pending"

            # Parse JSON to find enabled tools e.g., {"FA-TH": true, "SA-TH": true}
            for tool_name, is_enabled in tools_json.items():
                if is_enabled:
                    status_str = check_tool_status(tool_name)
                    details.append({"label": tool_name, "status": status_str})
                    
            if not details:
                # Fallback if tools aren't configured
                details = [{"label": "Configuration", "status": "pending"}]
            
            subject_coverage.append({
                "subject": course.course_name,
                "co_attainment": f"{course_att_perc}%",
                "details": details
            })

        # 4. DAC Report Upload Date
        last_dac = DACReport.objects.filter(program_id=dept, academic_year=year_str).order_by('-uploaded_at').first()
        last_dac_upload_date = last_dac.uploaded_at.strftime('%d/%m/%Y') if last_dac else "Not uploaded"

        # 5. PO & PSO Attainment Chart (Same as HOD Dashboard)
        dept_po_stats = POAttainment.objects.filter(academic_year=year_str, course_id__in=courses).values('po_id__po_number').annotate(avg_att=Avg('normalized_value')).order_by('po_id__po_number')
        attainment_bar_data = [["Outcome", "Percentage", { "role": "style" }]]
        colors = ["#4285f4", "#ea4335", "#fbbc05", "#34a853", "#ff6d01", "#46bdc6"]
        idx = 0
        
        if dept_po_stats.exists():
            for stat in dept_po_stats:
                label = stat['po_id__po_number'].upper()
                avg_val = round((stat['avg_att'] / 3.0) * 100, 1)
                attainment_bar_data.append([label, avg_val, colors[idx % len(colors)]])
                idx += 1
        else:
            attainment_bar_data.extend([["PO 1", 0, "#4285f4"], ["PO 2", 0, "#ea4335"], ["PO 3", 0, "#fbbc05"]])
            
        dept_pso_stats = PSOAttainment.objects.filter(academic_year=year_str, course_id__in=courses).values('pso_id__pso_number').annotate(avg_att=Avg('normalized_value')).order_by('pso_id__pso_number')
        if dept_pso_stats.exists():
            for stat in dept_pso_stats:
                label = stat['pso_id__pso_number'].upper()
                avg_val = round((stat['avg_att'] / 3.0) * 100, 1)
                attainment_bar_data.append([label, avg_val, colors[idx % len(colors)]])
                idx += 1 

        return Response({
            "academic": academic_data,
            "health": [mapping_health, verification_health, target_health, achieved_health],
            "coverage": subject_coverage,
            "last_dac_upload_date": last_dac_upload_date,
            "po_pso_attainment": attainment_bar_data
        }, status=status.HTTP_200_OK)
