from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone

from .models import (
    StressMaster,
    StressResponse,
    SurveySessionToken,
    StressQuestion
)
from .serializers import (
    StressMasterSerializer,
    StressResponseSerializer,
    SurveySessionTokenSerializer,
    StressQuestionSerializer
)
from .service import StressCalculationService


# -------------------------------
# Questions (Student Access)
# -------------------------------

class StressQuestionListView(generics.ListAPIView):
    """
    Returns list of questions for a specific survey.
    Usage: /api/stress/questions/?survey_id=1
    """
    serializer_class = StressQuestionSerializer

    def get_queryset(self):
        survey_id = self.request.query_params.get('survey_id')
        if not survey_id:
            raise ValidationError("survey_id query parameter is required.")
        return StressQuestion.objects.filter(survey_id=survey_id, is_active=True)


# -------------------------------
# Stress Survey Master (Admin)
# -------------------------------

class StressMasterListCreateView(generics.ListCreateAPIView):
    queryset = StressMaster.objects.all()
    serializer_class = StressMasterSerializer


class StressMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StressMaster.objects.all()
    serializer_class = StressMasterSerializer


# -------------------------------
# Token Management
# -------------------------------

class SurveySessionTokenCreateView(generics.CreateAPIView):
    queryset = SurveySessionToken.objects.all()
    serializer_class = SurveySessionTokenSerializer


# -------------------------------
# Stress Response Submission (Student)
# -------------------------------

class StressResponseCreateView(generics.CreateAPIView):
    queryset = StressResponse.objects.all()
    serializer_class = StressResponseSerializer

    def create(self, request, *args, **kwargs):
        is_list = isinstance(request.data, list)
        
        # Extract metadata from the first item or root dict
        if is_list and len(request.data) > 0:
            token_value = request.data[0].get("token")
            survey_id = request.data[0].get("survey_id")
        elif isinstance(request.data, dict):
            token_value = request.data.get("token")
            survey_id = request.data.get("survey_id")
        else:
            raise ValidationError("Invalid request data format. Expected dict or list of dicts.")
        
        if not token_value or not survey_id:
            raise ValidationError("Metadata fields 'token' and 'survey_id' are required.")

        # 🔐 Validate Token Usage
        try:
            token_obj = SurveySessionToken.objects.get(
                token=token_value,
                survey_id=survey_id,
                is_used=False
            )
        except SurveySessionToken.DoesNotExist:
            raise ValidationError("Token is invalid, already used, or does not belong to this survey.")

        # ✅ Save Responses
        serializer = self.get_serializer(data=request.data, many=is_list)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # 🔒 Mark token as used to prevent resubmission
        token_obj.is_used = True
        token_obj.save()

        # 📊 Provide Instant Calculation Results
        stress_result = StressCalculationService.calculate_stress(
            survey_id=survey_id,
            token=token_value
        )

        return Response(
            {
                "message": "Stress survey submitted successfully.",
                "stress_result": stress_result
            },
            status=status.HTTP_201_CREATED
        )

# -------------------------------
# Advanced Analytics (HOD/Faculty)
# -------------------------------

class StressSurveyAnalyticsView(generics.GenericAPIView):
    """
    Returns aggregate stress levels for a survey.
    Optional Filter: ?batch_id=
    """
    def get(self, request, pk):
        batch_id = request.query_params.get('batch_id')
        data = StressCalculationService.get_aggregate_analytics(pk, batch_id)
        return Response(data, status=status.HTTP_200_OK)


class StressCategoryStatsView(generics.GenericAPIView):
    """
    Returns average stress scores per category.
    Optional Filter: ?batch_id=
    """
    def get(self, request, pk):
        batch_id = request.query_params.get('batch_id')
        data = StressCalculationService.get_category_stats(pk, batch_id)
        return Response(data, status=status.HTTP_200_OK)


# -------------------------------
# Public Access Control
# -------------------------------

class AnonymousTokenGenerateView(generics.GenericAPIView):
    """
    Generates a fresh token for a student opening a public link.
    Enforces the survey deadline.
    """
    def post(self, request, pk):
        try:
            survey = StressMaster.objects.get(pk=pk, is_active=True)
            
            # 🕒 Check Deadline
            if survey.end_date and survey.end_date < timezone.now():
                return Response({"error": "Survey deadline has passed."}, status=status.HTTP_400_BAD_REQUEST)
                
            token_obj = StressCalculationService.generate_anonymous_token(pk)
            
            return Response({
                "survey_title": survey.title,
                "token": token_obj.token,
                "expires": "On Submission"
            }, status=status.HTTP_201_CREATED)
        except StressMaster.DoesNotExist:
            return Response({"error": "Active survey not found."}, status=status.HTTP_404_NOT_FOUND)


class StressReportExportView(generics.GenericAPIView):
    """
    Exports a detailed audit-ready CSV for the HOD.
    """
    def get(self, request, pk):
        import csv
        from django.http import HttpResponse
        
        try:
            survey = StressMaster.objects.get(pk=pk)
            responses = StressResponse.objects.filter(survey_id=pk).select_related(
                'question_id', 
                'question_id__category_id',
                'batch_id',
                'batch_id__program_id'
            )
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="stress_audit_report_{pk}.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['Survey Title', 'Department', 'Batch', 'Question', 'Category', 'Score', 'Date'])
            
            for r in responses:
                program = r.batch_id.program_id.program_name if r.batch_id else "N/A"
                batch = r.batch_id.batch_year if r.batch_id else "N/A"
                
                writer.writerow([
                    survey.title,
                    program,
                    batch,
                    r.question_id.question_text,
                    r.question_id.category_id.name,
                    r.response_value,
                    r.created_at.strftime('%Y-%m-%d %H:%M')
                ])
                
            return response
        except StressMaster.DoesNotExist:
            return Response({"error": "Survey not found."}, status=status.HTTP_404_NOT_FOUND)
