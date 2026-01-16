from rest_framework import generics
from .models import StressMaster, StressResponse, SurveySessionToken
from .serializer import StressMasterSerializer, StressResponseSerializer, SurveySessionTokenSerializer

class StressMasterListCreateView(generics.ListCreateAPIView):
    queryset = StressMaster.objects.all()
    serializer_class = StressMasterSerializer

class StressMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StressMaster.objects.all()
    serializer_class = StressMasterSerializer

class StressResponseCreateView(generics.CreateAPIView):
    queryset = StressResponse.objects.all()
    serializer_class = StressResponseSerializer

class SurveySessionTokenCreateView(generics.CreateAPIView):
    queryset = SurveySessionToken.objects.all()
    serializer_class = SurveySessionTokenSerializer
