#!/bin/bash
echo "🚀 Setting up Django backend..."
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations accounts
python manage.py makemigrations chat
python manage.py migrate
echo "✅ Done! Run: daphne -p 8000 chatproject.asgi:application"
