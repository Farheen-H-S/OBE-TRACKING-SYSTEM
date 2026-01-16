from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import User, UserRole
from .serializers import UserSerializer, UserRoleSerializer
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken

# APP: USERS & RBAC

class UserListCreateAPIView(APIView):
    """
    List all users or create a new user.
    API: List users | Method: GET | Endpoint: /users/ | Auth: Yes | Roles: Admin
    API: Create user | Method: POST | Endpoint: /users/ | Auth: Yes | Roles: Admin
    """
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = User.objects.all()
        role = request.query_params.get('role')
        status_param = request.query_params.get('status')
        if role:
            queryset = queryset.filter(role_id__role_name__iexact=role)
        if status_param:
            is_active = status_param.lower() == 'active'
            queryset = queryset.filter(is_active=is_active)
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
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"user_id": user.user_id, "status": "created"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailAPIView(APIView):
    """
    Retrieve, update or disable a user.
    """
    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        data = request.data.copy()
        if 'role' in data:
            try:
                role_obj = UserRole.objects.get(role_name__iexact=data['role'])
                data['role_id'] = role_obj.role_id
            except UserRole.DoesNotExist:
                 pass
        if 'status' in data:
            data['is_active'] = data['status'].lower() == 'active'
        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.is_active = False # Soft delete
        user.save()
        return Response({"message": "soft delete confirmation", "user_id": pk, "is_active": user.is_active}, status=status.HTTP_200_OK)

class RoleListAPIView(APIView):
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

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "role": user.role_id.role_name
            }
        }, status=status.HTTP_200_OK)

class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()  # invalidate the refresh token
            return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)