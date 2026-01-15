from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
import csv
import io
from datetime import datetime
from .models import TeachingPlan, TeachingPlanLecture
from .serializer import TeachingPlanSerializer, TeachingPlanLectureSerializer
from academics.models import CO

class TeachingPlanListCreateView(generics.ListCreateAPIView):
    queryset = TeachingPlan.objects.all()
    serializer_class = TeachingPlanSerializer

class TeachingPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TeachingPlan.objects.all()
    serializer_class = TeachingPlanSerializer

class BulkUploadTopicsView(APIView):
    """
    Bulk upload topics for a teaching plan via CSV.
    Method: POST | Endpoint: /teaching-plan/{id}/upload-topics/
    CSV format: lecture_no, unit_no, topic_planned, co_number, lecture_date (YYYY-MM-DD)
    """
    def post(self, request, pk):
        plan = get_object_or_404(TeachingPlan, pk=pk)
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not file_obj.name.endswith('.csv'):
            return Response({"error": "Please upload a CSV file"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file_obj.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            topics_created = 0
            errors = []
            
            for row_num, row in enumerate(reader, start=1):
                try:
                    lecture_no = row.get('lecture_no')
                    unit_no = row.get('unit_no')
                    topic_planned = row.get('topic_planned')
                    co_number = row.get('co_number')
                    lecture_date_str = row.get('lecture_date')
                    
                    if not all([lecture_no, unit_no, topic_planned, co_number, lecture_date_str]):
                        errors.append(f"Row {row_num}: Missing required fields")
                        continue
                        
                    # Find CO
                    co = CO.objects.filter(course_id=plan.course_id, co_number=co_number).first()
                    if not co:
                        errors.append(f"Row {row_num}: CO '{co_number}' not found for this course")
                        continue
                        
                    # Parse date
                    try:
                        lecture_date = datetime.strptime(lecture_date_str, '%Y-%m-%d').date()
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid date format. Use YYYY-MM-DD")
                        continue
                        
                    TeachingPlanLecture.objects.update_or_create(
                        teaching_plan_id=plan,
                        lecture_no=lecture_no,
                        defaults={
                            'unit_no': unit_no,
                            'topic_planned': topic_planned,
                            'co_id': co,
                            'lecture_date': lecture_date,
                        }
                    )
                    topics_created += 1
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            return Response({
                "message": f"Successfully processed {topics_created} lectures",
                "errors": errors
            }, status=status.HTTP_201_CREATED if topics_created > 0 else status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({"error": f"Failed to process CSV: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
