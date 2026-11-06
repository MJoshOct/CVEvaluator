#!/bin/sh
set -e
echo "Running Django migrations..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput
echo "Starting Gunicorn..."
exec gunicorn cveval.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
