from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import (
    Program,
    Scheme,
    AcademicBatch,
    Course,
    CourseOutcome,
    ProgramOutcome,
    ProgramSpecificOutcome,
    COPOMap,
    COPSOMapping,
)

admin.site.register(Program)
admin.site.register(Scheme)
admin.site.register(AcademicBatch)
admin.site.register(Course)
admin.site.register(CourseOutcome)
admin.site.register(ProgramOutcome)
admin.site.register(ProgramSpecificOutcome)
admin.site.register(COPOMap)
admin.site.register(COPSOMapping)

