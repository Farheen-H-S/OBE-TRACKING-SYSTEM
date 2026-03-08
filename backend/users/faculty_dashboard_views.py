from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg
from .models import FacultyCourseAssignment
from academics.models import Course, AcademicSetup
from assessments.models import Assessment, MarksEntry
from attainment.models import COAttainment, POAttainment, PSOAttainment
from reports.models import Report

class FacultyDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get filters from query params
        scheme_id = request.query_params.get('scheme_id')
        academic_year = request.query_params.get('academic_year')

        # Get courses assigned to this faculty
        assignments = FacultyCourseAssignment.objects.filter(faculty_id=user, is_active=True).select_related('course_id')
        
        if scheme_id:
            assignments = assignments.filter(course_id__scheme_id=scheme_id)
            
        courses = [a.course_id for a in assignments]
        
        if not courses:
            return Response({"message": "No courses assigned to this faculty for selected filters."}, status=status.HTTP_200_OK)

        academic_setup = AcademicSetup.objects.first()
        final_academic_year = academic_year or (academic_setup.academic_year if academic_setup else "2025-26")
        academic_year_query = final_academic_year.replace(' ', '')

        # 1. CT-1 and CT-2 Average Marks per Subject
        ct1_data = [["Subject", "Average"]]
        ct2_data = [["Subject", "Average"]]
        comparison_data = [["Subject", "CT 1", "CT 2"]]
        comparison_table = []

        for course in courses:
            subj_abbr = course.course_abbr or course.course_code
            
            # Fetch CT1
            ct1_assessment = Assessment.objects.filter(
                course_id=course, 
                assessment_type='FA_TH', 
                assessment_name__icontains='CT1',
                academic_year__icontains=academic_year_query
            ).first()
            
            ct1_avg = 0
            if ct1_assessment:
                ct1_avg = MarksEntry.objects.filter(assessment_id=ct1_assessment).aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0
            
            # Fetch CT2
            ct2_assessment = Assessment.objects.filter(
                course_id=course, 
                assessment_type='FA_TH', 
                assessment_name__icontains='CT2',
                academic_year__icontains=academic_year_query
            ).first()
            
            ct2_avg = 0
            if ct2_assessment:
                ct2_avg = MarksEntry.objects.filter(assessment_id=ct2_assessment).aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0
            
            ct1_data.append([subj_abbr, round(ct1_avg, 2)])
            ct2_data.append([subj_abbr, round(ct2_avg, 2)])
            comparison_data.append([subj_abbr, round(ct1_avg, 2), round(ct2_avg, 2)])
            
            diff = round(ct2_avg - ct1_avg, 2)
            comparison_table.append({
                "subject": subj_abbr,
                "ct1": round(ct1_avg, 2),
                "ct2": round(ct2_avg, 2),
                "diff": diff,
                "type": "positive" if diff > 0 else ("negative" if diff < 0 else "neutral")
            })

        # 2. Per-course CO Attainment breakdown
        co_attainment_per_course = []
        for course in courses:
            subj_label = course.course_abbr or course.course_code
            course_co_stats = COAttainment.objects.filter(
                course_id=course,
                academic_year=final_academic_year
            ).values('co_id__co_number').annotate(avg_att=Avg('overall_attainment')).order_by('co_id__co_number')

            chart_data = [["CO", "Attainment %", {"role": "annotation"}]]
            for stat in course_co_stats:
                co_label = stat['co_id__co_number'].upper()
                avg_perc = round((stat['avg_att'] / 3.0) * 100, 1)
                chart_data.append([co_label, avg_perc, str(avg_perc)])

            if len(chart_data) == 1:
                chart_data.extend([["CO 1", 0, "0"], ["CO 2", 0, "0"], ["CO 3", 0, "0"]])

            co_attainment_per_course.append({
                "course": subj_label,
                "course_name": course.course_name,
                "chart_data": chart_data
            })

        # 3. PO & PSO Attainment (across assigned courses)
        colors = ["#4285f4", "#ea4335", "#fbbc05", "#34a853", "#ff6d01", "#46bdc6"]
        attainment_bar_data = [["Outcome", "Attainment %", {"role": "style"}]]
        idx = 0

        dept_po_stats = POAttainment.objects.filter(
            academic_year=final_academic_year, course_id__in=courses
        ).values('po_id__po_number').annotate(avg_att=Avg('normalized_value')).order_by('po_id__po_number')

        if dept_po_stats.exists():
            for stat in dept_po_stats:
                label = stat['po_id__po_number'].upper()
                avg_val = round((stat['avg_att'] / 3.0) * 100, 1)
                attainment_bar_data.append([label, avg_val, colors[idx % len(colors)]])
                idx += 1
        else:
            attainment_bar_data.extend([["PO 1", 0, "#4285f4"], ["PO 2", 0, "#ea4335"], ["PO 3", 0, "#fbbc05"]])

        dept_pso_stats = PSOAttainment.objects.filter(
            academic_year=final_academic_year, course_id__in=courses
        ).values('pso_id__pso_number').annotate(avg_att=Avg('normalized_value')).order_by('pso_id__pso_number')

        if dept_pso_stats.exists():
            for stat in dept_pso_stats:
                label = stat['pso_id__pso_number'].upper()
                avg_val = round((stat['avg_att'] / 3.0) * 100, 1)
                attainment_bar_data.append([label, avg_val, colors[idx % len(colors)]])
                idx += 1

        # 3. Top Stats
        pending_reports = Report.objects.filter(
            user_id_created=user,
            status__in=['Draft', 'Pending']
        ).count()

        assessments_configured = Assessment.objects.filter(
            course_id__in=courses,
            academic_year__icontains=academic_year_query
        ).count()

        top_stats = {
            "assigned_courses": len(courses),
            "pending_reports": pending_reports,
            "assessments_configured": assessments_configured,
            "academic_year": final_academic_year,
        }

        return Response({
            "top_stats": top_stats,
            "ct1": ct1_data,
            "ct2": ct2_data,
            "comparison": comparison_data,
            "comparison_table": comparison_table,
            "co_attainment_per_course": co_attainment_per_course,
            "po_pso_attainment": attainment_bar_data
        }, status=status.HTTP_200_OK)
