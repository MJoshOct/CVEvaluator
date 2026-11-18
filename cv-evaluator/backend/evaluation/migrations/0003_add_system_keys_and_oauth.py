from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('evaluation', '0002_add_user_and_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemApiKey',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(choices=[('groq', 'Groq'), ('gemini', 'Google Gemini'), ('openai', 'OpenAI')], db_index=True, default='groq', max_length=20)),
                ('label', models.CharField(default='Default Key', max_length=100)),
                ('key_encrypted', models.TextField(help_text='Encrypted API key payload')),
                ('key_prefix', models.CharField(blank=True, max_length=10)),
                ('key_suffix', models.CharField(blank=True, max_length=10)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('failure_count', models.IntegerField(default=0)),
                ('last_used_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['failure_count', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SystemOAuthConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(default='google', max_length=20, unique=True)),
                ('client_id', models.CharField(blank=True, default='', max_length=255)),
                ('client_secret_encrypted', models.TextField(blank=True, default='')),
                ('client_secret_suffix', models.CharField(blank=True, default='', max_length=10)),
                ('is_active', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
