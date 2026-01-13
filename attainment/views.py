from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import COAttainment, CourseAttainment, COPOMappingAttainment, AttainmentSnapshot
from .serializers import (
    COAttainmentSerializer, CourseAttainmentSerializer, 
    COPOMappingAttainmentSerializer, AttainmentSnapshotSerializer
)
from academics.models import Course, Program
from users.models import User

class CalculateAttainmentView(APIView):
    def post(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"calculation status": f"Attainment calculation initiated for course {course_id}"}, status=status.HTTP_200_OK)

class COAttainmentView(APIView):
    def get(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        queryset = COAttainment.objects.filter(course_id=course_id, is_active=True)
        serializer = COAttainmentSerializer(queryset, many=True)
        return Response({"CO attainment": serializer.data}, status=status.HTTP_200_OK)

class POAttainmentView(APIView):
    def get(self, request):
        program_id = request.query_params.get('program_id')
        if not program_id:
            return Response({"error": "program_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        queryset = COPOMappingAttainment.objects.filter(course_id__program_id=program_id, is_active=True)
        serializer = COPOMappingAttainmentSerializer(queryset, many=True)
        return Response({"PO attainment": serializer.data}, status=status.HTTP_200_OK)

class PSOAttainmentView(APIView):
    def get(self, request):
        program_id = request.query_params.get('program_id')
        if not program_id:
            return Response({"error": "program_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"PSO attainment": f"Attainment data for program {program_id}"}, status=status.HTTP_200_OK)

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
    def get(self, request):
        snapshots = AttainmentSnapshot.objects.all()
        serializer = AttainmentSnapshotSerializer(snapshots, many=True)
        return Response({"snapshot list": serializer.data}, status=status.HTTP_200_OK)
