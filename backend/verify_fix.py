import os
import django
import json
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from academics.models import Course
from assessments.models import Assessment

c = Course.objects.get(pk=3)
out = ""
out += "Configured Tools:\n"
if c.assessment_tools:
    for k, v in c.assessment_tools.items():
        out += f" - {k}: max={v.get('maxMarks')}\n"
else:
    out += "None\n"

out += "\nExisting Assessments for Course 3:\n"
for a in Assessment.objects.filter(course_id=3).order_by('assessment_name'):
    out += f" - PK: {a.pk}, Name: '{a.assessment_name}', Type: '{a.assessment_type}', Max: {a.max_marks}\n"

with open("debug_output_utf8.txt", "w", encoding="utf-8") as f:
    f.write(out)
