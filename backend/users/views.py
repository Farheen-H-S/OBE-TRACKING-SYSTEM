from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import User, UserRole
from .serializers import UserSerializer, UserRoleSerializer
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .permissions import IsAdmin
from audit.utils import log_action

from django.db.models import Q, Case, When, Value, IntegerField
from rest_framework.pagination import PageNumberPagination
from academics.models import AcademicSetup

class UserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class UserListCreateAPIView(APIView):
    """
    List all users or create a new user.
    API: List users | Method: GET | Endpoint: /users/ | Auth: Yes | Roles: Admin
    API: Create user | Method: POST | Endpoint: /users/ | Auth: Yes | Roles: Admin
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def get(self, request):
        queryset = User.objects.all().select_related('role_id').annotate(
            role_priority=Case(
                When(role_id__role_name__iexact='ADMIN', then=Value(1)),
                When(role_id__role_name__iexact='AUDITOR', then=Value(2)),
                When(role_id__role_name__iexact='HOD', then=Value(3)),
                When(role_id__role_name__iexact='COORDINATOR', then=Value(4)),
                When(role_id__role_name__iexact='FACULTY', then=Value(5)),
                default=Value(6),
                output_field=IntegerField(),
            )
        ).order_by('-is_active', 'role_priority', 'name')
        
        search = request.query_params.get('search')
        role = request.query_params.get('role')
        status_param = request.query_params.get('status')
        dept_id = request.query_params.get('department')
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(email__icontains=search) | 
                Q(contact_no__icontains=search)
            )
            
        if role:
            queryset = queryset.filter(role_id__role_name__iexact=role)
        if status_param:
            is_active = status_param.lower() == 'active'
            queryset = queryset.filter(is_active=is_active)
        if dept_id:
            queryset = queryset.filter(department_id=dept_id)
            
        paginator = UserPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        if 'role' in data and not isinstance(data['role'], int):
            try:
                role_obj = UserRole.objects.get(role_name__iexact=data['role'])
                data['role_id'] = role_obj.role_id
            except UserRole.DoesNotExist:
                return Response({"error": f"Role '{data['role']}' not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        if 'department' in data and data['department']:
            dept_val = data['department']
            if isinstance(dept_val, str) and dept_val.isdigit():
                data['department'] = int(dept_val)
            elif not isinstance(dept_val, int):
                try:
                    from academics.models import Program
                    program_obj = Program.objects.get(program_name__iexact=dept_val)
                    data['department'] = program_obj.program_id
                except (Program.DoesNotExist, ImportError):
                    pass

        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            log_action(
                request.user, 
                'CREATE', 
                'User', 
                user.user_id, 
                new_value=serializer.data,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response({"user_id": user.user_id, "status": "created"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailAPIView(APIView):
    """
    Retrieve, update or disable a user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        # Allow admins to view any user, others can only view themselves
        if not request.user.role_id.role_name == "Admin" and user.user_id != request.user.user_id:
            return Response({"error": "You do not have permission to view this user."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        # Only admins can update user details via this endpoint
        if not request.user.role_id.role_name == "Admin":
            return Response({"error": "Only admins can update user details here."}, status=status.HTTP_403_FORBIDDEN)
            
        user = get_object_or_404(User, pk=pk)
        
        # Serialize before update to capture old values
        old_data = UserSerializer(user).data
        
        data = request.data.copy()
        if 'role' in data:
            try:
                role_obj = UserRole.objects.get(role_name__iexact=data['role'])
                data['role_id'] = role_obj.role_id
            except UserRole.DoesNotExist:
                 pass

        if 'department' in data and data['department']:
            dept_val = data['department']
            if isinstance(dept_val, str) and dept_val.isdigit():
                data['department'] = int(dept_val)
            elif not isinstance(dept_val, int):
                try:
                    from academics.models import Program
                    program_obj = Program.objects.get(program_name__iexact=dept_val)
                    data['department'] = program_obj.program_id
                except (Program.DoesNotExist, ImportError):
                    pass

        if 'status' in data:
            data['is_active'] = data['status'].lower() == 'active'
            
        # Ensure username stays in sync with email
        if 'email' in data:
            data['username'] = data['email']
            
        serializer = UserSerializer(user, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            log_action(
                request.user, 
                'UPDATE', 
                'User', 
                user.user_id, 
                old_value=old_data, 
                new_value=serializer.data,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        # Prevent self-disable
        if user.user_id == request.user.user_id:
            return Response({"error": "You cannot disable your own account."}, status=status.HTTP_403_FORBIDDEN)
            
        user.is_active = False # Soft delete
        user.save()
        log_action(
            request.user, 
            'DISABLE', 
            'User', 
            user.user_id, 
            remark="Soft deleted",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({"message": "soft delete confirmation", "user_id": pk, "is_active": user.is_active}, status=status.HTTP_200_OK)


class UserProfileAPIView(APIView):
    """
    Retrieve the profile of the currently logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RoleListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        roles = UserRole.objects.all()
        serializer = UserRoleSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoginAPIView(APIView):
    """
    Login using email and password.
    Only non-student active users can login.
    """

    def post(self, request):
        print("LOGIN VIEW HIT", request.data)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=400)

        try:
            user = User.objects.select_related('role_id').get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=401)

        if not user.is_active:
            return Response({"error": "User account is inactive"}, status=403)

        if user.role_id.role_name.lower() == "student":
            return Response({"error": "Students cannot login"}, status=403)

        if not check_password(password, user.password):
            return Response({"error": "Invalid credentials"}, status=401)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Get current academic setup
        academic_setup = AcademicSetup.objects.first()
        academic_year = academic_setup.academic_year if academic_setup else "N/A"

        log_action(user, 'LOGIN', 'User', user.user_id, ip_address=request.META.get('REMOTE_ADDR'))

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "role": user.role_id.role_name,
                "department": user.department.program_id if user.department else None,
                "department_name": user.department.program_name if user.department else None,
                "academic_year": academic_year
            }
        }, status=status.HTTP_200_OK)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            
            user = request.user
            if user and not user.is_anonymous:
                log_action(
                    user, 
                    'LOGOUT', 
                    'User', 
                    user.user_id,
                    ip_address=request.META.get('REMOTE_ADDR')
                )
            
            token.blacklist()  # invalidate the refresh token
            return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

from .models import Student
from .serializers import StudentSerializer

class StudentListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        program_id = request.query_params.get('program_id')
        batch_id = request.query_params.get('batch_id')
        semester = request.query_params.get('semester')
        class_year = request.query_params.get('class_year')
        division = request.query_params.get('division')
        
        queryset = Student.objects.filter(is_active=True).order_by('roll_no')
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        if semester:
            queryset = queryset.filter(semester=semester)
        if class_year:
            queryset = queryset.filter(class_year=class_year)
        if division:
            queryset = queryset.filter(division=division)
            
        serializer = StudentSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudentDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Student, pk=pk)

    def get(self, request, pk):
        student = self.get_object(pk)
        serializer = StudentSerializer(student)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        student = self.get_object(pk)
        serializer = StudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        student = self.get_object(pk)
        student.is_active = False # Soft delete
        student.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
