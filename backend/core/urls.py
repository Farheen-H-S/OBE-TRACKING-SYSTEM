from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/cis_master/', include('cis_master.urls')),
    path('api/assessments/', include('assessments.urls')),
    # path('api/indirect_attainment/', include('indirect_attainment.urls')),
    path('api/attainment/', include('attainment.urls')),
    # path('api/reports/', include('reports.urls')),
    # path('api/stress/', include('stress.urls')),
    # path('api/surveys/', include('surveys.urls')),
    # path('api/teaching_plan/', include('teaching_plan.urls')),
    path('api/audit/', include('audit.urls')),
]
