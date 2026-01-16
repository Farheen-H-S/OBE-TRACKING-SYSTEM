from rest_framework import generics
from .models import CourseIndirectAttainment, ActivityIndirectAttainment
from .serializers import CourseIndirectAttainmentSerializer, ActivityIndirectAttainmentSerializer

class CourseIndirectAttainmentListCreateView(generics.ListCreateAPIView):
    queryset = CourseIndirectAttainment.objects.all()
    serializer_class = CourseIndirectAttainmentSerializer

class ActivityIndirectAttainmentListCreateView(generics.ListCreateAPIView):
    queryset = ActivityIndirectAttainment.objects.all()
    serializer_class = ActivityIndirectAttainmentSerializer
