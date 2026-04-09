from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CISNature, CISType, CISTerm
from .serializers import CISNatureSerializer, CISTypeSerializer, CISTermSerializer
from .report_generator import generate_cis_report
import io

from attainment.attainment_service import AttainmentService
from attainment.models import COAttainment
from rest_framework.permissions import AllowAny
from audit.utils import log_action
from reports.utils import save_generated_report
from academics.models import Course
from django.db.models import Q
import threading

class DirectCISPreviewView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        course_id = request.query_params.get('course_id')
        academic_year = request.query_params.get('academic_year')
        
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Trigger calculation first to ensure records exist
        AttainmentService.calculate_attainment(course_id, academic_year)
        
        preview_data = AttainmentService.get_attainment_preview(course_id, academic_year)
        
        # Include consolidated ATR
        from academics.models import Course
        from attainment.models import CourseATR
        from django.db import models
        
        # Robust AY Matching
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = Q(academic_year__icontains=academic_year) | Q(academic_year__icontains=ay_clean) | Q(academic_year__icontains=ay_spaced)
        
        atr_obj = CourseATR.objects.filter(ay_query, course_id_id=course_id).first()
        if atr_obj and (atr_obj.action_proposed or atr_obj.atr_status == 'submitted'):
            course_atr = atr_obj.action_proposed or "Submitted"
        else:
            course = Course.objects.filter(pk=course_id).first()
            course_atr = course.course_atr if course else ""
            
        return Response({
            "attainment": preview_data,
            "course_atr": course_atr
        }, status=status.HTTP_200_OK)

class SubmitATRView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        course_id = request.data.get('course_id')
        course_atr = request.data.get('course_atr')
        academic_year = request.data.get('academic_year')
        
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        from academics.models import Course
        from attainment.models import COAttainment
        from django.db import models

        # Ensure we handle AY spacing consistently
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = Q(academic_year__icontains=academic_year) | Q(academic_year__icontains=ay_clean) | Q(academic_year__icontains=ay_spaced)
        
        # Update Course model (Legacy fallback)
        Course.objects.filter(pk=course_id).update(course_atr=course_atr)
        
        # Ensure CourseATR record exists for dashboard status tracking
        from attainment.models import CourseATR
        atr_obj = CourseATR.objects.filter(ay_query, course_id_id=course_id).first()
        if atr_obj:
            atr_obj.action_proposed = course_atr
            atr_obj.atr_status = 'submitted'
            atr_obj.save()
        else:
            CourseATR.objects.create(
                course_id_id=course_id,
                academic_year=academic_year or "2024-25",
                action_proposed=course_atr,
                atr_status='submitted'
            )
        
        # Update all COAttainment records for this course and year
        COAttainment.objects.filter(ay_query, course_id=course_id).update(
            atr_status='submitted',
            action_proposed=course_atr
        )

        # Trigger attainment calculation in background
        try:
            def bg_calc():
                try:
                    from attainment.attainment_service import AttainmentService
                    from django.db import connection
                    AttainmentService.check_and_generate_report(course_id, academic_year, user)
                except Exception as e:
                    print(f"Background ATR report error: {e}")
                finally:
                    from django.db import connection
                    connection.close()
            threading.Thread(target=bg_calc, daemon=True).start()
        except Exception as e:
            print(f"[Attainment] ATR submission report trigger failed: {e}")

        return Response({"message": "ATR submitted successfully"}, status=status.HTTP_200_OK)

class CalculateDirectCISView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request) -> Response:
        course_id = request.data.get('course_id')
        if not course_id:
            return Response(
                {"error": "Missing course_id in request body"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Implement actual calculation logic
        return Response(
            {"calculation_status": f"Calculation initiated for course {course_id}"},
            status=status.HTTP_200_OK
        )


class DirectCISReportView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request) -> HttpResponse:
        course_id = request.query_params.get('course_id')
        academic_year = request.query_params.get('academic_year')
        batch_id = request.query_params.get('batch_id')
        
        if not course_id:
            return Response(
                {"error": "Missing course_id in query parameters"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Trigger attainment calculation before generating report
        from attainment.attainment_service import AttainmentService
        try:
            # We don't necessarily need the return value here, just trigger it
            AttainmentService.calculate_attainment(course_id, academic_year)
        except Exception as e:
            # Log error but proceed if possible, or handle specifically
            print(f"Attainment calculation error: {e}")

        wb = generate_cis_report(course_id, academic_year, batch_id)
        if not wb:
            return Response(
                {"error": "Course not found or could not generate report"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Set up response for Excel file download
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="CIS_Report_{course_id}.xlsx"'
        
        # Save workbook to memory and then to response
        output = io.BytesIO()
        wb.save(output)
        
        # Save to database
        user = request.user if request.user and not request.user.is_anonymous else None
        course = Course.objects.filter(pk=course_id).first()
        filename = f"CIS_Report_{course.course_code if course else course_id}.xlsx"
        save_generated_report(
            user=user,
            report_type='Direct',
            year=academic_year,
            file_content=output,
            filename=filename,
            course=course
        )
        
        # Log action
        log_action(user, 'CREATE', 'Report', course_id, remark=f"Direct CIS report generated for {academic_year}", request=request)

        response.write(output.getvalue())
        
        return response


class ListIndirectToolsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request) -> Response:
        tools = Survey.objects.filter(is_active=True)
        tool_list = [{"id": s.survey_id, "name": s.survey_name} for s in tools]

        return Response({"tool_list": tool_list}, status=status.HTTP_200_OK)


class SubmitIndirectSurveyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request) -> Response:
        answers = request.data.get('answers')
        tool_id = request.data.get('tool_id')

        if not answers or not tool_id:
            return Response(
                {"error": "Both 'answers' and 'tool_id' are required in request body"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Save survey answers, add user tracking if auth implemented
        return Response({"submission_status": "success"}, status=status.HTTP_201_CREATED)


class IndirectCISReportView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request) -> Response:
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {"error": "Missing course_id in query parameters"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Replace with actual indirect CIS calculation/report
        return Response(
            {"indirect_cis_report": f"Full indirect report for course {course_id}"},
            status=status.HTTP_200_OK
        )
