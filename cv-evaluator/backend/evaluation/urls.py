from django.urls import re_path
from . import views
from . import auth_views

urlpatterns = [
    re_path(r'^health/?$', views.health_check),
    re_path(r'^api/auth/login/?$', auth_views.api_auth_login),
    re_path(r'^api/auth/register/?$', auth_views.api_auth_register),
    re_path(r'^api/auth/me/?$', auth_views.api_auth_me),
    re_path(r'^api/auth/logout/?$', auth_views.api_auth_logout),
    re_path(r'^api/auth/google/?$', auth_views.api_auth_google),
    re_path(r'^api/auth/update-username/?$', auth_views.api_auth_update_username),
    re_path(r'^api/auth/users/?$', auth_views.api_auth_list_users),
    re_path(r'^api/auth/users/(?P<user_id>\d+)/role/?$', auth_views.api_auth_set_user_role),
    re_path(r'^api/auth/reset-users/?$', auth_views.api_auth_reset_users),

    # System API Keys & Dynamic OAuth Admin Endpoints
    re_path(r'^api/admin/system-keys/?$', auth_views.api_admin_list_keys),
    re_path(r'^api/admin/system-keys/add/?$', auth_views.api_admin_add_key),
    re_path(r'^api/admin/system-keys/(?P<key_id>\d+)/?$', auth_views.api_admin_delete_key),
    re_path(r'^api/admin/system-keys/(?P<key_id>\d+)/toggle/?$', auth_views.api_admin_toggle_key),
    re_path(r'^api/admin/oauth-config/?$', auth_views.api_admin_oauth_config),
    re_path(r'^api/auth/oauth-config/?$', auth_views.api_auth_public_oauth_config),

    re_path(r'^api/roles/?$', views.get_roles),
    re_path(r'^api/evaluate/upload/?$', views.evaluate_upload),
    re_path(r'^api/evaluate/text/?$', views.evaluate_text),
    re_path(r'^api/history/?$', views.get_history),
    re_path(r'^api/history/(?P<pk>\d+)/?$', views.get_history_detail),
    re_path(r'^api/dashboard/stats/?$', views.dashboard_stats),
    re_path(r'^api/jd-match/text/?$', views.jd_match_text),
    re_path(r'^api/jd-match/upload/?$', views.jd_match_upload),
    re_path(r'^api/bullet-rewrite/?$', views.bullet_rewrite),
    re_path(r'^api/(?:tools/)?interview-prep/?$', views.interview_prep),
    re_path(r'^api/check-models/?$', views.check_models),
    re_path(r'^api/?$', views.api_root),
]
