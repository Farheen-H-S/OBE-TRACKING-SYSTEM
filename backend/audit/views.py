from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from .models import AuditLog, ApprovalAction
from .serializers import AuditLogSerializer
from users.models import User, UserRole

class AuditLogPagination(PageNumberPagination):
    page_size = 20              # default logs per page
    page_size_query_param = 'page_size'  # client can override ?page_size=
    max_page_size = 100         # max logs per page

class AuditLogListView(APIView):
    def get(self, request):
        date = request.query_params.get('date')
        module = request.query_params.get('module')

        queryset = AuditLog.objects.all().order_by('-created_at')  # latest first
        if date:
            queryset = queryset.filter(created_at__date=date)
        if module:
            queryset = queryset.filter(entity_name__iexact=module)

        paginator = AuditLogPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class VerifyRecordView(APIView):
    def post(self, request):
        object_type = request.data.get('object_type')
        object_id = request.data.get('object_id')
        if not object_type or not object_id:
            return Response({"error": "object_type and object_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user if request.user and not request.user.is_anonymous else User.objects.first()
        role = user.role_id if user else UserRole.objects.filter(role_name='Auditor').first()
        if not role:
             role = UserRole.objects.first()
        ApprovalAction.objects.create(entity_name=object_type, entity_id=object_id, action_type='APPROVE', performed_by=user, role_id=role, remark="Verified")
        return Response({"verification status": "verified"}, status=status.HTTP_200_OK)

class AddRemarkView(APIView):
    def post(self, request):
        object_id = request.data.get('object_id')
        remark = request.data.get('remark')
        if not object_id or not remark:
            return Response({"error": "object_id and remark are required"}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user if request.user and not request.user.is_anonymous else User.objects.first()
        role = user.role_id if user else UserRole.objects.first()
        ApprovalAction.objects.create(entity_name="General", entity_id=object_id, action_type='APPROVE', performed_by=user, role_id=role, remark=remark)
        return Response({"remark saved": "success"}, status=status.HTTP_200_OK)
