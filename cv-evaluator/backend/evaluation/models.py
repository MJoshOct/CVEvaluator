from django.conf import settings
from django.db import models
from django.db.models import Avg, Count


class EvaluationRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluations',
        help_text='User profile linked to this evaluation for user dashboards'
    )
    status = models.CharField(max_length=20, default='completed')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    candidate_name = models.CharField(max_length=255, null=True, blank=True)
    target_role = models.CharField(max_length=100)

    # Legitimacy
    is_legitimate = models.BooleanField(default=False)
    legitimacy_score = models.FloatField(default=0.0)
    legitimacy_reasons = models.JSONField(default=list)

    # ATS
    ats_score = models.FloatField(null=True, blank=True)
    ats_grade = models.CharField(max_length=20, null=True, blank=True)
    ats_formatting_issues = models.JSONField(default=list)
    ats_tips = models.JSONField(default=list)

    # Parsed resume
    parsed_name = models.CharField(max_length=255, null=True, blank=True)
    parsed_email = models.CharField(max_length=255, null=True, blank=True)
    parsed_skills = models.JSONField(default=list)

    # Role matching (predefined)
    predefined_score = models.FloatField(default=0.0)
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    rubric_breakdown = models.JSONField(default=dict)

    # Keyword analysis
    keyword_score = models.FloatField(null=True, blank=True)

    # Career recommendations (auto-run against all roles)
    career_recommendations = models.JSONField(default=list)

    # AI evaluation
    ai_evaluated = models.BooleanField(default=False)
    ai_score = models.FloatField(null=True, blank=True)
    ai_summary = models.TextField(null=True, blank=True)
    ai_strengths = models.JSONField(default=list)
    ai_weaknesses = models.JSONField(default=list)
    ai_improvement_tips = models.JSONField(default=list)

    raw_text_snippet = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        created_str = self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else ''
        return f"{self.candidate_name or 'Candidate'} - {self.target_role} ({created_str})"

    @classmethod
    def get_dashboard_stats(cls, user=None):
        """
        Aggregates metrics for both admin and user dashboard integration.
        If `user` is provided, filters statistics specific to that user.
        """
        qs = cls.objects.all()
        if user and user.is_authenticated:
            qs = qs.filter(user=user)

        total_count = qs.count()
        if total_count == 0:
            return {
                "total_evaluations": 0,
                "legitimate_count": 0,
                "legitimate_rate": 0.0,
                "avg_ats_score": 0.0,
                "avg_predefined_score": 0.0,
                "avg_ai_score": 0.0,
                "role_breakdown": {},
                "recent_evaluations": [],
            }

        legitimate_count = qs.filter(is_legitimate=True).count()
        legitimate_rate = round((legitimate_count / total_count) * 100, 1)

        ats_avg = qs.filter(ats_score__isnull=False).aggregate(Avg('ats_score'))['ats_score__avg'] or 0.0
        predefined_avg = qs.aggregate(Avg('predefined_score'))['predefined_score__avg'] or 0.0
        ai_avg = qs.filter(ai_score__isnull=False).aggregate(Avg('ai_score'))['ai_score__avg'] or 0.0

        role_counts = (
            qs.values('target_role')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        role_breakdown = {item['target_role']: item['count'] for item in role_counts}

        recent = qs.values(
            'id', 'created_at', 'candidate_name', 'target_role',
            'is_legitimate', 'ats_score', 'ats_grade', 'predefined_score', 'ai_score'
        )[:10]

        return {
            "total_evaluations": total_count,
            "legitimate_count": legitimate_count,
            "legitimate_rate": legitimate_rate,
            "avg_ats_score": round(ats_avg, 1),
            "avg_predefined_score": round(predefined_avg, 1),
            "avg_ai_score": round(ai_avg, 1),
            "role_breakdown": role_breakdown,
            "recent_evaluations": list(recent),
        }
