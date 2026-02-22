from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import COAttainment, POAttainment, PSOAttainment, AttainmentSnapshot
from rest_framework.permissions import AllowAny

from .serializers import (
    COAttainmentSerializer, POAttainmentSerializer, 
    PSOAttainmentSerializer, AttainmentSnapshotSerializer
)
# from academics.models import Course, Program
# from users.models import User

from .attainment_service import AttainmentService

class CalculateAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        course_id = request.data.get('course_id')
        academic_year = request.data.get('academic_year', '2023-24') # Default fallback
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            results = AttainmentService.calculate_attainment(course_id, academic_year)
            if results:
                return Response({
                    "message": f"Attainment calculation completed for course {course_id}",
                    "results": results
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Insufficient data for calculation"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class COAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        academic_year = request.query_params.get('academic_year')
        
        queryset = COAttainment.objects.filter(is_active=True)
        if program_id:
            queryset = queryset.filter(course_id__program_id=program_id)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
            
        serializer = COAttainmentSerializer(queryset, many=True)
        return Response({"CO attainment": serializer.data}, status=status.HTTP_200_OK)


class POAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        academic_year = request.query_params.get('academic_year')
        
        queryset = POAttainment.objects.filter(is_active=True)
        if program_id:
            queryset = queryset.filter(po_id__program_id=program_id)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
            
        serializer = POAttainmentSerializer(queryset, many=True)
        return Response({"PO attainment": serializer.data}, status=status.HTTP_200_OK)


class PSOAttainmentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        program_id = request.query_params.get('program_id')
        academic_year = request.query_params.get('academic_year')
        
        queryset = PSOAttainment.objects.filter(is_active=True)
        if program_id:
            queryset = queryset.filter(pso_id__program_id=program_id)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
            
        serializer = PSOAttainmentSerializer(queryset, many=True)
        return Response({"PSO attainment": serializer.data}, status=status.HTTP_200_OK)


class CreateSnapshotView(APIView):
    def post(self, request):
        month = request.data.get('month')
        year = request.data.get('year')
        if not month or not year:
            return Response({"error": "month and year are required"}, status=status.HTTP_400_BAD_REQUEST)
        course = Course.objects.first()
        verified_by = request.user if request.user and not request.user.is_anonymous else User.objects.first()
        if not course or not verified_by:
             return Response({"error": "Initial data missing for snapshot"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        snapshot = AttainmentSnapshot.objects.create(month=month, year=year, course_id=course, attainment_value=0.0, verified_by=verified_by, remarks="Initial snapshot")
        return Response({"snapshot_id": snapshot.snapshot_id}, status=status.HTTP_201_CREATED)

class SnapshotHistoryView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        snapshots = AttainmentSnapshot.objects.all()
        serializer = AttainmentSnapshotSerializer(snapshots, many=True)
        return Response({"snapshot list": serializer.data}, status=status.HTTP_200_OK)
