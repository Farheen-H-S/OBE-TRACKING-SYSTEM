
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from surveys.models import SurveyResponse, SurveyAnswer, SurveyQuestion
from academics.models import PO, PSO

def simulate():
    survey_id = 16
    start_roll = 1
    end_roll = 52

    # Get all responses for the survey
    responses = SurveyResponse.objects.filter(survey_id=survey_id).select_related('student_id')
    
    # Filter responses within roll number range
    filtered_responses = []
    for resp in responses:
        if resp.student_id and resp.student_id.roll_no:
            try:
                roll_no = int(resp.student_id.roll_no)
                if start_roll <= roll_no <= end_roll:
                    filtered_responses.append(resp)
            except ValueError:
                # Handle non-integer roll numbers if any
                pass

    print(f"Total responses in range {start_roll}-{end_roll}: {len(filtered_responses)}")

    if not filtered_responses:
        print("No responses found in the specified range.")
        return

    # Get all questions for this survey to map PO/PSO
    questions = SurveyQuestion.objects.filter(survey_id=survey_id)
    question_map = {q.question_id: q for q in questions}

    # Data structures for sums and counts
    po_data = {} # po_id -> {'sum': 0, 'count': 0, 'number': ''}
    pso_data = {} # pso_id -> {'sum': 0, 'count': 0, 'number': ''}

    # Process filtered responses
    response_ids = [r.response_id for r in filtered_responses]
    answers = SurveyAnswer.objects.filter(response_id__in=response_ids).select_related('question_id')

    for answer in answers:
        question = answer.question_id
        if not question:
            continue
            
        val = answer.answer_value
        
        if question.po_id:
            po_id = question.po_id.po_id
            if po_id not in po_data:
                po_data[po_id] = {'sum': 0, 'count': 0, 'number': question.po_id.po_number}
            po_data[po_id]['sum'] += val
            po_data[po_id]['count'] += 1
            
        if question.pso_id:
            pso_id = question.pso_id.pso_id
            if pso_id not in pso_data:
                pso_data[pso_id] = {'sum': 0, 'count': 0, 'number': question.pso_id.pso_number}
            pso_data[pso_id]['sum'] += val
            pso_data[pso_id]['count'] += 1

    # Print results
    print("\n--- PO Averages ---")
    for po_id, data in sorted(po_data.items(), key=lambda x: x[1]['number']):
        avg = data['sum'] / data['count'] if data['count'] > 0 else 0
        print(f"{data['number']}: {avg:.2f} (Responses: {data['count']})")

    print("\n--- PSO Averages ---")
    for pso_id, data in sorted(pso_data.items(), key=lambda x: x[1]['number']):
        avg = data['sum'] / data['count'] if data['count'] > 0 else 0
        print(f"{data['number']}: {avg:.2f} (Responses: {data['count']})")

if __name__ == "__main__":
    simulate()
