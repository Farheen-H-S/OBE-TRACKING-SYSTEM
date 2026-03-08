from rest_framework import generics, status
from audit.utils import log_action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
import csv
import io
from datetime import datetime
from .models import TeachingPlan, TeachingPlanLecture
from .serializers import TeachingPlanSerializer
from academics.models import CO
from django.db.models import Max

class TeachingPlanListCreateView(generics.ListCreateAPIView):
    queryset = TeachingPlan.objects.all()
    serializer_class = TeachingPlanSerializer

    def get_queryset(self):
        queryset = TeachingPlan.objects.all()
        course_id = self.request.query_params.get('course_id')
        academic_year = self.request.query_params.get('academic_year')
        semester = self.request.query_params.get('semester')
        scheme_id = self.request.query_params.get('scheme_id')
        batch_id = self.request.query_params.get('batch_id')
        
        # Robust filtering helper
        def is_valid_filter(val):
            return val and val not in ["All", "0", "", "null", "undefined", "None"]

        if is_valid_filter(academic_year):
            from django.db.models import Q
            ay_clean = academic_year.replace(" ", "")
            ay_parts = ay_clean.split('-') if '-' in ay_clean else [ay_clean, ""]
            ay_standard = f"{ay_parts[0]} - {ay_parts[1]}" if len(ay_parts) > 1 else ay_clean
            queryset = queryset.filter(Q(academic_year=ay_clean) | Q(academic_year=ay_standard))
        
        if is_valid_filter(course_id): queryset = queryset.filter(course_id=course_id)
        if is_valid_filter(semester): queryset = queryset.filter(semester=semester)
        if is_valid_filter(scheme_id): queryset = queryset.filter(scheme_id=scheme_id)
        
        if is_valid_filter(batch_id):
            try:
                if str(batch_id).isdigit():
                    queryset = queryset.filter(batch_id=batch_id)
                else:
                    # Treat as batch year format "2025-26"
                    batch_start = str(batch_id).split('-')[0].replace(" ", "")
                    if batch_start.isdigit():
                        queryset = queryset.filter(batch_id__batch_year=int(batch_start))
            except:
                pass
            
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'TeachingPlan', instance.teaching_plan_id, new_value=serializer.data)

class TeachingPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TeachingPlan.objects.all()
    serializer_class = TeachingPlanSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'UPDATE', 'TeachingPlan', instance.teaching_plan_id, new_value=serializer.data)
    
    def perform_destroy(self, instance):
        log_id = instance.teaching_plan_id
        instance.delete()
        log_action(self.request.user, 'DELETE', 'TeachingPlan', log_id)

class BulkUploadTopicsView(APIView):
    """
    Bulk upload topics for a teaching plan via CSV.
    Method: POST | Endpoint: /teaching-plan/{id}/upload-topics/
    CSV format: topic_name, co_number, planned_date (YYYY-MM-DD), delivery_method
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
            
            # Determine starting lecture number
            max_lecture_no = TeachingPlanLecture.objects.filter(teaching_plan_id=plan).aggregate(Max('lecture_no'))['lecture_no__max']
            current_lecture_no = (max_lecture_no or 0) + 1

            for row_num, row in enumerate(reader, start=1):
                try:
                    co_number = row.get('co_number')
                    topic_name = row.get('topic_name')
                    planned_date_str = row.get('planned_date')
                    delivery_method = row.get('delivery_method', 'LECTURE').upper()
                    
                    if not all([co_number, topic_name, planned_date_str]):
                        errors.append(f"Row {row_num}: Missing required fields")
                        continue
                        
                    # Find CO
                    co = CO.objects.filter(course_id=plan.course_id, co_number=co_number).first()
                    if not co:
                        errors.append(f"Row {row_num}: CO '{co_number}' not found for this course")
                        continue
                        
                    # Parse date
                    try:
                        planned_date = datetime.strptime(planned_date_str, '%Y-%m-%d').date()
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid date format. Use YYYY-MM-DD")
                        continue
                        
                    TeachingPlanLecture.objects.create(
                        teaching_plan_id=plan,
                        lecture_no=current_lecture_no,
                        unit_no=1, # Default unit number as it is required but not in CSV
                        topic_planned=topic_name,
                        co_id=co,
                        lecture_date=planned_date,
                        remark=f"Delivery Method: {delivery_method}"
                    )
                    current_lecture_no += 1
                    topics_created += 1
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            log_action(request.user, 'CREATE', 'TeachingPlanLecture', plan.id, remark=f"Bulk uploaded {topics_created} topics")

            return Response({
                "message": f"Successfully uploaded {topics_created} topics",
                "errors": errors
            }, status=status.HTTP_201_CREATED if topics_created > 0 else status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({"error": f"Failed to process CSV: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
