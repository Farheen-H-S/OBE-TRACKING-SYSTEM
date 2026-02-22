from .models import StressMaster, StressSubmission, StressAnswer, SurveySessionToken, StressActionPlan
from collections import defaultdict
import uuid


class StressCalculationService:

    @classmethod
    def _is_positive(cls, answer):
        if answer.question.is_reverse:
            return answer.response_value >= 3
        return answer.response_value <= 1

    @classmethod
    def calculate_stress(cls, survey_id, token_value):
        try:
            submission = StressSubmission.objects.get(
                survey_id=survey_id,
                token__token=token_value
            )
        except StressSubmission.DoesNotExist:
            return {"error": "No responses found for this token"}

        answers = submission.answers.select_related('question', 'question__category')
        total = answers.count()
        positive = 0
        category_map = defaultdict(lambda: {"total": 0, "positive": 0})

        for a in answers:
            is_positive = cls._is_positive(a)
            if is_positive:
                positive += 1

            cat = a.question.category.name
            category_map[cat]["total"] += 1
            if is_positive:
                category_map[cat]["positive"] += 1

        pos_pct = round((positive / total) * 100, 2) if total else 0
        stress_pct = round(100 - pos_pct, 2)

        if pos_pct >= 75:
            level, emoji, label = "LOW", "😌", "Relaxed"
        elif pos_pct >= 50:
            level, emoji, label = "MODERATE", "😐", "Mild Stress"
        else:
            level, emoji, label = "HIGH", "😟", "High Stress"

        category_insights = []
        for name, c in category_map.items():
            cp = round((c["positive"] / c["total"]) * 100, 2)
            category_insights.append({
                "category": name,
                "positive_percentage": cp,
                "stress_percentage": round(100 - cp, 2),
                "stress_impact": "HIGH" if cp < 50 else "LOW"
            })

        return {
            "survey_id": survey_id,
            "total_questions": total,
            "positive_percentage": pos_pct,
            "stress_percentage": stress_pct,
            "stress_level": level,
            "label": label,
            "emoji": emoji,
            "category_insights": category_insights
        }

    @classmethod
    def generate_anonymous_token(cls, survey_id):
        token_val = f"STRESS-{uuid.uuid4().hex[:8].upper()}"
        return SurveySessionToken.objects.create(
            token=token_val,
            survey_id=survey_id
        )
    @classmethod
    def get_survey_report_data(cls, survey_id):
        survey = StressMaster.objects.select_related('approved_question_set').get(pk=survey_id)
        submissions = StressSubmission.objects.filter(survey=survey).prefetch_related('answers', 'answers__question', 'answers__question__category')
        
        total_responses = submissions.count()
        if total_responses == 0:
            return None

        # Aggregate data structures
        all_answers = []
        domain_stats = defaultdict(lambda: {"scores": [], "high_count": 0, "total": 0})
        question_stats = defaultdict(lambda: {"scores": [], "high_count": 0, "text": "", "domain": ""})
        stress_level_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0}
        
        for sub in submissions:
            sub_results = cls.calculate_stress(survey_id, sub.token.token)
            stress_level_counts[sub_results["stress_level"]] += 1
            
            for ans in sub.answers.all():
                # Normalize score: if reverse, 0->4, 1->3, 2->2, 3->1, 4->0
                # But wait, our current logic says: is_positive if (reverse and >=3) or (not reverse and <=1)
                # Let's define "Stress Score" where 4 is MAX STRESS and 0 is NO STRESS.
                score = ans.response_value
                if ans.question.is_reverse:
                    score = 4 - score
                
                domain = ans.question.category.name
                qid = ans.question.question_id
                
                domain_stats[domain]["scores"].append(score)
                domain_stats[domain]["total"] += 1
                if score >= 3: # High stress threshold usually 3 or 4 on 0-4 scale
                    domain_stats[domain]["high_count"] += 1
                
                question_stats[qid]["scores"].append(score)
                question_stats[qid]["text"] = ans.question.question_text
                question_stats[qid]["domain"] = domain
                if score >= 3:
                    question_stats[qid]["high_count"] += 1

        # Domain level aggregation
        domain_analysis = []
        for name, data in domain_stats.items():
            avg = sum(data["scores"]) / len(data["scores"])
            domain_analysis.append({
                "name": name,
                "avg_score": round(avg, 2),
                "level": "HIGH" if avg >= 2.5 else ("MODERATE" if avg >= 1.5 else "LOW"),
                "high_pct": round((data["high_count"] / data["total"]) * 100, 2)
            })
        
        # Sort domains by rank (highest stress first)
        domain_analysis.sort(key=lambda x: x["avg_score"], reverse=True)
        for i, d in enumerate(domain_analysis):
            d["rank"] = i + 1

        # Question level aggregation
        question_analysis = []
        for qid, data in question_stats.items():
            avg = sum(data["scores"]) / len(data["scores"])
            question_analysis.append({
                "qid": qid,
                "text": data["text"],
                "domain": data["domain"],
                "avg_score": round(avg, 2),
                "level": "HIGH" if avg >= 2.5 else ("MODERATE" if avg >= 1.5 else "LOW"),
                "high_count": data["high_count"],
                "high_pct": round((data["high_count"] / total_responses) * 100, 2)
            })

        # Overall stats
        if not domain_analysis:
            overall_avg = 0
        else:
            overall_avg = sum([d["avg_score"] for d in domain_analysis]) / len(domain_analysis)
        
        # Fetch Action Plans
        action_plans = []
        plans = StressActionPlan.objects.filter(survey=survey).select_related('batch')
        for p in plans:
            action_plans.append({
                "batch": p.batch.batch_name if p.batch else "Overall",
                "analysis": p.analysis_remarks,
                "action": p.action_taken,
                "date": p.updated_at.strftime('%Y-%m-%d')
            })

        return {
            "survey_info": {
                "title": survey.title,
                "month": survey.month,
                "year": survey.year,
                "window_start": survey.created_at,
                "window_end": survey.end_date,
                "total_responses": total_responses,
            },
            "overall_summary": {
                "avg_score": round(overall_avg, 2),
                "level": "HIGH" if overall_avg >= 2.5 else ("MODERATE" if overall_avg >= 1.5 else "LOW"),
                "counts": stress_level_counts,
                "distribution": {k: round((v/total_responses)*100, 2) for k, v in stress_level_counts.items()}
            },
            "domain_analysis": domain_analysis,
            "question_analysis": question_analysis,
            "action_plans": action_plans
        }
