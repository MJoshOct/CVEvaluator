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


# ==============================================================================
# System API Key & Dynamic OAuth Database Models
# ==============================================================================

class SystemApiKey(models.Model):
    """
    Stores third-party AI API keys (Groq, Gemini, OpenAI) in an encrypted pool.
    
    Why this exists:
    - Allows administrators to plug in multiple Groq or Gemini API keys.
    - If one key hits a rate limit (HTTP 429), the backend automatically rotates
      to the next active key ordered by lowest failure count.
    - Keys are encrypted at rest; raw keys are never stored in plain text.
    """
    PROVIDER_CHOICES = [
        ('groq', 'Groq'),
        ('gemini', 'Google Gemini'),
        ('openai', 'OpenAI'),
    ]
    # AI service provider name ('groq', 'gemini', or 'openai')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='groq', db_index=True)
    
    # Friendly display name for the admin (e.g. 'Primary Groq Account', 'Backup Key')
    label = models.CharField(max_length=100, default='Default Key')
    
    # Encrypted secret payload (encrypted via HMAC-SHA256 cipher in crypto_utils.py)
    key_encrypted = models.TextField(help_text='Encrypted API key payload')
    
    # Prefix (e.g., 'gsk_') and suffix for displaying masked previews in the dashboard
    key_prefix = models.CharField(max_length=10, blank=True)
    key_suffix = models.CharField(max_length=10, blank=True)
    
    # Toggle switch: allows admins to disable a key without deleting it
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Tracks rate limit / quota errors to automatically prioritize healthy keys
    failure_count = models.IntegerField(default=0)
    
    # Timestamp tracking
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['failure_count', '-created_at']

    def get_decrypted_key(self) -> str:
        """Decrypts and returns the raw API key for making backend LLM calls."""
        from .services.crypto_utils import decrypt_secret
        return decrypt_secret(self.key_encrypted)

    def get_masked_key(self) -> str:
        """Returns a masked representation (e.g. 'gsk_************3aB9') for safe UI display."""
        from .services.crypto_utils import mask_secret
        decrypted = self.get_decrypted_key()
        return mask_secret(decrypted)


class SystemOAuthConfig(models.Model):
    """
    Stores Google OAuth 2.0 configuration dynamically in the database.
    
    Why this exists:
    - Allows administrators to configure Google Sign-In credentials through
      the Admin Dashboard without editing server .env files or restarting containers.
    - Client Secret is stored encrypted; Client ID is public for frontend discovery.
    """
    # Provider identity (defaults to 'google')
    provider = models.CharField(max_length=20, default='google', unique=True)
    
    # Public Google OAuth Client ID (sent to frontend to initialize Google Sign-In)
    client_id = models.CharField(max_length=255, blank=True, default='')
    
    # Encrypted Google OAuth Client Secret (kept strictly on server for token verification)
    client_secret_encrypted = models.TextField(blank=True, default='')
    client_secret_suffix = models.CharField(max_length=10, blank=True, default='')
    
    # Toggle to enable/disable OAuth sign-in globally
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_decrypted_secret(self) -> str:
        """Decrypts and returns the raw Client Secret for Google token verification."""
        if not self.client_secret_encrypted:
            return ""
        from .services.crypto_utils import decrypt_secret
        return decrypt_secret(self.client_secret_encrypted)

    def get_masked_secret(self) -> str:
        """Returns a masked secret (e.g. '************X9T') for safe UI display."""
        if not self.client_secret_encrypted:
            return ""
        from .services.crypto_utils import mask_secret
        decrypted = self.get_decrypted_secret()
        return mask_secret(decrypted)

