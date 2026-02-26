from django.shortcuts import get_object_or_404
from django.db import models, transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.permissions import IsAdmin
from audit.utils import log_action
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
    ProgramStatementSerializer, PEOSerializer,
    COSerializer
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
        # Allow any authenticated user (admin page is already protected by routing/auth)
        setup = AcademicSetup.objects.first()
        old_value = AcademicSetupSerializer(setup).data if setup else None
        
        serializer = AcademicSetupSerializer(setup, data=request.data)
        if serializer.is_valid():
            setup = serializer.save()
            
            # Log the action
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
        """Partial update — allows updating individual fields like curriculum_link."""
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
    """GET all schemes (active only by default), POST to create."""
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
    """PUT to update / toggle enable-disable."""
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
    """GET all batches, POST to create."""
    def get(self, request):
        show_all = request.query_params.get('all', 'false').lower() == 'true'
        program_id = request.query_params.get('program_id')
        batches = Batch.objects.all() if show_all else Batch.objects.filter(is_active=True)
        if program_id:
            batches = batches.filter(program_id=program_id)
        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BatchSerializer(data=request.data)
        if serializer.is_valid():
            batch = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BatchDetailAPIView(APIView):
    """PUT to update / toggle enable-disable."""
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

# NOTE:
# Authentication and role-based permissions are INTENTIONALLY NOT added yet.
# After auth implementation, add:
# from rest_framework.permissions import IsAuthenticated
# and permission_classes = [IsAuthenticated] where required.


# ---------------- PROGRAM ----------------

class ProgramListCreateAPIView(APIView):
    permission_classes = [AllowAny] # Survey uses this to list programs or get one

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

        # Accept "name" as alias for program_name
        if 'name' in data:
            data['program_name'] = data['name']

        serializer = ProgramSerializer(data=data)
        if serializer.is_valid():
            program = serializer.save()
            log_action(request.user, 'CREATE', 'Program', program.program_id, new_value=serializer.data)
            return Response(
                {"program_id": program.program_id},
                status=status.HTTP_201_CREATED
            )
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
        return Response(
            {"message": "program disabled"},
            status=status.HTTP_200_OK
        )


# ---------------- COURSE ----------------

