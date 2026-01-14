from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Program, Scheme, Course, CO, PO, PSO,
    COPOMapping, COPSOMapping, COTarget, Batch
)
from .serializers import (
    ProgramSerializer, CourseSerializer, COSerializer,
    POSerializer, PSOSerializer, COPOMappingSerializer,
    COPSOMappingSerializer, COTargetSerializer
)

# NOTE:
# Authentication and role-based permissions are INTENTIONALLY NOT added yet.
# After auth implementation, add:
# from rest_framework.permissions import IsAuthenticated
# and permission_classes = [IsAuthenticated] where required.


# ---------------- PROGRAM ----------------

class ProgramListCreateAPIView(APIView):

    def get(self, request):
        programs = Program.objects.filter(is_active=True)
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
            return Response(
                {"program_id": program.program_id},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProgramDetailAPIView(APIView):

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
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        program = get_object_or_404(Program, pk=pk)
        program.is_active = False
        program.save()
        return Response(
            {"message": "program disabled"},
            status=status.HTTP_200_OK
        )


# ---------------- COURSE ----------------

class CourseListCreateAPIView(APIView):

    def get(self, request):
        program_id = request.query_params.get('program_id')
        courses = Course.objects.filter(is_active=True)

        if program_id:
            courses = courses.filter(program_id=program_id)

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

        serializer = CourseSerializer(data=data)
        if serializer.is_valid():
            course = serializer.save()
            return Response(
                {"course_id": course.course_id},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseDetailAPIView(APIView):

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        serializer = CourseSerializer(course)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        data = request.data.copy()

        if 'name' in data:
            data['course_name'] = data['name']
        if 'status' in data:
            data['is_active'] = data['status'].lower() == 'active'

        serializer = CourseSerializer(course, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        course.is_active = False
        course.save()
        return Response(
            {"message": "course disabled"},
            status=status.HTTP_200_OK
        )


# ---------------- COURSE OUTCOMES ----------------

class CourseCOListCreateAPIView(APIView):

    def get(self, request, course_id):
        cos = CO.objects.filter(course_id=course_id, is_active=True)
        serializer = COSerializer(cos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        data = request.data.copy()
        data['course_id'] = course_id

        if 'co_code' in data:
            data['co_number'] = data['co_code']

        serializer = COSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "CO created"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

class POListAPIView(APIView):
    def get(self, request):
        pos = PO.objects.filter(is_active=True)
        serializer = POSerializer(pos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PODetailAPIView(APIView):
    def put(self, request, pk):
        po = get_object_or_404(PO, pk=pk)
        serializer = POSerializer(po, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PSOListAPIView(APIView):
    def get(self, request):
        psos = PSO.objects.filter(is_active=True)
        serializer = PSOSerializer(psos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
        mappings = COPOMapping.objects.all()

        if course_id:
            mappings = mappings.filter(co_id__course_id=course_id)

        serializer = COPOMappingSerializer(mappings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

        return Response(
            {"message": "mapping saved"},
            status=status.HTTP_201_CREATED
        )


# ---------------- CO TARGETS ----------------

class TargetListCreateAPIView(APIView):

    def get(self, request):
        course_id = request.query_params.get('course_id')
        targets = COTarget.objects.filter(is_active=True)

        if course_id:
            targets = targets.filter(co_id__course_id=course_id)

        serializer = COTargetSerializer(targets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        course_id = request.data.get('course_id')
        target_value = request.data.get('target_value')
        academic_year = request.data.get('academic_year', '2023-24')

        if not course_id or target_value is None:
            return Response(
                {"error": "course_id and target_value required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Replace fallback user after auth
        from users.models import User
        set_by = request.user if request.user and not request.user.is_anonymous else User.objects.first()

        cos = CO.objects.filter(course_id=course_id, is_active=True)

        with transaction.atomic():
            for co in cos:
                COTarget.objects.update_or_create(
                    co_id=co,
                    academic_year=academic_year,
                    defaults={
                        'target_value': target_value,
                        'set_by': set_by,
                        'status': 'PENDING'
                    }
                )

        return Response(
            {"message": "target assigned"},
            status=status.HTTP_201_CREATED
        )


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

        return Response(
            {"status": "rejected", "remarks": remarks},
            status=status.HTTP_200_OK
        )
