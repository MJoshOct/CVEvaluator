from django.contrib import admin
from .models import EvaluationRecord


@admin.register(EvaluationRecord)
class EvaluationRecordAdmin(admin.ModelAdmin):
    list_display = (
        'candidate_name',
        'target_role',
        'is_legitimate',
        'ats_score',
        'predefined_score',
        'ai_score',
        'created_at',
    )
    list_filter = ('is_legitimate', 'target_role', 'ai_evaluated')
    search_fields = ('candidate_name', 'target_role', 'parsed_email', 'parsed_name')
    readonly_fields = ('created_at',)
