from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.generic import TemplateView
from django.views.static import serve
import os

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/users/', include('users.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/cis_master/', include('cis_master.urls')),
    path('api/assessments/', include('assessments.urls')),
    path('api/attainment/', include('attainment.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/stress/', include('stress.urls')),
    path('api/surveys/', include('surveys.urls')),
    path('api/teaching-plan/', include('teaching_plan.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/bulk_upload/', include('bulk_upload.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# ✅ STATIC (React build static files)
urlpatterns += [
    re_path(r'^static/(?P<path>.*)$', serve, {
        'document_root': settings.STATIC_ROOT
    }),
]

# ✅ IMAGES (THIS is the missing piece)
urlpatterns += [
    re_path(r'^images/(?P<path>.*)$', serve, {
        'document_root': os.path.join(settings.FRONTEND_DIR, 'images')
    }),
]

# ✅ ROOT FILES (manifest, logos)
urlpatterns += [
    re_path(r'^(?P<path>manifest\.json)$', serve, {
        'document_root': settings.FRONTEND_DIR
    }),
    re_path(r'^(?P<path>logo.*\.png)$', serve, {
        'document_root': settings.FRONTEND_DIR
    }),
]

# ✅ React catch-all (ALWAYS LAST)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]