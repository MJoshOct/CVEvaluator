from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^health/?$', views.health_check),
    re_path(r'^api/roles/?$', views.get_roles),
    re_path(r'^api/evaluate/upload/?$', views.evaluate_upload),
    re_path(r'^api/evaluate/text/?$', views.evaluate_text),
    re_path(r'^api/history/?$', views.get_history),
    re_path(r'^api/history/(?P<pk>\d+)/?$', views.get_history_detail),
    re_path(r'^api/jd-match/text/?$', views.jd_match_text),
    re_path(r'^api/jd-match/upload/?$', views.jd_match_upload),
    re_path(r'^api/bullet-rewrite/?$', views.bullet_rewrite),
    re_path(r'^api/interview-prep/?$', views.interview_prep),
    re_path(r'^api/?$', views.api_root),
]
