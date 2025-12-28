from django.contrib import admin
from .models import Assessment, AssessmentCOMapping, MarksEntry

admin.site.register(Assessment)
admin.site.register(AssessmentCOMapping)
admin.site.register(MarksEntry)
