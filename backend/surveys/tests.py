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

    def test_resource_person_stats_with_filters(self):
        # Create an RP survey (with resource_person_name)
        rp_survey = SurveyMaster.objects.create(
            survey_name="Expert Lecture",
            survey_category="indirect",
            resource_person_name="Expert Speaker",
            status="APPROVED"
        )
        q = SurveyQuestion.objects.create(survey_id=rp_survey, question_text="Q1")
        # Submit a response
        res = SurveyResponse.objects.create(
            survey_id=rp_survey,
            respondent_name="Expert Speaker",
            enrollment_no=f"RP_{rp_survey.survey_id}"
        )
        from surveys.models import SurveyAnswer
        SurveyAnswer.objects.create(response_id=res, question_id=q, answer_value=4)

        # Request stats with a batch filter that would normally exclude students
        # (RP responses don't have a student_id, so they should NOT be filtered out by student batch)
        response = self.client.get(f'/api/surveys/{rp_survey.survey_id}/responses/?batch_id=123')
        # print(f"DEBUG: Response status: {response.status_code}")
        # print(f"DEBUG: Response data: {response.json()}")
        self.assertEqual(response.status_code, 200)
        
        # Check if the response is included in the stats
        data = response.json()
        self.assertIn('teachers', data)
        teachers = data['teachers']
        # The teacher name should be the RP name ('Expert Speaker' in this setup)
        rp_teacher = next((t for t in teachers if t['teacher'] == 'Expert Speaker'), None)
        self.assertIsNotNone(rp_teacher, "Resource Person 'Expert Speaker' not found in teacher stats")
        self.assertTrue(any(v != "N/A" for v in rp_teacher['scores'].values()), "All scores are N/A for RP")
        self.assertGreater(rp_teacher['achieved_score'], 0)
        
        # Verify statement metadata (to prevent "PO UNDEFINED" in UI)
        self.assertIn('statements', data)
        statements = data['statements']
        self.assertGreater(len(statements), 0)
        for s in statements:
            self.assertIn('number', s)
            self.assertIn('type', s)
            self.assertIsNotNone(s['number'])
