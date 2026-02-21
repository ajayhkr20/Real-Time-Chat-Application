Django Real-Time Private Chat App

A Django-based Chat Application with real-time one-to-one messaging, user authentication, and read receipts. Users can register, log in, and chat privately with other users.

Features

User registration and login

Private one-to-one chat

Real-time messaging using WebSockets (via Django Channels)

Read receipts:

✓ for sent

✓✓ for read

Online/offline status indicators

Test Credentials
Role	Email	Password
Test User	ajay@gmail.com
	Ajay@1234
Test User	test@gmail.com
	Test@1234
superuser	demo@gmail.com
	Demo@123
Admin	admin@gmail.com
	Admin@123
  
Prerequisites

Before setting up the project, ensure you have:

Python 3.10

pip (Python package manager)

virtualenv (recommended)

Redis (for production-like WebSocket handling)

Setup & Installation

Clone the repository

git clone https://github.com/ajayhkr20/Real-Time-Chat-Application.git
  
cd Real-Time-Individual-Chat-Application

Create and activate a virtual environment

python -m venv .env
# On Windows
.env\Scripts\activate

# On macOS/Linux
source .env/bin/activate

Apply migrations

python manage.py makemigartions
python manage.py migrate

Collect static files

python manage.py collectstatic
pip install django
pip install channels
pip install daphne
pip install whitenoise

Running the Project
1. Development Server (HTTP)
python manage.py runserver
Visit http://127.0.0.1:8000
 in your browser.

2. WebSocket Server (Using Daphne)
For a production-like WebSocket setup:

# Ensure Redis is running
daphne chat_app.asgi:application

Default address: http://127.0.0.1:8000
