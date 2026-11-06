from rest_framework import serializers
from .models import EvaluationRecord


class RoleInfoSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    core_skills = serializers.ListField(child=serializers.CharField(), default=list)
    frameworks_and_tools = serializers.ListField(child=serializers.CharField(), default=list)
    concepts_and_methodologies = serializers.ListField(child=serializers.CharField(), default=list)
    bonus_skills = serializers.ListField(child=serializers.CharField(), default=list)
    experience_signals = serializers.ListField(child=serializers.CharField(), default=list, required=False)


class LegitimacyDetailsSerializer(serializers.Serializer):
    is_legitimate = serializers.BooleanField()
    score = serializers.FloatField()
    detected_sections = serializers.ListField(child=serializers.CharField(), default=list)
    missing_sections = serializers.ListField(child=serializers.CharField(), default=list)
    has_contact_info = serializers.BooleanField(default=False)
    word_count = serializers.IntegerField(default=0)
    notes = serializers.ListField(child=serializers.CharField(), default=list)


class ATSReportSerializer(serializers.Serializer):
    ats_score = serializers.FloatField()
    ats_grade = serializers.CharField(max_length=20)
    detected_sections = serializers.ListField(child=serializers.CharField(), default=list)
    missing_sections = serializers.ListField(child=serializers.CharField(), default=list)
    formatting_issues = serializers.ListField(child=serializers.CharField(), default=list)
    ats_tips = serializers.ListField(child=serializers.CharField(), default=list)
    weak_phrases_found = serializers.ListField(child=serializers.CharField(), default=list, required=False)
    word_count = serializers.IntegerField(default=0)


class ParsedResumeSerializer(serializers.Serializer):
    name = serializers.CharField(allow_null=True, required=False)
    email = serializers.CharField(allow_null=True, required=False)
    phone = serializers.CharField(allow_null=True, required=False)
    linkedin = serializers.CharField(allow_null=True, required=False)
    github = serializers.CharField(allow_null=True, required=False)
    portfolio = serializers.CharField(allow_null=True, required=False)
    skills = serializers.ListField(child=serializers.CharField(), default=list)
    education = serializers.ListField(child=serializers.DictField(), default=list)
    certifications = serializers.ListField(child=serializers.CharField(), default=list)
    total_experience_years = serializers.FloatField(default=0.0)


class KeywordAnalysisSerializer(serializers.Serializer):
    keyword_score = serializers.FloatField()
    present_keywords = serializers.ListField(child=serializers.CharField(), default=list)
    missing_keywords = serializers.ListField(child=serializers.CharField(), default=list)
    weak_keywords = serializers.ListField(child=serializers.CharField(), default=list)
    suggested_keywords = serializers.ListField(child=serializers.CharField(), default=list)
    weak_phrases = serializers.ListField(child=serializers.CharField(), default=list)


class PredefinedRoleEvaluationSerializer(serializers.Serializer):
    role_id = serializers.CharField()
    role_title = serializers.CharField()
    total_score = serializers.FloatField()
    core_skills_matched = serializers.ListField(child=serializers.CharField(), default=list)
    core_skills_missing = serializers.ListField(child=serializers.CharField(), default=list)
    tools_matched = serializers.ListField(child=serializers.CharField(), default=list)
    tools_missing = serializers.ListField(child=serializers.CharField(), default=list)
    concepts_matched = serializers.ListField(child=serializers.CharField(), default=list)
    concepts_missing = serializers.ListField(child=serializers.CharField(), default=list)
    experience_signals_found = serializers.ListField(child=serializers.CharField(), default=list)
    breakdown_percentages = serializers.DictField(default=dict)


class CareerRecommendationItemSerializer(serializers.Serializer):
    role_id = serializers.CharField()
    role_title = serializers.CharField()
    score = serializers.FloatField()
    fit_level = serializers.CharField()
    top_missing_skills = serializers.ListField(child=serializers.CharField(), default=list)
    top_matched_skills = serializers.ListField(child=serializers.CharField(), default=list)


class AiEvaluationDetailsSerializer(serializers.Serializer):
    status = serializers.CharField()
    error_message = serializers.CharField(allow_null=True, required=False)
    ai_score = serializers.FloatField(allow_null=True, required=False)
    summary = serializers.CharField(allow_null=True, required=False)
    strengths = serializers.ListField(child=serializers.CharField(), default=list)
    weaknesses = serializers.ListField(child=serializers.CharField(), default=list)
    improvement_recommendations = serializers.ListField(child=serializers.CharField(), default=list)
    suggested_project_ideas = serializers.ListField(child=serializers.CharField(), default=list)
    suggested_bullet_rewrites = serializers.ListField(child=serializers.DictField(), default=list)


class EvaluationResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=True, required=False)
    created_at = serializers.DateTimeField(allow_null=True, required=False)
    candidate_name = serializers.CharField(allow_null=True, required=False)
    target_role = serializers.CharField()
    legitimacy = LegitimacyDetailsSerializer()
    ats = ATSReportSerializer(allow_null=True, required=False)
    parsed_resume = ParsedResumeSerializer(allow_null=True, required=False)
    keyword_analysis = KeywordAnalysisSerializer(allow_null=True, required=False)
    predefined_evaluation = PredefinedRoleEvaluationSerializer(allow_null=True, required=False)
    career_recommendations = serializers.ListField(
        child=CareerRecommendationItemSerializer(),
        default=list,
        required=False
    )
    ai_evaluation = AiEvaluationDetailsSerializer(allow_null=True, required=False)


class HistoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationRecord
        fields = [
            'id',
            'created_at',
            'candidate_name',
            'target_role',
            'is_legitimate',
            'ats_score',
            'predefined_score',
            'ai_evaluated',
            'ai_score',
        ]


class JDMatchResponseSerializer(serializers.Serializer):
    compatibility_score = serializers.FloatField()
    matching_requirements = serializers.ListField(child=serializers.CharField(), default=list)
    missing_requirements = serializers.ListField(child=serializers.CharField(), default=list)
    skill_comparison = serializers.ListField(child=serializers.DictField(), default=list)
    recommendations = serializers.ListField(child=serializers.CharField(), default=list)
    summary = serializers.CharField(default="", allow_blank=True)


class BulletRewriteResponseSerializer(serializers.Serializer):
    rewrites = serializers.ListField(child=serializers.DictField(), default=list)


class InterviewPrepResponseSerializer(serializers.Serializer):
    technical_questions = serializers.ListField(child=serializers.DictField(), default=list)
    project_questions = serializers.ListField(child=serializers.DictField(), default=list)
    hr_questions = serializers.ListField(child=serializers.DictField(), default=list)
