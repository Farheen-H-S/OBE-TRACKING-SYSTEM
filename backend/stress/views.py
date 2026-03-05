from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import (
    StressMaster, StressQuestionSetQuestion, SurveySessionToken, 
    StressSubmission, StressQuestionSet, StressActionPlan, StressQuestion
)
from .serializers import (
    StressMasterSerializer, StressQuestionSerializer, 
    StressSubmissionSerializer, StressQuestionSetDetailSerializer,
    StressActionPlanSerializer
)
from .service import StressCalculationService
from users.permissions import IsHOD, IsFaculty, IsHODOrFaculty
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from .report_generator import StressExcelReportGenerator


class StressMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = StressMasterSerializer
    permission_classes = [IsAuthenticated, IsHODOrFaculty]

    def get_queryset(self):
        queryset = StressMaster.objects.all().order_by('-survey_id')
        year_param = self.request.query_params.get('year')
        if year_param:
            try:
                # academic year like "2025-26" → filter surveys where year = 2025 or 2026
                parts = year_param.replace(' ', '').split('-')
                start_year = int(parts[0])
                end_year = start_year + 1
                queryset = queryset.filter(year__in=[start_year, end_year])
            except (ValueError, IndexError):
                pass
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Overriding create to implement 'upsert' logic for (month, year).
        If a survey already exists for the given month and year, update it.
        """
        month = request.data.get('month')
        year = request.data.get('year')
        end_date = request.data.get('end_date')

        # If end_date is not provided, set it to 7 days from now by default
        if not end_date:
            from datetime import timedelta
            request.data['end_date'] = timezone.now() + timedelta(days=7)

        if month and year:
            existing_survey = StressMaster.objects.filter(month=month, year=year).first()
            if existing_survey:
                serializer = self.get_serializer(existing_survey, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)



class StressMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StressMaster.objects.all()
    serializer_class = StressMasterSerializer
    permission_classes = [IsAuthenticated, IsHOD]


class StressQuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StressQuestion.objects.all()
    serializer_class = StressQuestionSerializer
    permission_classes = [IsAuthenticated, IsHOD]


class StressQuestionSetListView(generics.ListAPIView):
    queryset = StressQuestionSet.objects.filter(is_active=True)
    serializer_class = StressQuestionSetDetailSerializer
    permission_classes = [IsAuthenticated, IsHOD]



class StressSurveyQuestionListView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        survey = get_object_or_404(StressMaster, pk=pk, is_active=True)
        mappings = StressQuestionSetQuestion.objects.filter(
            question_set=survey.approved_question_set,
            question__is_active=True
        ).select_related('question', 'question__category')

        questions = [m.question for m in mappings]
        serializer = StressQuestionSerializer(questions, many=True)

        return Response({
            "survey": survey.title,
            "total_questions": len(questions),
            "questions": serializer.data
        })


class AnonymousTokenGenerateView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        survey = get_object_or_404(StressMaster, pk=pk, is_active=True)
        if survey.end_date and survey.end_date < timezone.now():
            return Response({"error": "Survey closed"}, status=status.HTTP_400_BAD_REQUEST)

        token = StressCalculationService.generate_anonymous_token(pk)
        return Response({"token": token.token}, status=201)


class StressSubmissionCreateView(generics.CreateAPIView):
    serializer_class = StressSubmissionSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        if not isinstance(request.data, dict):
            raise ValidationError("Invalid payload")

        token_value = request.data.get('token')
        survey_id = request.data.get('survey_id')

        if not token_value or not survey_id:
            raise ValidationError("token and survey_id are required")

        try:
            token_obj = SurveySessionToken.objects.get(
                token=token_value,
                survey_id=survey_id,
                is_used=False
            )
        except SurveySessionToken.DoesNotExist:
            raise ValidationError("Invalid or already used token for this survey")

        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            survey = token_obj.survey
            if survey.end_date and survey.end_date < timezone.now():
                raise ValidationError("This survey has been closed.")

            submission = serializer.save(
                token=token_obj,
                survey=survey
            )

        result = StressCalculationService.calculate_stress(
            survey_id,
            token_value
        )

        return Response(result, status=status.HTTP_201_CREATED)


class StressReportExportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsHODOrFaculty]

    def get(self, request, pk):
        try:
            data = StressCalculationService.get_survey_report_data(pk)
            if not data:
                return Response({"error": "No data found for this survey"}, status=status.HTTP_404_NOT_FOUND)
            
            excel_buffer = StressExcelReportGenerator.generate(data)
            
            filename = f"Stress_Report_{data['survey_info']['month']}_{data['survey_info']['year']}.xlsx"
            response = HttpResponse(
                excel_buffer,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StressReportPreviewView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsHODOrFaculty]

    def get(self, request, pk):
        try:
            data = StressCalculationService.get_survey_report_data(pk)
            if not data:
                return Response({"error": "No data found for this survey"}, status=status.HTTP_404_NOT_FOUND)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StressActionPlanListCreateView(generics.ListCreateAPIView):
    serializer_class = StressActionPlanSerializer
    permission_classes = [IsAuthenticated, IsHOD]

    def get_queryset(self):
        survey_id = self.request.query_params.get('survey_id')
        if survey_id:
            return StressActionPlan.objects.filter(survey_id=survey_id)
        return StressActionPlan.objects.all()

    def perform_create(self, serializer):
        # Implement 'upsert' for (survey, batch)
        survey = serializer.validated_data.get('survey')
        batch = serializer.validated_data.get('batch')
        existing = StressActionPlan.objects.filter(survey=survey, batch=batch).first()
        if existing:
            serializer.instance = existing
        serializer.save()


class StressActionPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StressActionPlan.objects.all()
    serializer_class = StressActionPlanSerializer
    permission_classes = [IsAuthenticated, IsHOD]
