from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('evaluation', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='evaluationrecord',
            name='user',
            field=models.ForeignKey(
                blank=True,
                help_text='User profile linked to this evaluation for user dashboards',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='evaluations',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='evaluationrecord',
            name='status',
            field=models.CharField(default='completed', max_length=20),
        ),
    ]
