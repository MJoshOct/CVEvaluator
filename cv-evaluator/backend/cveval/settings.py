import os
import urllib.parse
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-cveval-dev-key-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes', 't')

# Production security settings (only applied when DEBUG=False)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = False  # Railway handles SSL termination
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_TRUSTED_ORIGINS = [
        o.strip() for o in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()
    ]

ALLOWED_HOSTS_ENV = os.environ.get('ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [h.strip() for h in ALLOWED_HOSTS_ENV.split(',') if h.strip()] or ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'evaluation',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cveval.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'frontend_dist'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cveval.wsgi.application'

CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL', 'False').lower() in ('true', '1')
CORS_ALLOWED_ORIGINS_ENV = os.environ.get('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = [o.strip() for o in CORS_ALLOWED_ORIGINS_ENV.split(',') if o.strip()]

# Database: PostgreSQL parsed from DATABASE_URL env var
database_url = os.environ.get(
    'DATABASE_URL',
    'postgresql://cveval_user:cveval_pass@db:5432/cveval_db'
)

parsed_db = urllib.parse.urlparse(database_url)
db_name = parsed_db.path.lstrip('/') if parsed_db.path else 'cveval_db'
db_user = urllib.parse.unquote(parsed_db.username or 'cveval_user')
db_password = urllib.parse.unquote(parsed_db.password or 'cveval_pass')
raw_host = parsed_db.hostname
db_host = 'db' if (not raw_host or raw_host == 'cv_evaluator_db') else raw_host
db_port = parsed_db.port or 5432

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_name,
        'USER': db_user,
        'PASSWORD': db_password,
        'HOST': db_host,
        'PORT': db_port,
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# React build output — Django will serve these as static files at the root
WHITENOISE_ROOT = BASE_DIR / 'frontend_dist'
WHITENOISE_INDEX_FILE = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

APPEND_SLASH = False

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
}

AI_API_KEY = os.environ.get('AI_API_KEY', '')
AI_PROVIDER = os.environ.get('AI_PROVIDER', 'groq')
AI_MODEL = os.environ.get('AI_MODEL', 'llama-3.1-8b-instant')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get(
    'GOOGLE_CLIENT_ID',
    'Google_AUTh_key'
)
GOOGLE_CLIENT_SECRET = os.environ.get(
    'GOOGLE_CLIENT_SECRET',
    'Auth_secret'
)
GOOGLE_ADMIN_EMAILS = [
    e.strip().lower()
    for e in os.environ.get(
        'GOOGLE_ADMIN_EMAILS',
        'admin@cvevaluator.local'
    ).split(',')
    if e.strip()
]

