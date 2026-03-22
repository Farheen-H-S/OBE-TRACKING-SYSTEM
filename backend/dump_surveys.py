import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from surveys.models import SurveyMaster
with open('d:/Farheen/survey_dump.txt', 'w', encoding='utf-8') as f:
    for s in SurveyMaster.objects.all():
        f.write(f"ID:{s.survey_id} | Cat:{s.survey_category} | Act:{s.activity_type} | Name:{s.survey_name}\n")
