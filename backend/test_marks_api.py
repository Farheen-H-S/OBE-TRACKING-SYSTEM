import os
import django
import sys
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.http import HttpRequest
from rest_framework.request import Request
from assessments.views import SaveAssessmentMarksView

req = HttpRequest()
req.GET = {'course_id': '3', 'tool_name': 'FA-PR', 'academic_year': '2023-24'}
drf_req = Request(req)
view = SaveAssessmentMarksView()

res = view.get(drf_req)
print('Response Status:', res.status_code)
if res.status_code == 200:
    data = res.data
    if isinstance(data, dict):
        marks = data.get('marks_data', [])
        print('Number of Marks Items:', len(marks))
    else:
        print('Data format:', type(data))
else:
    print('Error:', res.data)
