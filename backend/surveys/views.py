from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import SurveyMaster, SurveyResponse, SurveyAnswer
from .serializer import SurveyMasterSerializer, SurveyResponseSerializer

class SurveyMasterListCreateView(generics.ListCreateAPIView):
    queryset = SurveyMaster.objects.all()
    serializer_class = SurveyMasterSerializer

class SurveyMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SurveyMaster.objects.all()
    serializer_class = SurveyMasterSerializer

class SubmitSurveyResponseView(APIView):
    def post(self, request):
        survey_id = request.data.get('survey_id')
        student_id = request.data.get('student_id')
        answers = request.data.get('answers', []) # List of {question_id: X, answer_value: Y}
        
        survey = get_object_or_404(SurveyMaster, pk=survey_id)
        
        response = SurveyResponse.objects.create(
            survey_id=survey,
            student_id_id=student_id
        )
        
        for ans in answers:
            SurveyAnswer.objects.create(
                response_id=response,
                question_id_id=ans.get('question_id'),
                answer_value=ans.get('answer_value')
            )
            
        return Response({"message": "Survey submitted successfully"}, status=status.HTTP_201_CREATED)
