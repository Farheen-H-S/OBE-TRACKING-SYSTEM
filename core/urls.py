from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),
    path('', include('academics.urls')),
    path('', include('assessments.urls')),
    path('', include('cis_master.urls')),
    path('', include('attainment.urls')),
    path('', include('audit.urls')),
]
