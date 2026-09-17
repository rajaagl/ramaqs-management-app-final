from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent



SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("❌ DJANGO_SECRET_KEY manquante dans .env")


DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

if not DEBUG:
    required_production_settings = ('DJANGO_ALLOWED_HOSTS', 'DJANGO_CORS_ORIGINS', 'FRONTEND_URL', 'DB_PASSWORD')
    missing_production_settings = [name for name in required_production_settings if not os.environ.get(name)]
    if missing_production_settings:
        raise ImproperlyConfigured(
            'Variables de production manquantes : ' + ', '.join(missing_production_settings)
        )

# ✅ Configuration cookies sécurisés
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE   = not DEBUG or os.getenv('COOKIE_SECURE', 'False') == 'True'
SESSION_COOKIE_SAMESITE = os.getenv('COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_HTTPONLY    = False   # Doit être False pour que le frontend puisse le lire
CSRF_COOKIE_SECURE      = not DEBUG or os.getenv('COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SAMESITE    = os.getenv('COOKIE_SAMESITE', 'Lax')
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'same-origin'
SECURE_SSL_REDIRECT = not DEBUG or os.getenv('DJANGO_SECURE_SSL_REDIRECT', 'False') == 'True'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = int(os.getenv('DJANGO_HSTS_SECONDS', '31536000' if not DEBUG else '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
SECURE_HSTS_PRELOAD = False
DATA_UPLOAD_MAX_MEMORY_SIZE = 12 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

ALLOWED_HOSTS = [host.strip() for host in os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if host.strip()]


INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'ramaqs_management_plateforme',
    'django.contrib.staticfiles',
    'drf_yasg',
    'django_filters',
    'channels',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ramaqs_management_app.urls'

#corsheaders settings

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get(
    'DJANGO_CORS_ORIGINS',
    'http://localhost:3000'
).split(',') if origin.strip()]

CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization',
    'content-type', 'dnt', 'origin', 'user-agent',
    'x-csrftoken', 'x-requested-with',
]
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_CREDENTIALS = True

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ramaqs_management_app.wsgi.application'
ASGI_APPLICATION = 'ramaqs_management_app.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/0')],
        },
    }
}


# BASE DE DONNÉES 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'ramaqs_management_app_db'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
AUTH_USER_MODEL = 'ramaqs_management_plateforme.Utilisateur'

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # Rate limiting pour protéger les APIs
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/hour',
        'user': '600/hour',
    },
}


# EMAIL 

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp-relay.brevo.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'RAMAQS Consulting <ne_pas_repondre@ramaqs.com>')
EMAIL_TIMEOUT = 10


# JWT

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    # les cookies HttpOnly
    'AUTH_COOKIE':             'access_token',  
    'AUTH_COOKIE_REFRESH':     'refresh_token',
    'AUTH_COOKIE_SECURE':      os.getenv('COOKIE_SECURE', 'False') == 'True',
    'AUTH_COOKIE_HTTP_ONLY':   True,
    'AUTH_COOKIE_PATH':        '/',
    'AUTH_COOKIE_SAMESITE':    os.getenv('COOKIE_SAMESITE', 'Lax'),
    'AUTH_COOKIE_DOMAIN':      None,
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django.core.mail': {'handlers': ['console'], 'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO')},
        'ramaqs_management_plateforme.services': {'handlers': ['console'], 'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO')},
    },
}


FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')


# WHATSAPP 

WHATSAPP_ENABLED = os.environ.get('WHATSAPP_ENABLED', 'False') == 'True'
GREEN_API_ID_INSTANCE = os.environ.get('GREEN_API_ID_INSTANCE')
GREEN_API_API_TOKEN = os.environ.get('GREEN_API_API_TOKEN')
COUNTRY_CODE = '212'

# Informations de contact 
COMPANY_NAME = 'RAMAQS Consulting'
COMPANY_PHONE = '+212 5 22 22 22 22'
COMPANY_EMAIL = 'contact@ramaqs.ma'

