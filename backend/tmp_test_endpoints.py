import os
import django
import json
from django.test import RequestFactory
from rest_framework.test import APIRequestFactory, force_authenticate

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from academics.views import ProgramListCreateAPIView, SchemeListAPIView, BatchListAPIView, AcademicSetupAPIView
from users.models import User

def test_view(view_class, name):
    print(f"Testing {name}...")
    factory = APIRequestFactory()
    view = view_class.as_view()
    
    # Use a real user for authentication
    user = User.objects.first()
    if not user:
        print(f"  {name}: Error - No user found for authentication")
        return

    request = factory.get('/')
    force_authenticate(request, user=user)
    
    try:
        response = view(request)
        print(f"  {name}: Status {response.status_code}")
        if response.status_code != 200:
            print(f"  {name}: Data {response.data}")
    except Exception as e:
        print(f"  {name}: Exception: {str(e)}")
        import traceback
        traceback.print_exc()

test_view(ProgramListCreateAPIView, "Programs")
test_view(SchemeListAPIView, "Schemes")
test_view(BatchListAPIView, "Batches")
test_view(AcademicSetupAPIView, "AcademicSetup")
