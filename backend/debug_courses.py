import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User, FacultyCourseAssignment
from academics.models import Course, Program, Scheme
from django.db.models import Q

def test_course_fetch(email, academic_year, program_id, scheme_id):
    try:
        user = User.objects.get(email=email)
        print(f"Testing for user: {user.email}, Role: {user.role_id.role_name}")
        
        # Mimic CourseListCreateAPIView.get logic
        def is_valid_filter(val):
            return val and val not in ["All", "0", "", "null", "undefined", "None"]

        if user.is_authenticated and user.role_id.role_name == "Faculty":
            from users.models import FacultyCourseAssignment
            from django.db.models import Q
            q_assign = Q(faculty_id=user, is_active=True)
            if is_valid_filter(academic_year):
                ay_clean = academic_year.replace(" ", "")
                print(f"Normalized academic_year: '{ay_clean}'")
                q_assign &= Q(academic_year=ay_clean)
            
            assignments = FacultyCourseAssignment.objects.filter(q_assign)
            print(f"Found {assignments.count()} assignments")
            for a in assignments:
                print(f" - Assignment: {a.academic_year}, Course ID: {a.course_id_id}")
            
            course_ids = assignments.values_list('course_id', flat=True)
            courses = Course.objects.filter(course_id__in=course_ids, is_active=True).distinct()
            print(f"Courses after assignment filter: {courses.count()}")
        else:
            courses = Course.objects.filter(is_active=True).distinct()

        if is_valid_filter(program_id): 
            courses = courses.filter(program_id=program_id)
            print(f"Courses after program filter (id={program_id}): {courses.count()}")
        if is_valid_filter(scheme_id): 
            courses = courses.filter(scheme_id=scheme_id)
            print(f"Courses after scheme filter (id={scheme_id}): {courses.count()}")
            
        for c in courses:
            print(f"MATCHED: {c.course_code} - {c.course_name}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_course_fetch('faculty@sandippoly.org', '2025 - 26', '1', '2')
