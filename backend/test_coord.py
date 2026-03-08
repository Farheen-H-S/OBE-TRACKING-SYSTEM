import os
import sys
import traceback
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from users.coordinator_dashboard_views import CoordinatorDashboardAPIView
from users.models import User

req = APIRequestFactory().get('/api/users/coordinator-dashboard/')
user = User.objects.filter(role_id__role_name='Coordinator').first()
if not user:
    user = User.objects.first()

force_authenticate(req, user=user)

try:
    response = CoordinatorDashboardAPIView().as_view()(req)
    print('Status:', response.status_code)
except Exception as e:
    traceback.print_exc()
