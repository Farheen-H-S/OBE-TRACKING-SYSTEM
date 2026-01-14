import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import UserRole, User
from academics.models import Program, Scheme, Course, CO, Batch, COTarget

def seed():
    # 1. Roles
    roles = ['Admin', 'HOD', 'Coordinator', 'Faculty', 'Auditor']
    for r in roles:
        UserRole.objects.get_or_create(role_name=r)
    print("Seeded Roles")

    # 2. Admin User
    admin_role = UserRole.objects.get(role_name='Admin')
    admin, _ = User.objects.get_or_create(
        email='admin@example.com',
        defaults={
            'name': 'System Admin',
            'role_id': admin_role,
            'password': 'password123',
            'department': 'CS'
        }
    )
    print("Seeded Admin User")

    # 3. Academic Data
    program, _ = Program.objects.get_or_create(
        program_name='B.E. Computer Science',
        defaults={'duration': 4}
    )
    
    scheme, _ = Scheme.objects.get_or_create(
        scheme_name='2019 Scheme',
        defaults={'start_year': 2019}
    )
    
    batch, _ = Batch.objects.get_or_create(
        batch_year=2023,
        program_id=program,
        scheme_id=scheme
    )
    
    course, _ = Course.objects.get_or_create(
        course_code='CS101',
        scheme_id=scheme,
        defaults={
            'course_name': 'Data Structures',
            'semester': 3,
            'program_id': program
        }
    )
    print("Seeded Academic Data")

    # 4. COs
    co1, _ = CO.objects.get_or_create(
        course_id=course,
        co_number='CO1',
        defaults={'description': 'Understand basic data structures.'}
    )
    print("Seeded COs")

if __name__ == "__main__":
    seed()
