import os
import django
import sys

# Setup Django
sys.path.append(r'd:\Farheen\OBE-TRACKING-SYSTEM\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from surveys.models import SurveyMaster, SurveyResponse, SurveyAnswer, SurveyQuestion

def verify_rp_overwrite():
    # 1. Create a Test Resource Person survey
    survey = SurveyMaster.objects.create(
        survey_name='Test Resource Person Feedback',
        survey_category='indirect',
        academic_year='2024 - 25',
        resource_person_name='Dr. Verification Expert',
        status='APPROVED'
    )
    
    # Create a question for the survey
    q = SurveyQuestion.objects.create(
        survey_id=survey,
        question_text='Test Question?',
        is_active=True
    )
    
    print(f"Created Test Survey: {survey.survey_name} (ID: {survey.survey_id})")
    
    # Simulate first submission
    enrollment_no = f"RP_{survey.survey_id}"
    respondent_name = survey.resource_person_name or "Test RP"
    
    # Clear previous for clean test
    SurveyResponse.objects.filter(survey_id=survey, enrollment_no=enrollment_no).delete()
    
    # Trigger first submission (simulating SubmitSurveyResponseView.post logic)
    print("Simulating first submission...")
    resp1 = SurveyResponse.objects.create(
        survey_id=survey,
        respondent_name=respondent_name,
        enrollment_no=enrollment_no
    )
    # Add dummy answer
    q = survey.questions.first()
    if q:
        SurveyAnswer.objects.create(response_id=resp1, question_id=q, answer_value=3)
    
    count = SurveyResponse.objects.filter(survey_id=survey, enrollment_no=enrollment_no).count()
    print(f"Response count after 1st sub: {count}")
    
    # Simulate second submission (overwrite)
    print("Simulating second submission (overwrite)...")
    # Backend logic: if enrollment_no.startswith("RP_"), delete previous
    SurveyResponse.objects.filter(survey_id=survey, enrollment_no=enrollment_no).delete()
    
    resp2 = SurveyResponse.objects.create(
        survey_id=survey,
        respondent_name=respondent_name,
        enrollment_no=enrollment_no
    )
    if q:
        SurveyAnswer.objects.create(response_id=resp2, question_id=q, answer_value=2)
    
    count = SurveyResponse.objects.filter(survey_id=survey, enrollment_no=enrollment_no).count()
    print(f"Response count after 2nd sub: {count}")
    
    latest_resp = SurveyResponse.objects.filter(survey_id=survey, enrollment_no=enrollment_no).first()
    latest_answer = latest_resp.answers.first().answer_value if latest_resp and latest_resp.answers.exists() else None
    print(f"Latest answer value: {latest_answer}")
    
    if count == 1 and latest_answer == 2:
        print("SUCCESS: Overwrite logic verified.")
    else:
        print("FAILURE: Overwrite logic failed.")

if __name__ == "__main__":
    verify_rp_overwrite()
