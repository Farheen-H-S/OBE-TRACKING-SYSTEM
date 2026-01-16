from django.db.models import Count, Avg
from .models import (
    StressMaster,
    StressQuestion,
    StressResponse,
    SurveySessionToken
)


class StressCalculationService:
    """
    Handles:
    - Token validation
    - Stress calculation
    - Pie-chart data generation
    - Aggregate analytics (with HOD Alerts)
    - Demographic filtering (Batch/Branch)
    """

    POSITIVE_VALUES = [4, 5]   # 4 & 5 considered positive in survey scaling

    @classmethod
    def calculate_stress(cls, survey_id, token):
        """
        Calculates stress level for an individual session.
        """
        responses = StressResponse.objects.filter(
            survey_id=survey_id,
            token__token=token
        )

        total_responses = responses.count()

        if total_responses == 0:
            return {"error": "No responses found for this survey session."}

        positive_count = responses.filter(
            response_value__in=cls.POSITIVE_VALUES
        ).count()

        positive_percentage = round((positive_count / total_responses) * 100, 2)
        stress_percentage = round(100 - positive_percentage, 2)

        if positive_percentage >= 75:
            stress_level = "LOW"
        elif positive_percentage >= 50:
            stress_level = "MODERATE"
        else:
            stress_level = "HIGH"

        return {
            "survey_id": survey_id,
            "total_questions": total_responses,
            "positive_responses": positive_count,
            "positive_percentage": positive_percentage,
            "stress_percentage": stress_percentage,
            "stress_level": stress_level,
            "pie_chart": {
                "positive": positive_percentage,
                "stress": stress_percentage
            }
        }

    @classmethod
    def get_aggregate_analytics(cls, survey_id, batch_id=None):
        """
        Calculates batch-level analytics with HOD Alerts.
        """
        query = StressResponse.objects.filter(survey_id=survey_id)
        if batch_id:
            query = query.filter(batch_id=batch_id)
            
        total_responses = query.count()
        
        if total_responses == 0:
            return {"message": "No data available for this criteria"}

        unique_tokens = query.values('token').distinct().count()
        positive_count = query.filter(response_value__in=cls.POSITIVE_VALUES).count()
        
        avg_positive_pct = round((positive_count / total_responses) * 100, 2) if total_responses > 0 else 0
        avg_stress_pct = round(100 - avg_positive_pct, 2)

        # 🚨 HOD Alert Logic: If average stress is > 70%, trigger alert.
        is_critical = avg_stress_pct > 70
        
        hod_alert = {
            "trigger_alert": is_critical,
            "severity": "CRITICAL" if is_critical else "NORMAL",
            "message": "URGENT: High stress levels detected in this batch. Immediate counselor intervention recommended." if is_critical else "Stress levels are within manageable limits."
        }

        return {
            "survey_id": survey_id,
            "batch_id": batch_id,
            "total_participants": unique_tokens,
            "total_responses": total_responses,
            "overall_positive_percentage": avg_positive_pct,
            "overall_stress_percentage": avg_stress_pct,
            "status": "MODERATE" if avg_stress_pct > 40 else "HEALTHY",
            "hod_alert": hod_alert
        }

    @classmethod
    def get_category_stats(cls, survey_id, batch_id=None):
        """
        Breaks down stress levels per category.
        """
        query = StressResponse.objects.filter(survey_id=survey_id)
        if batch_id:
            query = query.filter(batch_id=batch_id)
            
        stats = query.values('question_id__category_id__name')\
            .annotate(avg_value=Avg('response_value'))
            
        category_data = []
        for item in stats:
            avg_val = item['avg_value'] or 0
            category_data.append({
                "category": item['question_id__category_id__name'] or "Uncategorized",
                "average_score": round(avg_val, 2),
                "stress_impact": "HIGH" if avg_val > 2.5 else "LOW"
            })
            
        return category_data

    @classmethod
    def generate_anonymous_token(cls, survey_id):
        """
        Creates a new unique anonymous token for a public entry link.
        """
        import uuid
        token_val = f"STRESS-{uuid.uuid4().hex[:8].upper()}"
        
        token_obj = SurveySessionToken.objects.create(
            token=token_val,
            survey_id_id=survey_id,
            is_used=False
        )
        return token_obj
