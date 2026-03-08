from django.shortcuts import get_object_or_404
from django.db import models, transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.permissions import IsAdmin, IsHOD, IsFaculty, IsCoordinator, IsAuditor
from audit.utils import log_action

from .models import (
    Program, Scheme, Course, CO, PO, PSO,
    COPOMapping, COPSOMapping, COTarget, POTarget, PSOTarget, Batch,
    AcademicSetup, ProgramStatement, PEO
)
from .serializers import (
    ProgramSerializer, CourseSerializer, COSerializer,
    POSerializer, PSOSerializer, COPOMappingSerializer,
    COPSOMappingSerializer, COTargetSerializer, POTargetSerializer, PSOTargetSerializer,
    AcademicSetupSerializer, SchemeSerializer, BatchSerializer,
    ProgramStatementSerializer, PEOSerializer
)
from users.models import FacultyCourseAssignment

class AcademicSetupAPIView(APIView):
    permission_classes = [IsAuthenticated] # Allow all authenticated users to GET

    def get(self, request):
        setup = AcademicSetup.objects.first()
        if not setup:
            return Response({}, status=status.HTTP_200_OK)
        serializer = AcademicSetupSerializer(setup)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        setup = AcademicSetup.objects.first()
        old_value = AcademicSetupSerializer(setup).data if setup else None
        
        serializer = AcademicSetupSerializer(setup, data=request.data)
        if serializer.is_valid():
            setup = serializer.save()
            
            log_action(
                request.user, 
                'UPDATE' if old_value else 'CREATE', 
                'AcademicSetup', 
                setup.pk, 
                old_value=old_value, 
                new_value=serializer.data
            )
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        setup = AcademicSetup.objects.first()
        if not setup:
            return Response({"error": "Academic setup not configured yet."}, status=status.HTTP_404_NOT_FOUND)

        old_value = AcademicSetupSerializer(setup).data
        serializer = AcademicSetupSerializer(setup, data=request.data, partial=True)
        if serializer.is_valid():
            setup = serializer.save()
            log_action(request.user, 'UPDATE', 'AcademicSetup', setup.pk, old_value=old_value, new_value=serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SchemeListAPIView(APIView):
    def get(self, request):
        show_all = request.query_params.get('all', 'false').lower() == 'true'
        schemes = Scheme.objects.all() if show_all else Scheme.objects.filter(is_active=True)
        serializer = SchemeSerializer(schemes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SchemeSerializer(data=request.data)
        if serializer.is_valid():
            scheme = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SchemeDetailAPIView(APIView):
    def get_object(self, pk):
        return get_object_or_404(Scheme, pk=pk)

    def get(self, request, pk):
        serializer = SchemeSerializer(self.get_object(pk))
        return Response(serializer.data)

    def put(self, request, pk):
        scheme = self.get_object(pk)
        serializer = SchemeSerializer(scheme, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        scheme = self.get_object(pk)
        scheme.is_active = False
        scheme.save()
        return Response({'message': 'Scheme disabled'}, status=status.HTTP_200_OK)

class BatchListAPIView(APIView):
    def get(self, request):
        show_all = request.query_params.get('all', 'false').lower() == 'true'
        program_id = request.query_params.get('program_id')
        batches = Batch.objects.all() if show_all else Batch.objects.filter(is_active=True)
        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BatchSerializer(data=request.data)
        if serializer.is_valid():
            batch = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BatchDetailAPIView(APIView):
    def get_object(self, pk):
        return get_object_or_404(Batch, pk=pk)

    def get(self, request, pk):
        serializer = BatchSerializer(self.get_object(pk))
        return Response(serializer.data)

    def put(self, request, pk):
        batch = self.get_object(pk)
        serializer = BatchSerializer(batch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        batch = self.get_object(pk)
        batch.is_active = False
        batch.save()
        return Response({'message': 'Batch disabled'}, status=status.HTTP_200_OK)

# ---------------- PROGRAM ----------------

class ProgramListCreateAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        show_all = request.query_params.get('all', 'false').lower() == 'true'
        if show_all:
            programs = Program.objects.all().order_by('program_name')
        else:
            programs = Program.objects.filter(is_active=True).order_by('program_name')
        serializer = ProgramSerializer(programs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        if 'name' in data:
            data['program_name'] = data['name']
        serializer = ProgramSerializer(data=data)
        if serializer.is_valid():
            program = serializer.save()
            log_action(request.user, 'CREATE', 'Program', program.program_id, new_value=serializer.data)
            return Response({"program_id": program.program_id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProgramDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        program = get_object_or_404(Program, pk=pk)
        serializer = ProgramSerializer(program)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        program = get_object_or_404(Program, pk=pk)
        data = request.data.copy()
        if 'name' in data:
            data['program_name'] = data['name']
        if 'status' in data:
            data['is_active'] = data['status'].lower() == 'active'
        serializer = ProgramSerializer(program, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(request.user, 'UPDATE', 'Program', program.program_id, new_value=serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        program = get_object_or_404(Program, pk=pk)
        program.is_active = False
        program.save()
        log_action(request.user, 'DISABLE', 'Program', program.program_id, remark="Program disabled")
        return Response({"message": "program disabled"}, status=status.HTTP_200_OK)

# ---------------- COURSE ----------------

class CourseListCreateAPIView(APIView):
    def get(self, request):
        user = request.user
        program_id = request.query_params.get('program_id')
        semester = request.query_params.get('semester')
        class_year = request.query_params.get('class_year')
        scheme_id = request.query_params.get('scheme_id')
        intro_year = request.query_params.get('intro_year')
        batch_id = request.query_params.get('batch_id')
        academic_year = request.query_params.get('academic_year')
        
        # Robust filtering helper
        def is_valid_filter(val):
            return val and val not in ["All", "0", "", "null", "undefined", "None"]

        if user.is_authenticated and user.role_id.role_name == "Faculty":
            from users.models import FacultyCourseAssignment
            from django.db.models import Q
            q_assign = Q(faculty_id=user, is_active=True)
            if is_valid_filter(academic_year):
                # Handle both "2025-26" and "2025 - 26" formats
                ay_clean = academic_year.replace(" ", "")
                ay_parts = ay_clean.split('-') if '-' in ay_clean else [ay_clean, ""]
                ay_standard = f"{ay_parts[0]} - {ay_parts[1]}" if len(ay_parts) > 1 else ay_clean
                
                q_assign &= (Q(academic_year=ay_clean) | Q(academic_year=ay_standard))
            
            assignments = FacultyCourseAssignment.objects.filter(q_assign)
            course_ids = assignments.values_list('course_id', flat=True).distinct()
            courses = Course.objects.filter(course_id__in=course_ids, is_active=True).distinct()
        else:
            courses = Course.objects.filter(is_active=True).distinct()

        if is_valid_filter(program_id): courses = courses.filter(program_id=program_id)
        if is_valid_filter(semester): courses = courses.filter(semester=semester)
        if is_valid_filter(class_year): courses = courses.filter(class_year=class_year)
        if is_valid_filter(scheme_id): courses = courses.filter(scheme_id=scheme_id)
        if is_valid_filter(intro_year): courses = courses.filter(introduction_year=intro_year)
        
        # Batch filtering
        if is_valid_filter(batch_id):
            try:
                batch_str = str(batch_id).strip()
                # Try format "2025-26" or "2025 - 26"
                batch_start_year = batch_str.split('-')[0].replace(" ", "")
                if batch_start_year.isdigit():
                    courses = courses.filter(batches__batch_year=int(batch_start_year))
                elif batch_str.isdigit():
                    courses = courses.filter(batches__batch_id=int(batch_str))
            except (ValueError, IndexError):
                pass
        
        courses = courses.distinct()
        
        print(f"DEBUG: Resulting course count: {courses.count()}")
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role_id.role_name not in ["Admin", "HOD", "Coordinator"]:
            return Response({"error": "Only Admins, HODs, and Coordinators can create courses."}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        if 'name' in data: data['course_name'] = data['name']

        if not data.get('scheme_id'):
            fallback_scheme = Scheme.objects.first()
            if fallback_scheme: data['scheme_id'] = fallback_scheme.scheme_id

        if 'semester' not in data: data['semester'] = 1

        try:
            with transaction.atomic():
                serializer = CourseSerializer(data=data)
                if serializer.is_valid():
                    course = serializer.save()
                    
                    batch_years = data.get('batches', [])
                    if batch_years is not None:
                        batch_objs = []
                        for by in batch_years:
                            try:
                                # Handle case where 'by' might be a full batch string or an ID
                                if isinstance(by, (int, str)) and str(by).isdigit():
                                    batch = Batch.objects.filter(pk=int(by)).first()
                                    if batch: batch_objs.append(batch)
                                else:
                                    # Parse year from string like "2023-24"
                                    year_val_str = str(by).split('-')[0].strip()
                                    if not year_val_str.isdigit(): continue
                                    year_val = int(year_val_str)
                                    batch, _ = Batch.objects.get_or_create(
                                        batch_year=year_val, 
                                        scheme_id=course.scheme_id,
                                        defaults={'start_year': year_val, 'end_year': year_val + 4}
                                    )
                                    batch_objs.append(batch)
                            except (ValueError, IndexError): continue
                        # Always call set() to handle deselection/empty lists correctly
                        course.batches.set(batch_objs)

                    faculty_id = data.get('faculty_assigned')
                    if faculty_id:
                        try:
                            from users.models import User, FacultyCourseAssignment
                            from notifications.utils import send_obe_notification
                            setup = AcademicSetup.objects.first()
                            academic_year = setup.academic_year if setup else "2025-26"
                            faculty_user = User.objects.get(pk=faculty_id)

                            existing = FacultyCourseAssignment.objects.filter(
                                course_id=course, academic_year=academic_year, semester=course.semester
                            ).first()
                            old_faculty = existing.faculty_id if existing else None

                            FacultyCourseAssignment.objects.update_or_create(
                                course_id=course, academic_year=academic_year, semester=course.semester,
                                defaults={'faculty_id': faculty_user, 'is_active': True}
                            )

                            if old_faculty != faculty_user:
                                title = f"Course Assigned: {course.course_code}"
                                message = f"Dear {faculty_user.name},\n\nYou have been newly assigned to teach {course.course_name} ({course.course_code}) for the academic year {academic_year}."
                                send_obe_notification(
                                    recipient=faculty_user,
                                    title=title,
                                    message=message,
                                    notification_type='INFO',
                                    module='COURSE',
                                    priority='NORMAL',
                                    send_email=True
                                )
                        except Exception as fa_err: print(f"DEBUG: Error saving faculty assignment: {fa_err}")

                    cos_data = data.get('cos', [])
                    if cos_data:
                        from .models import CO
                        for co_item in cos_data:
                            CO.objects.create(
                                course_id=course,
                                co_number=co_item.get('no') or co_item.get('co_number'),
                                description=co_item.get('text') or co_item.get('description')
                            )
                    
                    log_action(request.user, 'CREATE', 'Course', course.course_id, new_value=serializer.data)
                    return Response({"course_id": course.course_id}, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CourseDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        serializer = CourseSerializer(course)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        if request.user.role_id.role_name not in ["Admin", "HOD", "Coordinator", "Faculty"]:
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        
        course = get_object_or_404(Course, pk=pk)
        data = request.data.copy()
        if 'name' in data: data['course_name'] = data['name']
        if 'status' in data: data['is_active'] = data['status'].lower() == 'active'

        try:
            with transaction.atomic():
                serializer = CourseSerializer(course, data=data)
                if serializer.is_valid():
                    course = serializer.save()
                    
                    if 'batches' in data:
                        batch_years = data.get('batches', [])
                        batch_objs = []
                        for by in batch_years:
                            try:
                                if isinstance(by, (int, str)) and str(by).isdigit():
                                    batch = Batch.objects.filter(pk=int(by)).first()
                                    if batch: batch_objs.append(batch)
                                else:
                                    year_val_str = str(by).split('-')[0].strip()
                                    if not year_val_str.isdigit(): continue
                                    year_val = int(year_val_str)
                                    batch, _ = Batch.objects.get_or_create(
                                        batch_year=year_val, scheme_id=course.scheme_id,
                                        defaults={'start_year': year_val, 'end_year': year_val + 4}
                                    )
                                    batch_objs.append(batch)
                            except (ValueError, IndexError): continue
                        course.batches.set(batch_objs)

                    faculty_id = data.get('faculty_assigned')
                    # RBAC: Prevent faculty from changing assigned faculty
                    if faculty_id and request.user.role_id.role_name.upper() == 'FACULTY':
                        faculty_id = None
                        
                    if faculty_id:
                        try:
                            from users.models import User, FacultyCourseAssignment
                            from notifications.utils import send_obe_notification
                            setup = AcademicSetup.objects.first()
                            academic_year = setup.academic_year if setup else "2025-26"
                            faculty_user = User.objects.get(pk=faculty_id)

                            existing = FacultyCourseAssignment.objects.filter(
                                course_id=course, academic_year=academic_year, semester=course.semester
                            ).first()
                            old_faculty = existing.faculty_id if existing else None

                            FacultyCourseAssignment.objects.update_or_create(
                                course_id=course, academic_year=academic_year, semester=course.semester,
                                defaults={'faculty_id': faculty_user, 'is_active': True}
                            )

                            if old_faculty != faculty_user:
                                title = f"Course Assigned: {course.course_code}"
                                message = f"Dear {faculty_user.name},\n\nYou have been assigned to teach {course.course_name} ({course.course_code}) for the academic year {academic_year}."
                                send_obe_notification(
                                    recipient=faculty_user,
                                    title=title,
                                    message=message,
                                    notification_type='INFO',
                                    module='COURSE',
                                    priority='NORMAL',
                                    send_email=True
                                )
                        except Exception as fa_err: print(f"DEBUG: Error updating faculty assignment: {fa_err}")

                    if 'cos' in data:
                        cos_data = data.get('cos', [])
                        from .models import CO
                        existing_cos = {c.co_number: c for c in CO.objects.filter(course_id=course)}
                        processed_numbers = set()
                        for co_item in cos_data:
                            num = co_item.get('no') or co_item.get('co_number')
                            desc = co_item.get('text') or co_item.get('description')
                            if not num: continue
                            processed_numbers.add(num)
                            if num in existing_cos:
                                co_obj = existing_cos[num]
                                if co_obj.description != desc:
                                    co_obj.description = desc
                                    co_obj.save()
                            else:
                                CO.objects.create(course_id=course, co_number=num, description=desc)
                        
                        for num, co_obj in existing_cos.items():
                            if num not in processed_numbers:
                                try: co_obj.delete()
                                except Exception: pass
                    
                    log_action(request.user, 'UPDATE', 'Course', course.course_id, new_value=serializer.data)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            course = serializer.save()
            log_action(request.user, 'UPDATE', 'Course', course.course_id, new_value=serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        course.is_active = False
        course.save()
        log_action(request.user, 'DISABLE', 'Course', course.course_id, remark="Course disabled")
        return Response({"message": "course disabled"}, status=status.HTTP_200_OK)

class RequestATRAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        assignment = FacultyCourseAssignment.objects.filter(course_id=course, is_active=True).first()
        if not assignment or not assignment.faculty_id:
            return Response({"error": "No faculty assigned."}, status=status.HTTP_404_NOT_FOUND)
            
        faculty = assignment.faculty_id
        try:
            from notifications.utils import send_obe_notification
            import smtplib
            title = f"ATR Required: {course.course_code}"
            message = f"Dear {faculty.name},\n\nPlease submit ATR for {course.course_name} ({course.course_code})."
            success = send_obe_notification(recipient=faculty, title=title, message=message, notification_type='ALERT', module='TARGETS', priority='HIGH', send_email=True)
            if success: return Response({"message": f"Notification sent to {faculty.name}."})
            return Response({"error": "Failed to dispatch notification."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except smtplib.SMTPAuthenticationError:
            return Response({"error": "Email notification failed: SMTP Authentication error. Please check server email settings."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CourseAssignmentAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        f_id, c_id, ay, sem = request.data.get('faculty_id'), request.data.get('course_id'), request.data.get('academic_year'), request.data.get('semester')
        if not all([f_id, c_id, ay, sem]): return Response({"error": "All fields required"}, status=400)
        
        try:
            from users.models import User
            from .models import Course
            from notifications.utils import send_obe_notification

            existing = FacultyCourseAssignment.objects.filter(
                course_id_id=c_id, academic_year=ay, semester=sem
            ).first()
            old_faculty_id = existing.faculty_id_id if existing else None

            # To avoid multiple assignment rows with the same course/sem/ay, we can update or create
            # Note: the original logic grouped faculty_id_id into the lookup. This changed. Wait.
            # actually we can deactivate old assignments and create new to preserve unique_together
            if old_faculty_id and str(old_faculty_id) != str(f_id):
                FacultyCourseAssignment.objects.filter(
                    course_id_id=c_id, academic_year=ay, semester=sem
                ).update(is_active=False)

            FacultyCourseAssignment.objects.update_or_create(
                faculty_id_id=f_id, course_id_id=c_id, academic_year=ay, semester=sem,
                defaults={'is_active': True}
            )

            if str(old_faculty_id) != str(f_id):
                faculty_user = User.objects.get(pk=f_id)
                course = Course.objects.get(pk=c_id)
                title = f"Course Assigned: {course.course_code}"
                message = f"Dear {faculty_user.name},\n\nYou have been assigned to teach {course.course_name} ({course.course_code}) for the academic year {ay}."
                send_obe_notification(
                    recipient=faculty_user,
                    title=title,
                    message=message,
                    notification_type='INFO',
                    module='COURSE',
                    priority='NORMAL',
                    send_email=True
                )
            return Response({"message": "Assignment successful"}, status=201)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

class MyCoursesAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        assignments = FacultyCourseAssignment.objects.filter(faculty_id=request.user, is_active=True)
        course_ids = assignments.values_list('course_id', flat=True)
        courses = Course.objects.filter(course_id__in=course_ids, is_active=True)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# ---------------- COURSE OUTCOMES ----------------

class CourseCOListCreateAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, course_id):
        cos = CO.objects.filter(course_id=course_id, is_active=True)
        serializer = COSerializer(cos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        data_list = request.data if isinstance(request.data, list) else [request.data]
        incoming_numbers = []
        for item in data_list:
            co_num = item.get('co_number') or item.get('co_code')
            if not co_num: continue
            incoming_numbers.append(co_num)
            CO.objects.update_or_create(course_id_id=course_id, co_number=co_num, defaults={'description': item.get('description', ''), 'is_active': True})
        CO.objects.filter(course_id=course_id).exclude(co_number__in=incoming_numbers).delete()
        try:
            from .models import COTarget
            with transaction.atomic():
                distinct_ay = COTarget.objects.filter(course_id_id=course_id).values_list('academic_year', flat=True).distinct()
                for ay in distinct_ay:
                    existing_target = COTarget.objects.filter(course_id_id=course_id, academic_year=ay).first()
                    if existing_target:
                        active_cos = CO.objects.filter(course_id_id=course_id, is_active=True)
                        for co in active_cos:
                            COTarget.objects.update_or_create(co_id=co, course_id_id=course_id, academic_year=ay, defaults={'target_value': existing_target.target_value, 'set_by': existing_target.set_by, 'status': existing_target.status})
        except Exception: pass
        return Response({"message": "COs synchronized"}, status=status.HTTP_200_OK)

class COListAPIView(APIView):
    def get(self, request):
        program_id = request.query_params.get('program_id')
        cos = CO.objects.filter(is_active=True)
        if program_id: cos = cos.filter(course_id__program_id=program_id)
        serializer = COSerializer(cos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CODetailAPIView(APIView):
    def put(self, request, pk):
        co = get_object_or_404(CO, pk=pk)
        data = request.data.copy()
        if 'status' in data: data['is_active'] = data['status'].lower() == 'active'
        serializer = COSerializer(co, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ---------------- PO & PSO ----------------

class POListCreateAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        program_id = request.query_params.get('program_id')
        pos = PO.objects.filter(is_active=True)
        if program_id: pos = pos.filter(program_id=program_id)
        serializer = POSerializer(pos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            data = request.data if isinstance(request.data, list) else [request.data]
            results = []
            for item in data:
                p_id, p_num, desc = item.get('program_id'), item.get('po_number'), item.get('description')
                obj, _ = PO.objects.update_or_create(program_id_id=p_id, po_number=p_num, defaults={'description': desc, 'is_active': True})
                results.append(POSerializer(obj).data)
            return Response(results, status=201)
        except Exception as e: return Response({"error": str(e)}, status=500)

class PODetailAPIView(APIView):
    def put(self, request, pk):
        po = get_object_or_404(PO, pk=pk)
        serializer = POSerializer(po, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PSOListCreateAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        program_id = request.query_params.get('program_id')
        psos = PSO.objects.filter(is_active=True)
        if program_id: psos = psos.filter(program_id=program_id)
        serializer = PSOSerializer(psos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            data = request.data if isinstance(request.data, list) else [request.data]
            results = []
            for item in data:
                p_id, p_num, desc = item.get('program_id'), item.get('pso_number'), item.get('description')
                obj, _ = PSO.objects.update_or_create(program_id_id=p_id, pso_number=p_num, defaults={'description': desc, 'is_active': True})
                results.append(PSOSerializer(obj).data)
            return Response(results, status=201)
        except Exception as e: return Response({"error": str(e)}, status=500)

class PSODetailAPIView(APIView):
    def put(self, request, pk):
        pso = get_object_or_404(PSO, pk=pk)
        serializer = PSOSerializer(pso, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ---------------- CO–PO / CO–PSO MAPPING ----------------

class MappingListCreateAPIView(APIView):
    def get(self, request):
        course_id = request.query_params.get('course_id')
        po_mappings = COPOMapping.objects.all()
        pso_mappings = COPSOMapping.objects.all()
        if course_id:
            po_mappings = po_mappings.filter(co_id__course_id=course_id)
            pso_mappings = pso_mappings.filter(co_id__course_id=course_id)
        po_data = COPOMappingSerializer(po_mappings, many=True).data
        pso_data = COPSOMappingSerializer(pso_mappings, many=True).data
        return Response(po_data + pso_data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role_id.role_name not in ["Admin", "HOD", "Coordinator", "Faculty"]:
            return Response({"error": "Auditors cannot edit mappings."}, status=status.HTTP_403_FORBIDDEN)
        course_id, matrix = request.data.get('course_id'), request.data.get('mapping_matrix', [])
        if not course_id or not matrix: return Response({"error": "Required fields missing"}, status=400)
        with transaction.atomic():
            for item in matrix:
                co_id, po_id, pso_id, w = item.get('co_id'), item.get('po_id'), item.get('pso_id'), item.get('weightage')
                if po_id: COPOMapping.objects.update_or_create(co_id_id=co_id, po_id_id=po_id, defaults={'weightage': w})
                if pso_id: COPSOMapping.objects.update_or_create(co_id_id=co_id, pso_id_id=pso_id, defaults={'weightage': w})
            mapping_status_val = request.data.get('status')
            if mapping_status_val: Course.objects.filter(course_id=course_id).update(mapping_status=mapping_status_val)
        return Response({"message": "mapping saved"}, status=201)

# ---------------- CO TARGETS ----------------

class TargetListCreateAPIView(APIView):
    def get(self, request):
        course_id, academic_year = request.query_params.get('course_id'), request.query_params.get('academic_year')
        targets = COTarget.objects.filter(is_active=True)
        if course_id: targets = targets.filter(course_id=course_id)
        if academic_year:
            ay_clean = academic_year.replace(' ', '')
            ay_spaced = ay_clean.replace('-', ' - ')
            ay_query = models.Q(academic_year=academic_year) | models.Q(academic_year=ay_clean) | models.Q(academic_year=ay_spaced)
            targets = targets.filter(ay_query)
        response_data = {"co_targets": COTargetSerializer(targets, many=True).data}
        if academic_year:
            program_id = request.query_params.get('program_id')
            po_qs = POTarget.objects.filter(ay_query, is_active=True)
            pso_qs = PSOTarget.objects.filter(ay_query, is_active=True)
            if program_id:
                po_qs = po_qs.filter(po_id__program_id=program_id)
                pso_qs = pso_qs.filter(pso_id__program_id=program_id)
            response_data["po_targets"] = POTargetSerializer(po_qs, many=True).data
            response_data["pso_targets"] = PSOTargetSerializer(pso_qs, many=True).data
        return Response(response_data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            academic_year = request.data.get('academic_year')
            targets_list, po_targets, pso_targets = request.data.get('targets', []), request.data.get('po_targets', []), request.data.get('pso_targets', [])
            if not targets_list and not po_targets and not pso_targets:
                course_id, t_val = request.data.get('course_id'), request.data.get('target_value')
                if course_id and t_val: targets_list = [{'course_id': course_id, 'target_value': t_val}]
            if (not targets_list and not po_targets and not pso_targets) or not academic_year:
                return Response({"error": "Missing fields"}, status=400)
            set_by = request.user if not request.user.is_anonymous else None
            with transaction.atomic():
                for item in targets_list:
                    c_id, t_val = item.get('course_id'), item.get('target_value')
                    try: t_val = float(t_val)
                    except: continue
                    ay_clean = academic_year.replace(' ', '')
                    ay_spaced = ay_clean.replace('-', ' - ')
                    ay_query_del = models.Q(academic_year=academic_year) | models.Q(academic_year=ay_clean) | models.Q(academic_year=ay_spaced)
                    COTarget.objects.filter(ay_query_del, course_id_id=c_id).delete()
                    cos = CO.objects.filter(course_id=c_id, is_active=True)
                    if cos.exists():
                        for co in cos: COTarget.objects.create(co_id=co, course_id=co.course_id, academic_year=academic_year, target_value=t_val, set_by=set_by, status='PENDING')
                    else: COTarget.objects.create(co_id=None, course_id_id=c_id, academic_year=academic_year, target_value=t_val, set_by=set_by, status='PENDING')
                for item in po_targets:
                    p_id, t_val = item.get('po_id'), item.get('target_value')
                    if p_id:
                        try: t_val = float(t_val)
                        except: t_val = 0.0
                        POTarget.objects.filter(po_id_id=p_id, academic_year=academic_year).delete()
                        POTarget.objects.create(po_id_id=p_id, academic_year=academic_year, target_value=t_val, set_by=set_by, status='PENDING')
                for item in pso_targets:
                    p_id, t_val = item.get('pso_id'), item.get('target_value')
                    if p_id:
                        try: t_val = float(t_val)
                        except: t_val = 0.0
                        PSOTarget.objects.filter(pso_id_id=p_id, academic_year=academic_year).delete()
                        PSOTarget.objects.create(pso_id_id=p_id, academic_year=academic_year, target_value=t_val, set_by=set_by, status='PENDING')
            return Response({"message": "targets assigned successfully"}, status=201)
        except Exception as e: return Response({"error": str(e)}, status=500)

class TargetDetailAPIView(APIView):
    def put(self, request, pk):
        target = get_object_or_404(COTarget, pk=pk)
        serializer = COTargetSerializer(target, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class TargetSubmitAPIView(APIView):
    def post(self, request, pk):
        target = get_object_or_404(COTarget, pk=pk)
        target.status = 'SUBMITTED'
        target.save()
        log_action(request.user, 'UPDATE', 'COTarget', target.target_id, remark="Target submitted")
        return Response({"status": "submitted", "target_id": pk})

class TargetApproveAPIView(APIView):
    def post(self, request, pk):
        target = get_object_or_404(COTarget, pk=pk)
        target.status = 'APPROVED'
        target.remarks = request.data.get('remarks', '')
        target.save()
        log_action(request.user, 'APPROVE', 'COTarget', target.target_id, remark=target.remarks)
        return Response({"status": "approved", "approved_by": request.user.name if not request.user.is_anonymous else "Admin"})

class TargetRejectAPIView(APIView):
    def post(self, request, pk):
        target = get_object_or_404(COTarget, pk=pk)
        remarks = request.data.get('remarks')
        if not remarks: return Response({"error": "remarks required"}, status=400)
        target.status = 'REJECTED'
        target.remarks = remarks
        target.save()
        log_action(request.user, 'UPDATE', 'COTarget', target.target_id, remark=f"Target rejected: {remarks}")
        return Response({"status": "rejected", "remarks": remarks})

# ---------------- PROGRAM STATEMENTS & PEOs ----------------

class ProgramStatementListCreateAPIView(APIView):
    def get(self, request):
        p_id = request.query_params.get('program_id')
        statements = ProgramStatement.objects.filter(is_active=True)
        if p_id: statements = statements.filter(program_id=p_id)
        return Response(ProgramStatementSerializer(statements, many=True).data)

    def post(self, request):
        try:
            data = request.data if isinstance(request.data, list) else [request.data]
            results = []
            for item in data:
                p_id, s_type, s_num, desc = item.get('program_id'), item.get('statement_type'), item.get('statement_number'), item.get('description')
                kwargs = {'program_id_id': p_id, 'statement_type': s_type}
                if s_num: kwargs['statement_number'] = s_num
                else: kwargs['statement_number__isnull'] = True
                obj, _ = ProgramStatement.objects.update_or_create(**kwargs, defaults={'description': desc, 'is_active': True})
                results.append(ProgramStatementSerializer(obj).data)
            return Response(results, status=201)
        except Exception as e: return Response({"error": str(e)}, status=500)

class PEOListCreateAPIView(APIView):
    def get(self, request):
        p_id = request.query_params.get('program_id')
        peos = PEO.objects.filter(is_active=True)
        if p_id: peos = peos.filter(program_id=p_id)
        return Response(PEOSerializer(peos, many=True).data)

    def post(self, request):
        try:
            data = request.data if isinstance(request.data, list) else [request.data]
            results = []
            for item in data:
                p_id, p_num, desc = item.get('program_id'), item.get('peo_number'), item.get('description')
                obj, _ = PEO.objects.update_or_create(program_id_id=p_id, peo_number=p_num, defaults={'description': desc, 'is_active': True})
                results.append(PEOSerializer(obj).data)
            return Response(results, status=201)
        except Exception as e: return Response({"error": str(e)}, status=500)
