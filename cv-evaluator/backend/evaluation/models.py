from django.db import models


class EvaluationRecord(models.Model):
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
