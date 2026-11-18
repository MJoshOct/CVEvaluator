#!/bin/sh
set -e

echo "Running Django migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Starting Gunicorn..."
exec gunicorn cveval.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers ${GUNICORN_WORKERS:-2} \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
