from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from .models import Assessment, MarksEntry
from .serializers import AssessmentSerializer, MarksEntrySerializer
from users.models import User, Student

class AssessmentListCreateAPIView(APIView):
    def get(self, request):
        course_id = request.query_params.get('course_id')
        queryset = Assessment.objects.filter(is_active=True)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        serializer = AssessmentSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        if 'type' in data:
            data['assessment_type'] = data['type']
        if 'assessment_name' not in data:
            data['assessment_name'] = f"{data.get('type', 'Assessment')} - {data.get('course_id')}"
        if 'max_marks' not in data:
            data['max_marks'] = 100
        if 'academic_year' not in data:
            data['academic_year'] = '2023-24'
        if 'semester' not in data:
            data['semester'] = 1
        set_by = request.user if request.user and not request.user.is_anonymous else User.objects.first()
        data['created_by'] = set_by.user_id
        serializer = AssessmentSerializer(data=data)
        if serializer.is_valid():
            assessment = serializer.save()
            return Response({"assessment_id": assessment.assessment_id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AssessmentDetailAPIView(APIView):
    def put(self, request, pk):
        assessment = get_object_or_404(Assessment, pk=pk)
        serializer = AssessmentSerializer(assessment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MarksListCreateAPIView(APIView):
    def get(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        marks = MarksEntry.objects.filter(assessment_id__course_id=course_id)
        serializer = MarksEntrySerializer(marks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        assessment_id = request.data.get('assessment_id')
        marks_data = request.data.get('marks_data', [])
        if not assessment_id or not marks_data:
            return Response({"error": "assessment_id and marks_data are required"}, status=status.HTTP_400_BAD_REQUEST)
        assessment = get_object_or_404(Assessment, pk=assessment_id)
        set_by = request.user if request.user and not request.user.is_anonymous else User.objects.first()
        with transaction.atomic():
            for item in marks_data:
                student_id = item.get('student_id')
                marks_obtained = item.get('marks_obtained')
                MarksEntry.objects.update_or_create(assessment_id=assessment, student_id_id=student_id, defaults={'marks_obtained': marks_obtained, 'entered_by': set_by})
        return Response({"message": "success"}, status=status.HTTP_201_CREATED)

class EvidenceUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    def post(self, request, pk):
        assessment = get_object_or_404(Assessment, pk=pk)
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "File project is required"}, status=status.HTTP_400_BAD_REQUEST)
        assessment.evidence_file = file_obj
        assessment.save()
        return Response({"message": "message", "assessment_id": assessment.assessment_id}, status=status.HTTP_200_OK)

class EvidenceListView(APIView):
    def get(self, request, pk):
        assessment = get_object_or_404(Assessment, pk=pk)
        if not assessment.evidence_file:
            return Response({"message": "No evidence uploaded"}, status=status.HTTP_200_OK)
        return Response({"files": [{"name": assessment.evidence_file.name, "url": assessment.evidence_file.url if hasattr(assessment.evidence_file, 'url') else None}]}, status=status.HTTP_200_OK)
