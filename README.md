# Helix Chat App

Full-stack private chat application built with **Django + Channels** (backend) and **React** (frontend).

---

## Features
- **Register / Login** with JWT authentication
- **Profile setup** with avatar image upload
- **Private 1-to-1 conversations** — only the two participants can see messages
- **Real-time messaging** via WebSockets (Django Channels)
- **Typing indicators** & **online/offline status**
- **Unread message badges**
- **Responsive** — works on mobile and desktop

---

## Project Structure

```
chat-app/
├── backend/           # Django + Channels API
│   ├── chatproject/   # Project settings, urls, asgi
│   ├── accounts/      # User model, register, login, profile
│   ├── chat/          # Conversations, messages, WebSocket consumer
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/          # React SPA
    ├── public/
    └── src/
        ├── api/           # Axios API calls
        ├── context/       # AuthContext (JWT)
        ├── hooks/         # useWebSocket
        └── pages/
            ├── Register.js
            ├── Login.js
            ├── Profile.js
            └── ChatLayout.js
```

---

## Backend Setup

```bash
cd backend

# 1. Create & activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations
python manage.py makemigrations accounts
python manage.py makemigrations chat
python manage.py migrate

# 4. Create admin user (optional)
python manage.py createsuperuser

# 5. Start server (ASGI via Daphne for WebSocket support)
daphne -p 8000 chatproject.asgi:application

# Or during development without Redis:
python manage.py runserver
```

> The server runs at **http://localhost:8000**

---

## Frontend Setup

```bash
cd frontend

# 1. Copy env file
cp .env.example .env

# 2. Install packages
npm install

# 3. Start dev server
npm start
```

> The app opens at **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | No | Create new account |
| POST | `/api/auth/login/` | No | Get JWT tokens |
| POST | `/api/auth/token/refresh/` | No | Refresh access token |
| GET / PATCH | `/api/auth/profile/` | Yes | View / update profile |
| GET | `/api/auth/users/` | Yes | List users (for new chat) |
| GET | `/api/chat/conversations/` | Yes | My conversations |
| POST | `/api/chat/conversations/start/` | Yes | Start private chat |
| GET | `/api/chat/conversations/{id}/messages/` | Yes | Load messages |

### WebSocket
```
ws://localhost:8000/ws/chat/{conversation_id}/?token=<access_token>
```

**Send:**
```json
{ "type": "message", "content": "Hello!" }
{ "type": "typing", "is_typing": true }
```

**Receive:**
```json
{ "type": "message", "id": 1, "content": "Hello!", "sender_id": 2, "timestamp": "..." }
{ "type": "typing", "username": "alice", "is_typing": true }
{ "type": "status", "user_id": 2, "is_online": true }
```

---

## Production Notes

- Set `SECRET_KEY` in environment variable or `.env` file
- Replace `InMemoryChannelLayer` with **Redis** for multi-worker WebSocket support
- Use **PostgreSQL** instead of SQLite
- Serve media files via Nginx or cloud storage (S3)
- Set `CORS_ALLOWED_ORIGINS` to your frontend domain
- Run Daphne behind **Nginx** as a reverse proxy

### Redis channel layer (production)
```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [('127.0.0.1', 6379)]},
    }
}
```
Add `channels-redis==4.1.0` to requirements.txt.

---

## Privacy Model

- Each conversation has exactly **2 participants**
- All API endpoints verify that the requesting user is a participant
- The WebSocket consumer closes the connection if the user is not a participant
- Messages are **never accessible** to non-participants
