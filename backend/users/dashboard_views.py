from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import User, UserRole
from academics.models import AcademicSetup, Program
from .permissions import IsAdmin, IsHOD

class AdminDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin | IsHOD]

    def get(self, request):
        user = request.user
        role = user.role_id.role_name.upper()
        
        # 1. Academic Info
        academic_setup = AcademicSetup.objects.select_related('scheme_id').first()
        academic_year = academic_setup.academic_year if academic_setup else "N/A"
        scheme_name = academic_setup.scheme_id.scheme_name if academic_setup and academic_setup.scheme_id else "N/A"
        semester_type = academic_setup.semester_type if academic_setup else "N/A"
        updated_at = academic_setup.updated_at.strftime('%d/%m/%Y') if academic_setup else "N/A"
 
        # 2. Global/Department User Metrics
        if role == 'ADMIN':
            user_base = User.objects.all()
            total_departments = Program.objects.filter(is_active=True).count()
        else:
            # HOD/Coordinator - Filter by department
            if not user.department:
                return Response({"error": "User department not assigned"}, status=400)
            user_base = User.objects.filter(department=user.department)
            total_departments = 1
 
        total_users = user_base.count()
        active_users = user_base.filter(is_active=True).count()
        inactive_users = total_users - active_users
 
        # 3. Role-wise Distribution
        if role == 'ADMIN':
            role_counts = UserRole.objects.annotate(
                total=Count('user'),
                active=Count('user', filter=Q(user__is_active=True))
            )
        else:
            role_counts = UserRole.objects.filter(user__department=user.department).annotate(
                total=Count('user', filter=Q(user__department=user.department)),
                active=Count('user', filter=Q(user__department=user.department, user__is_active=True))
            ).distinct()
            
        role_distribution = [
            {"role": r.role_name, "total": r.total, "active": r.active}
            for r in role_counts if r.total > 0
        ]
 
        # 4. Department-Level Overview (Only for Admin)
        dept_overview = []
        if role == 'ADMIN':
            programs = Program.objects.filter(is_active=True)
            for prog in programs:
                roles_in_dept = UserRole.objects.filter(user__department=prog).annotate(
                    total=Count('user', filter=Q(user__department=prog)),
                    active=Count('user', filter=Q(user__department=prog, user__is_active=True))
                ).distinct()
                
                dept_roles = [
                    {"role": r.role_name, "total": r.total, "active": r.active}
                    for r in roles_in_dept
                ]
                
                dept_users = User.objects.filter(department=prog)
                dept_overview.append({
                    "dept_name": prog.program_name,
                    "total_users": dept_users.count(),
                    "active_users": dept_users.filter(is_active=True).count(),
                    "roles": dept_roles
                })
 
        # 5. Attention Required Logic
        config_issues = []
        if not academic_setup:
            config_issues.append("No active academic year")
        else:
            if not academic_setup.academic_year or academic_setup.academic_year == "N/A":
                config_issues.append("Academic year not configured")
            if not academic_setup.semester_type or academic_setup.semester_type == "N/A":
                config_issues.append("Semester type not configured")
            if not academic_setup.scheme_id:
                config_issues.append("Scheme not assigned")
 
        structural_issues = []
        if role == 'ADMIN':
            programs = Program.objects.filter(is_active=True)
            for prog in programs:
                if not User.objects.filter(department=prog, role_id__role_name__iexact='HOD', is_active=True).exists():
                    structural_issues.append(f"Department '{prog.program_name}' without active HOD")
                if not User.objects.filter(department=prog, role_id__role_name__iexact='COORDINATOR', is_active=True).exists():
                    if UserRole.objects.filter(role_name__iexact='COORDINATOR').exists():
                        structural_issues.append(f"Department '{prog.program_name}' without active Coordinator")
            
            users_without_role = User.objects.filter(role_id__isnull=True, is_active=True).count()
            if users_without_role > 0:
                structural_issues.append(f"{users_without_role} active user(s) without role")
            
            users_without_dept = User.objects.filter(
                department__isnull=True, is_active=True
            ).exclude(Q(role_id__role_name__iexact='ADMIN') | Q(role_id__role_name__iexact='AUDITOR')).count()
            if users_without_dept > 0:
                structural_issues.append(f"{users_without_dept} active user(s) without department")
        else:
            # HOD specific structural check
            prog = user.department
            if not User.objects.filter(department=prog, role_id__role_name__iexact='COORDINATOR', is_active=True).exists():
                structural_issues.append(f"Department '{prog.program_name}' without active Coordinator")
 
        # 6. Monthly additions
        monthly_additions = [["Month", "Users Added"]]
        if role == 'ADMIN':
            now = timezone.now()
            for i in range(5, -1, -1):
                date = now - timedelta(days=i*30)
                month_name = date.strftime('%b')
                count = User.objects.filter(created_at__year=date.year, created_at__month=date.month).count()
                monthly_additions.append([month_name, count])
 
        data = {
            "metrics": {
                "academic_year": academic_year,
                "scheme_name": scheme_name,
                "semester_type": semester_type,
                "total_users": total_users,
                "active_users": active_users,
                "inactive_users": inactive_users,
                "total_departments": total_departments,
                "effective_from": updated_at,
            },
            "global_role_distribution": role_distribution if role == 'ADMIN' else [],
            "department_role_distribution": role_distribution if role != 'ADMIN' else [],
            "department_overview": dept_overview,
            "attention_required": {
                "config": config_issues,
                "structural": structural_issues
            },
            "monthly_trends": monthly_additions if role == 'ADMIN' else []
        }
 
        return Response(data, status=status.HTTP_200_OK)
