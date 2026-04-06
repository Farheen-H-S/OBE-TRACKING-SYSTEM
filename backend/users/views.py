from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, UserRole
from .serializers import UserSerializer, UserRoleSerializer
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .permissions import IsAdmin
from audit.utils import log_action
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from notifications.utils import send_obe_notification
from .tokens import custom_token_generator

from django.db.models import Q, Case, When, Value, IntegerField
from django.db.models.functions import Length
from rest_framework.pagination import PageNumberPagination
from academics.models import AcademicSetup
from reports.models import AuditPeriod
from django.utils import timezone

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
        queryset = User.objects.exclude(role_id__role_name__iexact='Student').select_related('role_id').annotate(
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

        # Enforce: only one active HOD per department
        resolved_role_id = data.get('role_id')
        resolved_dept = data.get('department')
        if resolved_role_id and resolved_dept:
            try:
                hod_role = UserRole.objects.get(role_name__iexact='HOD')
                if int(resolved_role_id) == hod_role.role_id:
                    existing_hod = User.objects.filter(
                        role_id=hod_role,
                        department_id=resolved_dept,
                        is_active=True
                    ).first()
                    if existing_hod:
                        return Response(
                            {"error": f"Department already has an active HOD ({existing_hod.name}). Please deactivate the current HOD before assigning a new one."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            except UserRole.DoesNotExist:
                pass

        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            
            # If active Auditor is created, start a new AuditPeriod
            if user.role_id.role_name.lower() == 'auditor' and user.is_active:
                if not AuditPeriod.objects.filter(is_active=True).exists():
                    now_str = timezone.now().strftime('%d %b %Y')
                    AuditPeriod.objects.create(
                        label=f"Audit Period ({now_str} onwards)",
                        is_active=True
                    )
            
            log_action(
                request.user, 
                'CREATE', 
                'User', 
                user.user_id, 
                new_value=serializer.data,
                request=request
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

        # Enforce: only one active HOD per department on update
        # Applies when role is being changed to HOD OR when user is being reactivated as existing HOD
        resolved_role_id = data.get('role_id') or user.role_id_id
        resolved_dept = data.get('department') or user.department_id
        new_is_active = data.get('is_active', user.is_active)
        if new_is_active:
            try:
                hod_role = UserRole.objects.get(role_name__iexact='HOD')
                if int(resolved_role_id) == hod_role.role_id and resolved_dept:
                    existing_hod = User.objects.filter(
                        role_id=hod_role,
                        department_id=resolved_dept,
                        is_active=True
                    ).exclude(pk=pk).first()   # exclude the user being updated
                    if existing_hod:
                        return Response(
                            {"error": f"Department already has an active HOD ({existing_hod.name}). Deactivate them first before assigning a new HOD."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            except UserRole.DoesNotExist:
                pass

        if 'email' in data:
            data['username'] = data['email']
            
        serializer = UserSerializer(user, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            
            # Handle AuditPeriod lifecycle for Auditor
            # Auditor Lifecycle: Automatic Audit Period management
            if user.role_id.role_name.lower() == 'auditor':
                # Track currently active period globally
                active_period = AuditPeriod.objects.filter(is_active=True).first()
                
                if user.is_active:
                    # Enabling auditor: ensure there is an active period to receive remarks
                    if not active_period:
                        now_str = timezone.now().strftime('%d %b %Y')
                        AuditPeriod.objects.create(
                            label=f"Audit Period ({now_str} onwards)",
                            is_active=True
                        )
                else:
                    # Disabling auditor: archive the current period and mark as closed
                    if active_period:
                        start_str = active_period.started_at.strftime('%d %b %Y')
                        now_str = timezone.now().strftime('%d %b %Y')
                        active_period.label = f"Audit Period ({start_str} to {now_str})"
                        active_period.is_active = False
                        active_period.ended_at = timezone.now()
                        active_period.save()

            log_action(
                request.user, 
                'UPDATE', 
                'User', 
                user.user_id, 
                old_value=old_data, 
                new_value=serializer.data,
                request=request
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

        # If Auditor is deleted, close active period
        if user.role_id.role_name.lower() == 'auditor':
            active_period = AuditPeriod.objects.filter(is_active=True).first()
            if active_period:
                start_str = active_period.started_at.strftime('%d %b %Y')
                now_str = timezone.now().strftime('%d %b %Y')
                active_period.label = f"Audit Period ({start_str} to {now_str})"
                active_period.is_active = False
                active_period.ended_at = timezone.now()
                active_period.save()

        log_action(
            request.user, 
            'DISABLE', 
            'User', 
            user.user_id, 
            remark="Soft deleted",
            request=request
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
        roles = UserRole.objects.exclude(role_name__iexact='Student')
        serializer = UserRoleSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoginAPIView(APIView):
    """
    Login using email and password.
    Only non-student active users can login.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

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
            print("RAW:", password)
            print("DB:", user.password)
            print("CHECK:", check_password(password, user.password))
            return Response({"error": "Invalid credentials"}, status=401)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Get current academic setup
        academic_setup = AcademicSetup.objects.first()
        academic_year = academic_setup.academic_year if academic_setup else "N/A"

        log_action(user, 'LOGIN', 'User', user.user_id, request=request)

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
                    request=request
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
        def sanitize_param(val):
            # Treat literal 'null', 'undefined', or blank as None
            if val is None or str(val).lower() in ['null', 'undefined', '']:
                return None
            return str(val).strip()

        program_id = sanitize_param(request.query_params.get('program_id'))
        batch_id = sanitize_param(request.query_params.get('batch_id'))
        semester = sanitize_param(request.query_params.get('semester'))
        class_year = sanitize_param(request.query_params.get('class_year'))
        division = sanitize_param(request.query_params.get('division'))
        academic_year = sanitize_param(request.query_params.get('academic_year'))
        enrollment_no = sanitize_param(request.query_params.get('enrollment_no'))
        
        # 1. Base Query (Allow viewing regardless of active status in management)
        queryset = Student.objects.all()
        
        # 2. Hard Filters (ID-based is most reliable)
        if enrollment_no:
            queryset = queryset.filter(enrollment_no=enrollment_no)
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if batch_id:
            if str(batch_id).isdigit():
                queryset = queryset.filter(batch_id=batch_id)
            else:
                # String Batch format fallback: Check year and label
                # This ensures "2025-26" correctly matches even if the internal year is 2024 (e.g. SY students)
                queryset = queryset.filter(
                    Q(batch_id__batch_year__icontains=batch_id[:4]) | 
                    Q(batch_id__batch_year__icontains=batch_id[-2:])
                )
        
        # 3. Soft Filters (Secondary)
        if semester:
            queryset = queryset.filter(semester=semester)
        if division:
            queryset = queryset.filter(division__iexact=division)
            
        # 4. Academic Year & Class Year (Smart Fallback)
        # We check if strict filtering wipes out the results. If it does, we ignore these filters
        # because the user selection might follow a different naming convention than the DB.
        if academic_year or class_year:
            strict_q = queryset
            if academic_year:
                ay_clean = academic_year.replace(" ", "")
                ay_spaced = ay_clean[:4] + " - " + ay_clean[-2:] if len(ay_clean) >= 6 else academic_year
                strict_q = strict_q.filter(Q(academic_year__icontains=ay_clean) | Q(academic_year__icontains=ay_spaced))
            if class_year:
                strict_q = strict_q.filter(class_year__iexact=class_year)
            
            # Only apply strict year/class if it actually finds students. 
            # Otherwise, prioritize showing the students in the selected Batch/Semester.
            if strict_q.exists():
                queryset = strict_q

        # Final Natural Sort
        queryset = queryset.order_by(Length('roll_no'), 'roll_no', 'enrollment_no')
            
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

class ForgotPasswordAPIView(APIView):
    """
    Receives an email, checks if the user exists and is eligible for a password reset,
    generates a secure token, and dispatches a reset link email.
    """
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        success_message = "If an account with this email exists, a reset link has been sent"
            
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # We silently return success to prevent email enumeration
            return Response({"message": success_message}, status=status.HTTP_200_OK)
            
        # Role constraint: If Auditor is inactive, pretend we sent it but don't.
        if user.role_id.role_name.lower() == 'auditor' and not user.is_active:
            return Response({"message": success_message}, status=status.HTTP_200_OK)
            
        # Optional constraint for inactive normal users
        if not user.is_active and user.role_id.role_name.lower() != 'auditor':
            return Response({"message": success_message}, status=status.HTTP_200_OK)

        # Generate standard Django UID and specific Token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = custom_token_generator.make_token(user)
        
        # Build the frontend reset link URL
        # e.g., http://localhost:3000/reset-password/<uid>/<token>
        frontend_url = request.META.get('HTTP_ORIGIN', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}"
        
        # Send Email
        title = "Password Reset Request"
        message = (
            f"Hello {user.name},\n\n"
            f"You requested to reset your password for the OBE Tracking System.\n"
            f"Please click the link below to set a new password:\n\n"
            f"{reset_link}\n\n"
            f"If you did not request this reset, you can safely ignore this email.\n"
            f"This link will expire automatically."
        )
        
        send_obe_notification(
            recipient=user,
            title=title,
            message=message,
            notification_type='INFO',
            module='GENERAL',
            priority='HIGH',
            send_email=True
        )

        log_action(user, 'UPDATE', 'User', user.user_id, remark="Forgot password requested", request=request)
        return Response({"message": success_message}, status=status.HTTP_200_OK)

class ResetPasswordAPIView(APIView):
    """
    Validates token and updates the user's password.
    """
    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not uidb64 or not token or not new_password:
            return Response({"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Verify Token
        if not custom_token_generator.check_token(user, token):
            return Response({"error": "This reset link is invalid or has expired"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update Password - Model User instances invalidate existing JWTs when the password hash changes
        user.set_password(new_password)
        user.save()
        
        log_action(user, 'UPDATE', 'User', user.user_id, remark="Password successfully reset via token", request=request)
        
        # Option to send confirmation email
        title = "Password Changed Successfully"
        message = (
            f"Hello {user.name},\n\n"
            f"Your password for the OBE Tracking System has been successfully reset.\n"
            f"If you did not perform this action, please contact your administrator immediately."
        )
        send_obe_notification(
            recipient=user,
            title=title,
            message=message,
            notification_type='INFO',
            module='GENERAL',
            priority='NORMAL',
            send_email=True
        )
        
        return Response({"message": "Password updated successfully. Please login again."}, status=status.HTTP_200_OK)