class CourseListCreateAPIView(APIView):

    def get(self, request):
        program_id = request.query_params.get('program_id')
        semester = request.query_params.get('semester')
        class_year = request.query_params.get('class_year')
        scheme_id = request.query_params.get('scheme_id')
        academic_year = request.query_params.get('academic_year') # Note: Course model doesn't have academic_year currently, but let's filter if it did. Actually FacultyCourseAssignment has it. 
        # For now, Course model has semester and class_year.
        
        courses = Course.objects.filter(is_active=True)

        if program_id:
            courses = courses.filter(program_id=program_id)
        if semester:
            courses = courses.filter(semester=semester)
        if class_year:
            courses = courses.filter(class_year=class_year)
        if scheme_id:
            courses = courses.filter(scheme_id=scheme_id)

        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()

        if 'name' in data:
            data['course_name'] = data['name']

        # TEMP DEFAULTS – must be removed later
        if 'scheme_id' not in data:
            scheme = Scheme.objects.first()
            if scheme:
                data['scheme_id'] = scheme.scheme_id

        if 'semester' not in data:
            data['semester'] = 1

        try:
            serializer = CourseSerializer(data=data)
            if serializer.is_valid():
                course = serializer.save()
                
                # Handle Faculty Assignment
                faculty_id = request.data.get('faculty_assigned')
                print(f"DEBUG: Creating course, faculty_assigned={faculty_id}")
                if faculty_id:
                    try:
                        from users.models import User, FacultyCourseAssignment
                        from .models import AcademicSetup
                        setup = AcademicSetup.objects.first()
                        academic_year = setup.academic_year if setup else "2025-26"
                        print(f"DEBUG: Assignment details: year={academic_year}, sem={course.semester}")
                        
                        FacultyCourseAssignment.objects.update_or_create(
                            course_id=course,
                            academic_year=academic_year,
                            semester=course.semester,
                            defaults={'faculty_id': User.objects.get(pk=faculty_id), 'is_active': True}
                        )
                        print("DEBUG: Assignment saved successfully")
                    except Exception as fa_err:
                        print(f"DEBUG: Error saving faculty assignment: {fa_err}")
                
                log_action(request.user, 'CREATE', 'Course', course.course_id, new_value=serializer.data)
                return Response(
                    {"course_id": course.course_id},
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CourseDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        print(f"DEBUG: CourseDetailAPIView GET hit for pk={pk}")
        print(f"DEBUG: User: {request.user}, Authenticated: {request.user.is_authenticated}")
        try:
            course = get_object_or_404(Course, pk=pk)
            serializer = CourseSerializer(course)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"DEBUG: CourseDetailAPIView Error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        data = request.data.copy()

        if 'name' in data:
            data['course_name'] = data['name']
        if 'status' in data:
            data['is_active'] = data['status'].lower() == 'active'

        serializer = CourseSerializer(course, data=data, partial=True)
        if serializer.is_valid():
            course = serializer.save()
            
            # Handle Faculty Assignment
            faculty_id = request.data.get('faculty_assigned')
            print(f"DEBUG: Updating course {pk}, faculty_assigned={faculty_id}")
            if faculty_id:
                try:
                    from users.models import User, FacultyCourseAssignment
                    from .models import AcademicSetup
                    setup = AcademicSetup.objects.first()
                    academic_year = setup.academic_year if setup else "2025-26"
                    print(f"DEBUG: Assignment details: year={academic_year}, sem={course.semester}")
                    
                    FacultyCourseAssignment.objects.update_or_create(
                        course_id=course,
                        academic_year=academic_year,
                        semester=course.semester,
                        defaults={'faculty_id': User.objects.get(pk=faculty_id), 'is_active': True}
                    )
                    print("DEBUG: Assignment updated successfully")
                except Exception as fa_err:
                    print(f"DEBUG: Error updating faculty assignment: {fa_err}")
            
            log_action(request.user, 'UPDATE', 'Course', course.course_id, new_value=serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        return Response(
            {"message": "course disabled"},
            status=status.HTTP_200_OK
        )

class CourseAssignmentAPIView(APIView):
    permission_classes = [IsAuthenticated] # HOD should use this

    def post(self, request):
        faculty_id = request.data.get('faculty_id')
        course_id = request.data.get('course_id')
        academic_year = request.data.get('academic_year')
        semester = request.data.get('semester')

        if not all([faculty_id, course_id, academic_year, semester]):
            return Response({"error": "All fields required"}, status=400)

        assignment, created = FacultyCourseAssignment.objects.update_or_create(
            faculty_id_id=faculty_id,
            course_id_id=course_id,
            academic_year=academic_year,
            semester=semester,
            defaults={'is_active': True}
        )

        return Response({"message": "Assignment successful"}, status=201)

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
        print(f"DEBUG: CourseCOListCreateAPIView GET hit for course_id={course_id}")
        print(f"DEBUG: User: {request.user}, Authenticated: {request.user.is_authenticated}")
        try:
            cos = CO.objects.filter(course_id=course_id, is_active=True)
            serializer = COSerializer(cos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"DEBUG: CourseCOListCreateAPIView Error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, course_id):
        # Support both single CO and list of COs
        data_list = request.data if isinstance(request.data, list) else [request.data]
        
        incoming_numbers = []
        
        for item in data_list:
            co_num = item.get('co_number') or item.get('co_code')
            if not co_num: continue
            
            incoming_numbers.append(co_num)
            
            CO.objects.update_or_create(
                course_id_id=course_id,
                co_number=co_num,
                defaults={
                    'description': item.get('description', ''),
                    'is_active': True
                }
            )
            
        # Full Sync: Delete COs not in the current request for this course
        CO.objects.filter(course_id=course_id).exclude(co_number__in=incoming_numbers).delete()
        
        # Target Inheritance: Ensure new COs get the same target as existing ones for this course
        try:
            from django.db import transaction
            from .models import COTarget
            
            with transaction.atomic():
                # Find all academic years that have targets for this course
                distinct_ay = COTarget.objects.filter(course_id_id=course_id).values_list('academic_year', flat=True).distinct()
                
                for ay in distinct_ay:
                    # Find the existing target value for this course in this year (taking any CO's target as reference)
                    existing_target = COTarget.objects.filter(course_id_id=course_id, academic_year=ay).first()
                    if existing_target:
                        target_val = existing_target.target_value
                        set_by = existing_target.set_by
                        
                        # Apply this target to all active COs of the course that don't have it yet
                        active_cos = CO.objects.filter(course_id_id=course_id, is_active=True)
                        for co in active_cos:
                            COTarget.objects.update_or_create(
                                co_id=co,
                                course_id_id=course_id,
                                academic_year=ay,
                                defaults={
                                    'target_value': target_val,
                                    'set_by': set_by,
                                    'status': existing_target.status
                                }
                            )
        except Exception as e:
            print(f"DEBUG: Error in target inheritance: {e}")

        return Response({"message": "COs synchronized"}, status=status.HTTP_200_OK)
class COListAPIView(APIView):
    def get(self, request):
        program_id = request.query_params.get('program_id')
        cos = CO.objects.filter(is_active=True)
        if program_id:
            cos = cos.filter(course_id__program_id=program_id)
        serializer = COSerializer(cos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CODetailAPIView(APIView):

    def put(self, request, pk):
        co = get_object_or_404(CO, pk=pk)
        data = request.data.copy()

        if 'status' in data:
            data['is_active'] = data['status'].lower() == 'active'

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
        if program_id:
            pos = pos.filter(program_id=program_id)
        serializer = POSerializer(pos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                data = [data]
            
            # Group items by program_id to perform cleanup
            program_ids = set(item.get('program_id') for item in data if item.get('program_id'))
            
            results = []
            for pid in program_ids:
                incoming_numbers = [item.get('po_number') for item in data if item.get('program_id') == pid]
                # Delete POs not in the incoming list for this program
                PO.objects.filter(program_id_id=pid).exclude(po_number__in=incoming_numbers).delete()

            for item in data:
                program_id = item.get('program_id')
                po_number = item.get('po_number')
                description = item.get('description')

                queryset = PO.objects.filter(program_id_id=program_id, po_number=po_number)
                if queryset.exists():
                    obj = queryset.first()
                    obj.description = description
                    obj.is_active = True
                    obj.save()
                    queryset.exclude(pk=obj.pk).delete()
                else:
                    obj = PO.objects.create(
                        program_id_id=program_id,
                        po_number=po_number,
                        description=description,
                        is_active=True
                    )
                results.append(POSerializer(obj).data)
                
            return Response(results, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        if program_id:
            psos = psos.filter(program_id=program_id)
        serializer = PSOSerializer(psos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                data = [data]
            
            # Group items by program_id to perform cleanup
            program_ids = set(item.get('program_id') for item in data if item.get('program_id'))
            
            results = []
            for pid in program_ids:
                incoming_numbers = [item.get('pso_number') for item in data if item.get('program_id') == pid]
                # Delete PSOs not in the incoming list for this program
                PSO.objects.filter(program_id_id=pid).exclude(pso_number__in=incoming_numbers).delete()

            for item in data:
                program_id = item.get('program_id')
                pso_number = item.get('pso_number')
                description = item.get('description')

                queryset = PSO.objects.filter(program_id_id=program_id, pso_number=pso_number)
                if queryset.exists():
                    obj = queryset.first()
                    obj.description = description
                    obj.is_active = True
                    obj.save()
                    queryset.exclude(pk=obj.pk).delete()
                else:
                    obj = PSO.objects.create(
                        program_id_id=program_id,
                        pso_number=pso_number,
                        description=description,
                        is_active=True
                    )
                results.append(PSOSerializer(obj).data)
                
            return Response(results, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        
        # Fetch both PO and PSO mappings
        po_mappings = COPOMapping.objects.all()
        pso_mappings = COPSOMapping.objects.all()

        if course_id:
            po_mappings = po_mappings.filter(co_id__course_id=course_id)
            pso_mappings = pso_mappings.filter(co_id__course_id=course_id)

        po_data = COPOMappingSerializer(po_mappings, many=True).data
        pso_data = COPSOMappingSerializer(pso_mappings, many=True).data
        
        # Combine the results
        combined_data = po_data + pso_data
        
        return Response(combined_data, status=status.HTTP_200_OK)

    def post(self, request):
        course_id = request.data.get('course_id')
        matrix = request.data.get('mapping_matrix', [])

        if not course_id or not matrix:
            return Response(
                {"error": "course_id and mapping_matrix required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            for item in matrix:
                co_id = item.get('co_id')
                po_id = item.get('po_id')
                pso_id = item.get('pso_id')
                weightage = item.get('weightage')

                if po_id:
                    COPOMapping.objects.update_or_create(
                        co_id_id=co_id,
                        po_id_id=po_id,
                        defaults={'weightage': weightage}
                    )

                if pso_id:
                    COPSOMapping.objects.update_or_create(
                        co_id_id=co_id,
                        pso_id_id=pso_id,
                        defaults={'weightage': weightage}
                    )

            # Update Course Mapping Status if specified
            mapping_status_val = request.data.get('status')
            if mapping_status_val:
                Course.objects.filter(course_id=course_id).update(mapping_status=mapping_status_val)

        return Response(
            {"message": "mapping saved"},
            status=status.HTTP_201_CREATED
        )


# ---------------- CO TARGETS ----------------

class TargetListCreateAPIView(APIView):

    def get(self, request):
        course_id = request.query_params.get('course_id')
        academic_year = request.query_params.get('academic_year')
        targets = COTarget.objects.filter(is_active=True)

        if course_id:
            targets = targets.filter(course_id=course_id)
        if academic_year:
            # Robust AY Matching
            ay_clean = academic_year.replace(' ', '')
            ay_spaced = ay_clean.replace('-', ' - ')
            ay_query = models.Q(academic_year=academic_year) | models.Q(academic_year=ay_clean) | models.Q(academic_year=ay_spaced)
            targets = targets.filter(ay_query)

        serializer = COTargetSerializer(targets, many=True)
        
        # Include PO and PSO targets if academic_year provided
        response_data = {"co_targets": serializer.data}
        if academic_year:
            # Reuse ay_query from above
            ay_clean = academic_year.replace(' ', '')
            ay_spaced = ay_clean.replace('-', ' - ')
            ay_query = models.Q(academic_year=academic_year) | models.Q(academic_year=ay_clean) | models.Q(academic_year=ay_spaced)
            
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
            targets_list = request.data.get('targets', []) # Expected list of {course_id, target_value}
            po_targets = request.data.get('po_targets', []) # Expected list of {po_id, target_value}
            pso_targets = request.data.get('pso_targets', []) # Expected list of {pso_id, target_value}
            
            print(f"DEBUG TARGETS POST: academic_year={academic_year}")
            print(f"DEBUG TARGETS POST: co_targets={len(targets_list)}, po_targets={len(po_targets)}, pso_targets={len(pso_targets)}")
            
            # Legacy single target support
            if not targets_list and not po_targets and not pso_targets:
                course_id = request.data.get('course_id')
                target_value = request.data.get('target_value')
                if course_id and target_value:
                    targets_list = [{'course_id': course_id, 'target_value': target_value}]

            if (not targets_list and not po_targets and not pso_targets) or not academic_year:
                return Response({"error": "targets list and academic_year required"}, status=status.HTTP_400_BAD_REQUEST)

            set_by = request.user if not request.user.is_anonymous else None
            print(f"DEBUG TARGETS POST: set_by={set_by}, is_anonymous={request.user.is_anonymous}")

            with transaction.atomic():
                # Handle CO Targets
                for item in targets_list:
                    c_id = item.get('course_id')
                    t_val = item.get('target_value')
                    
                    try:
                        t_val = float(t_val)
                    except (ValueError, TypeError):
                        continue # Skip invalid values

                    # Robust AY Matching for delete
                    ay_clean = academic_year.replace(' ', '')
                    ay_spaced = ay_clean.replace('-', ' - ')
                    ay_query_del = models.Q(academic_year=academic_year) | models.Q(academic_year=ay_clean) | models.Q(academic_year=ay_spaced)

                    # Delete all existing targets for this course+year
                    COTarget.objects.filter(
                        ay_query_del,
                        course_id_id=c_id
                    ).delete()

                    cos = CO.objects.filter(course_id=c_id, is_active=True)
                    if cos.exists():
                        # Save one target per CO
                        for co in cos:
                            COTarget.objects.create(
                                co_id=co,
                                course_id=co.course_id,
                                academic_year=academic_year,
                                target_value=t_val,
                                set_by=set_by,
                                status='PENDING'
                            )
                    else:
                        # No COs exist yet — save a course-level target
                        COTarget.objects.create(
                            co_id=None,
                            course_id_id=c_id,
                            academic_year=academic_year,
                            target_value=t_val,
                            set_by=set_by,
                            status='PENDING'
                        )
                
                # Handle PO Targets
                for item in po_targets:
                    p_id = item.get('po_id')
                    t_val = item.get('target_value')
                    if not p_id: continue
                    try: t_val = float(t_val)
                    except: t_val = 2.0 # Default fallback
                    
                    POTarget.objects.filter(po_id_id=p_id, academic_year=academic_year).delete()
                    POTarget.objects.create(
                        po_id_id=p_id,
                        academic_year=academic_year,
                        target_value=t_val,
                        set_by=set_by,
                        status='PENDING'
                    )

                # Handle PSO Targets
                for item in pso_targets:
                    p_id = item.get('pso_id')
                    t_val = item.get('target_value')
                    if not p_id: continue
                    try: t_val = float(t_val)
                    except: t_val = 2.0
                    
                    PSOTarget.objects.filter(pso_id_id=p_id, academic_year=academic_year).delete()
                    PSOTarget.objects.create(
                        pso_id_id=p_id,
                        academic_year=academic_year,
                        target_value=t_val,
                        set_by=set_by,
                        status='PENDING'
                    )

            return Response(
                {"message": "targets assigned successfully"},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TargetDetailAPIView(APIView):

    def put(self, request, pk):
        target = get_object_or_404(COTarget, pk=pk)
        serializer = COTargetSerializer(target, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TargetSubmitAPIView(APIView):

    def post(self, request, pk):
        target = get_object_or_404(COTarget, pk=pk)
        target.status = 'SUBMITTED'
        target.save()
        log_action(request.user, 'UPDATE', 'COTarget', target.target_id, remark="Target submitted")
        return Response(
            {"status": "submitted", "target_id": pk},
            status=status.HTTP_200_OK
        )


class TargetApproveAPIView(APIView):

    def post(self, request, pk):
        target = get_object_or_404(COTarget, pk=pk)
        target.status = 'APPROVED'
        target.remarks = request.data.get('remarks', '')
        target.save()
        log_action(request.user, 'APPROVE', 'COTarget', target.target_id, remark=target.remarks)

        approved_by = (
            request.user.name
            if request.user and not request.user.is_anonymous
            else "Admin"
        )

        return Response(
            {"status": "approved", "approved_by": approved_by},
            status=status.HTTP_200_OK
        )


class TargetRejectAPIView(APIView):

    def post(self, request, pk):
        target = get_object_or_404(COTarget, pk=pk)
        remarks = request.data.get('remarks')

        if not remarks:
            return Response(
                {"error": "remarks required for rejection"},
                status=status.HTTP_400_BAD_REQUEST
            )

        target.status = 'REJECTED'
        target.remarks = remarks
        target.save()
        log_action(request.user, 'UPDATE', 'COTarget', target.target_id, remark=f"Target rejected: {remarks}")

        return Response(
            {"status": "rejected", "remarks": remarks},
            status=status.HTTP_200_OK
        )
# ---------------- PROGRAM STATEMENTS ----------------

class ProgramStatementListCreateAPIView(APIView):
    def get(self, request):
        program_id = request.query_params.get('program_id')
        statements = ProgramStatement.objects.filter(is_active=True)
        if program_id:
            statements = statements.filter(program_id=program_id)
        serializer = ProgramStatementSerializer(statements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                data = [data]
            
            # Group items by (program_id, statement_type) to perform cleanup
            combinations = set((item.get('program_id'), item.get('statement_type')) for item in data if item.get('program_id') and item.get('statement_type'))
            
            results = []
            for pid, stype in combinations:
                incoming_numbers = [item.get('statement_number') for item in data if item.get('program_id') == pid and item.get('statement_type') == stype]
                
                # Filter records for this combo
                qs = ProgramStatement.objects.filter(program_id_id=pid, statement_type=stype)
                
                # Delete those not in incoming list (handling null for vision)
                if None in incoming_numbers or not any(incoming_numbers):
                    # For vision statements, number is null/blank. If incoming is vision only, 
                    # we keep the null/blank ones and delete numbered ones (which shouldn't exist for vision type anyway)
                    qs.exclude(statement_number__in=[n for n in incoming_numbers if n is not None]).exclude(statement_number__isnull=True).delete()
                else:
                    qs.exclude(statement_number__in=incoming_numbers).delete()

            for item in data:
                program_id = item.get('program_id')
                statement_type = item.get('statement_type')
                statement_number = item.get('statement_number')
                description = item.get('description')

                # Robust update or create pattern
                filter_kwargs = {
                    'program_id_id': program_id,
                    'statement_type': statement_type,
                }
                if statement_number:
                    filter_kwargs['statement_number'] = statement_number
                else:
                    filter_kwargs['statement_number__isnull'] = True

                queryset = ProgramStatement.objects.filter(**filter_kwargs)
                
                if queryset.exists():
                    obj = queryset.first()
                    obj.description = description
                    obj.is_active = True
                    obj.save()
                    queryset.exclude(pk=obj.pk).delete()
                else:
                    obj = ProgramStatement.objects.create(
                        program_id_id=program_id,
                        statement_type=statement_type,
                        statement_number=statement_number,
                        description=description,
                        is_active=True
                    )
                results.append(ProgramStatementSerializer(obj).data)
                
            return Response(results, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ---------------- PEO ----------------

class PEOListCreateAPIView(APIView):
    def get(self, request):
        program_id = request.query_params.get('program_id')
        peos = PEO.objects.filter(is_active=True)
        if program_id:
            peos = peos.filter(program_id=program_id)
        serializer = PEOSerializer(peos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                data = [data]
            
            # Group items by program_id to perform cleanup
            program_ids = set(item.get('program_id') for item in data if item.get('program_id'))
            
            results = []
            for pid in program_ids:
                incoming_numbers = [item.get('peo_number') for item in data if item.get('program_id') == pid]
                # Delete PEOs not in the incoming list for this program
                PEO.objects.filter(program_id_id=pid).exclude(peo_number__in=incoming_numbers).delete()

            for item in data:
                program_id = item.get('program_id')
                peo_number = item.get('peo_number')
                description = item.get('description')

                queryset = PEO.objects.filter(program_id_id=program_id, peo_number=peo_number)
                if queryset.exists():
                    obj = queryset.first()
                    obj.description = description
                    obj.is_active = True
                    obj.save()
                    queryset.exclude(pk=obj.pk).delete()
                else:
                    obj = PEO.objects.create(
                        program_id_id=program_id,
                        peo_number=peo_number,
                        description=description,
                        is_active=True
                    )
                results.append(PEOSerializer(obj).data)
                
            return Response(results, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
