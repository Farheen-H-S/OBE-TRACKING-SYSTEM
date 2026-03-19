from surveys.models import SurveyQuestion, SurveyAnswer, SurveyMaster
from academics.models import CO
from django.db.models import Count, Avg

def check_ces_data():
    surveys = SurveyMaster.objects.filter(survey_category='course_exit')
    print(f"Total CES Surveys: {surveys.count()}")
    
    for s in surveys:
        print(f"\nSurvey: {s.survey_name} (AY: {s.academic_year}, Course ID: {s.course_id_id})")
        questions = SurveyQuestion.objects.filter(survey_id=s)
        print(f"  Total Questions: {questions.count()}")
        
        for q in questions:
            ans_count = SurveyAnswer.objects.filter(question_id=q).count()
            co_num = q.co_id.co_number if q.co_id else "None"
            print(f"    Q: {q.question_text[:30]}... | Ans: {ans_count} | CO: {co_num}")
            if ans_count > 0:
                avg = SurveyAnswer.objects.filter(question_id=q).aggregate(Avg('answer_value'))['answer_value__avg']
                print(f"      Avg Rating: {avg}")

if __name__ == "__main__":
    check_ces_data()
