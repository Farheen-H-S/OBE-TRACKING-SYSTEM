import os
import django
import sys
import json
from datetime import datetime

# Set up Django environment
sys.path.append(r'd:\Farheen\OBE-TRACKING-SYSTEM\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import Student, User
from academics.models import Course, CO, PO, PSO, COPOMapping, COPSOMapping, COTarget, Batch
from assessments.models import Assessment, MarksEntry
from surveys.models import SurveyMaster, SurveyResponse
from stress.models import StressMaster
from reports.models import Report, DACReport

def audit():
    results = {}
    
    # 1. Student Management
    results['Student Management'] = {
        'total_students': Student.objects.count(),
        'active_students': Student.objects.filter(is_active=True).count(),
        'departments': list(Student.objects.values_list('program_id__program_name', flat=True).distinct())
    }
    
    # 2. Course Management
    results['Course Management'] = {
        'total_courses': Course.objects.count(),
        'active_courses': Course.objects.filter(is_active=True).count(),
        'mapped_to_program': Course.objects.filter(program_id__isnull=False).count()
    }
    
    # 3. CO-PO-PSO Mapping
    results['CO-PO-PSO Mapping'] = {
        'total_co_po_mappings': COPOMapping.objects.count(),
        'total_co_pso_mappings': COPSOMapping.objects.count(),
        'courses_with_mappings': COPOMapping.objects.values('co_id__course_id').distinct().count()
    }
    
    # 4. Target Management
    results['Target Management'] = {
        'total_co_targets': COTarget.objects.count(),
        'set_by_users': list(COTarget.objects.values_list('set_by__username', flat=True).distinct())
    }
    
    # 5. CIS Marks Entry
    results['CIS Marks Entry'] = {
        'total_marks_entries': MarksEntry.objects.count(),
        'recent_entries': MarksEntry.objects.filter(entered_at__year=datetime.now().year).count()
    }
    
    # 6. Course Exit Survey
    results['Course Exit Survey'] = {
        'total_surveys': SurveyMaster.objects.filter(survey_category='course_exit').count(),
        'active_surveys': SurveyMaster.objects.filter(survey_category='course_exit', is_active=True).count(),
        'total_responses': SurveyResponse.objects.filter(survey_id__survey_category='course_exit').count()
    }
    
    # 7. Indirect Tool Survey (OIT)
    results['Indirect Tool Survey (OIT)'] = {
        'total_surveys': SurveyMaster.objects.filter(survey_category='indirect').count(),
        'active_surveys': SurveyMaster.objects.filter(survey_category='indirect', is_active=True).count(),
        'total_responses': SurveyResponse.objects.filter(survey_id__survey_category='indirect').count()
    }
    
    # 8-10. Attainment (Direct/Indirect/PO-PSO)
    # Check if we have attainment data or if it's computed on the fly
    results['Attainment System'] = {
        'batch_count': Batch.objects.count()
    }

    # 11-12. Reports & Verification
    results['Reports & Verification'] = {
        'total_verified_reports': Report.objects.filter(status='Verified').count(),
        'total_dac_reports': DACReport.objects.count(),
        'pending_approvals': Report.objects.filter(status='Pending').count()
    }
    
    # 13. Backtracking
    results['Backtracking'] = {
        'assessment_years': list(Assessment.objects.values_list('academic_year', flat=True).distinct()),
        'survey_years': list(SurveyMaster.objects.values_list('academic_year', flat=True).distinct())
    }
    
    # 14. Stress Survey
    results['Stress Survey'] = {
        'total_surveys': StressMaster.objects.count(),
        'active_surveys': StressMaster.objects.filter(is_active=True).count()
    }

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    audit()
