from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CISNature, CISType, CISTerm
from .serializers import CISNatureSerializer, CISTypeSerializer, CISTermSerializer
from attainment.models import CourseAttainment
from surveys.models import Survey

class CalculateDirectCISView(APIView):
    def post(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"calculation status": f"Calculation initiated for course {course_id}"}, status=status.HTTP_200_OK)

class DirectCISReportView(APIView):
    def get(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"CIS report": f"Full direct report for course {course_id}"}, status=status.HTTP_200_OK)

class ListIndirectToolsView(APIView):
    def get(self, request):
        tools = Survey.objects.filter(is_active=True)
        return Response({"tool list": [{"id": s.survey_id, "name": s.survey_name} for s in tools]}, status=status.HTTP_200_OK)

class SubmitIndirectSurveyView(APIView):
    def post(self, request):
        answers = request.data.get('answers')
        tool_id = request.data.get('tool_id')
        if not answers or not tool_id:
            return Response({"error": "answers and tool_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"submission status": "success"}, status=status.HTTP_201_CREATED)

class IndirectCISReportView(APIView):
    def get(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"indirect CIS report": f"Full indirect report for course {course_id}"}, status=status.HTTP_200_OK)
