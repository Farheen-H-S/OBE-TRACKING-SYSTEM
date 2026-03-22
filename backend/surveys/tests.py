from django.test import TestCase
from rest_framework.test import APIClient
from .models import SurveyMaster, SurveyQuestion, SurveyResponse

class SurveySubmissionTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.survey = SurveyMaster.objects.create(
            survey_name="Guest Lecture Resource Person Feedback",
            survey_category="indirect",
            academic_year="2023-24",
            status="APPROVED"
        )
        self.question = SurveyQuestion.objects.create(
            survey_id=self.survey,
            question_text="How was the session?"
        )

    def test_resource_person_submission_no_enrollment(self):
        # Case 1: Name contains "Resource Person"
        payload = {
            "survey_id": self.survey.survey_id,
            "respondent_name": "Dr. John Doe",
            "answers": [
                {"question_id": self.question.question_id, "answer_value": 3}
            ]
        }
        response = self.client.post('/api/surveys/respond/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        
        # Case 2: Name does NOT contain "Resource Person" (e.g. Expert Lecture)
        # But type is explicitly 'resource-person'
        expert_survey = SurveyMaster.objects.create(
            survey_name="Expert Lecture on AI",
            survey_category="indirect",
            academic_year="2023-24",
            status="APPROVED"
        )
        expert_question = SurveyQuestion.objects.create(
            survey_id=expert_survey,
            question_text="How was the lecture?"
        )
        payload = {
            "survey_id": expert_survey.survey_id,
            "type": "resource-person",
            "respondent_name": "Prof. AI",
            "answers": [
                {"question_id": expert_question.question_id, "answer_value": 3}
            ]
        }
        response = self.client.post('/api/surveys/respond/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        
        # Verify response was created with synthetic enrollment number
        res_obj = SurveyResponse.objects.filter(survey_id=expert_survey).first()
        self.assertIsNotNone(res_obj)
        self.assertEqual(res_obj.respondent_name, "Prof. AI")
        self.assertEqual(res_obj.enrollment_no, f"RP_{expert_survey.survey_id}")
