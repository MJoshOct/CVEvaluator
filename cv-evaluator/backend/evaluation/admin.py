from django.contrib import admin
from .models import EvaluationRecord


@admin.register(EvaluationRecord)
class EvaluationRecordAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'candidate_name',
        'target_role',
        'user',
        'is_legitimate',
        'ats_score',
        'ats_grade',
        'predefined_score',
        'ai_score',
        'created_at',
    )
    list_filter = (
        'is_legitimate',
        'target_role',
        'ai_evaluated',
        'ats_grade',
        'created_at',
    )
    search_fields = (
        'candidate_name',
        'target_role',
        'parsed_email',
        'parsed_name',
        'raw_text_snippet',
    )
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    fieldsets = (
        ('Overview', {
            'fields': ('candidate_name', 'target_role', 'user', 'status', 'created_at')
        }),
        ('Legitimacy & ATS', {
            'fields': (
                'is_legitimate',
                'legitimacy_score',
                'legitimacy_reasons',
                'ats_score',
                'ats_grade',
                'ats_formatting_issues',
                'ats_tips',
            )
        }),
        ('Parsed Resume Info', {
            'fields': ('parsed_name', 'parsed_email', 'parsed_skills')
        }),
        ('Role Match & Keywords', {
            'fields': (
                'predefined_score',
                'keyword_score',
                'matched_skills',
                'missing_skills',
                'rubric_breakdown',
                'career_recommendations',
            )
        }),
        ('AI Review', {
            'fields': (
                'ai_evaluated',
                'ai_score',
                'ai_summary',
                'ai_strengths',
                'ai_weaknesses',
                'ai_improvement_tips',
            )
        }),
        ('Raw Snippet', {
            'classes': ('collapse',),
            'fields': ('raw_text_snippet',)
        }),
    )
