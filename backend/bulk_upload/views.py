from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
import csv
import io
from users.models import Student, User, UserRole
from academics.models import Program, Batch, Course, CO
from assessments.models import Assessment, MarksEntry
from django.db import transaction

import pandas as pd

class BulkStudentUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        program_id = request.data.get('program_id')
        batch_id = request.data.get('batch_id')

        if not file_obj or not program_id or not batch_id:
            return Response({"error": "file, program_id, and batch_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            elif file_obj.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_obj)
            else:
                return Response({"error": "Unsupported file format. Please upload CSV or Excel."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Normalize column names to lowercase and strip whitespace
            df.columns = [c.lower().strip() for c in df.columns]
            
            required_columns = ['roll_no', 'email', 'name']
            missing = [col for col in required_columns if col not in df.columns]
            if missing:
                return Response({"error": f"Missing required columns: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

            students_created = 0
            student_role = UserRole.objects.filter(role_name='Student').first()

            with transaction.atomic():
                for _, row in df.iterrows():
                    username = str(row['roll_no']).strip()
                    email = str(row['email']).strip()
                    name = str(row['name']).strip()
                    
                    if not username or username == 'nan': continue
                    
                    user, _ = User.objects.get_or_create(
                        username=username,
                        defaults={
                            'email': email,
                            'name': name,
                            'role_id': student_role
                        }
                    )
                    
                    Student.objects.update_or_create(
                        user_id=user,
                        defaults={
                            'roll_no': username,
                            'name': name,
                            'program_id_id': program_id,
                            'batch_id_id': batch_id,
                        }
                    )
                    students_created += 1

            return Response({"message": f"Successfully uploaded {students_created} students"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BulkMarksUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        assessment_id = request.data.get('assessment_id')

        if not file_obj or not assessment_id:
            return Response({"error": "file and assessment_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        assessment = get_object_or_404(Assessment, pk=assessment_id)
        set_by = request.user if request.user and not request.user.is_anonymous else User.objects.first()

        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            elif file_obj.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_obj)
            else:
                return Response({"error": "Unsupported file format. Please upload CSV or Excel."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Normalize column names
            df.columns = [c.lower().strip() for c in df.columns]
            
            if 'roll_no' not in df.columns or 'marks' not in df.columns:
                return Response({"error": "File must contain 'roll_no' and 'marks' columns"}, status=status.HTTP_400_BAD_REQUEST)
            
            marks_created = 0

            with transaction.atomic():
                for _, row in df.iterrows():
                    roll_no = str(row['roll_no']).strip()
                    marks_obtained = row['marks']
                    
                    if not roll_no or roll_no == 'nan': continue
                    
                    student = Student.objects.filter(roll_no=roll_no).first()
                    if student:
                        MarksEntry.objects.update_or_create(
                            assessment_id=assessment,
                            student_id=student,
                            defaults={
                                'marks_obtained': marks_obtained,
                                'user_id': set_by
                            }
                        )
                        marks_created += 1

            return Response({"message": f"Successfully uploaded marks for {marks_created} students"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
