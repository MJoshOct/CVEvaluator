import os
from pathlib import Path
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('evaluation.urls')),
]

# In production, serve the React SPA for any unmatched route
# WhiteNoise handles static assets; this catches React Router client-side routes
if not settings.DEBUG or os.environ.get('SERVE_SPA', ''):
    frontend_dist = Path(settings.BASE_DIR) / 'frontend_dist'
    if frontend_dist.exists():
        urlpatterns += [
            path('', TemplateView.as_view(
                template_name='index.html',
                content_type='text/html'
            )),
        ]
