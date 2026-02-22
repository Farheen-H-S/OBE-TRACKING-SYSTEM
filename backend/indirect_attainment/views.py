from rest_framework import generics
from audit.utils import log_action
from .models import CourseIndirectAttainment, ActivityIndirectAttainment
from .serializers import CourseIndirectAttainmentSerializer, ActivityIndirectAttainmentSerializer

class CourseIndirectAttainmentListCreateView(generics.ListCreateAPIView):
    queryset = CourseIndirectAttainment.objects.all()
    serializer_class = CourseIndirectAttainmentSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'CourseIndirectAttainment', instance.attainment_id, new_value=serializer.data)

class ActivityIndirectAttainmentListCreateView(generics.ListCreateAPIView):
    queryset = ActivityIndirectAttainment.objects.all()
    serializer_class = ActivityIndirectAttainmentSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'ActivityIndirectAttainment', instance.activity_id, new_value=serializer.data)
