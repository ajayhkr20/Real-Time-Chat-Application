# Helix Chat — React Frontend

Complete React frontend for the Helix private chat app.

## Quick Start

```bash
# 1. Copy env
cp .env.example .env

# 2. Install
npm install

# 3. Start
npm start
```

Opens at **http://localhost:3000** — make sure the Django backend is running on port 8000.

---

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/register` | `Register.js` | Sign-up form |
| `/login` | `Login.js` | JWT login |
| `/profile` | `Profile.js` | Avatar upload + bio edit |
| `/chat` | `Chat.js` | Conversation list (empty state) |
| `/chat/:id` | `Chat.js` | Active conversation with real-time messages |

---

## Folder Structure

```
src/
├── api/
│   └── index.js         # Axios client + all API calls + token refresh
├── components/
│   └── Avatar.js        # Reusable avatar component
├── context/
│   └── AuthContext.js   # Global auth state (JWT)
├── hooks/
│   └── useWebSocket.js  # Auto-reconnecting WS hook
├── pages/
│   ├── Auth.css         # Shared auth page styles
│   ├── Chat.css         # Main chat UI styles
│   ├── Chat.js          # Main chat page
│   ├── Login.js
│   ├── Profile.css
│   ├── Profile.js
│   ├── Register.js
├── styles/
│   └── global.css       # Design tokens, buttons, inputs, utilities
├── App.js               # Router + protected routes
└── index.js
```

---

## Features

- **Register** with username, email, password
- **Login** with JWT (auto-refresh on 401)
- **Profile setup** — avatar image upload, bio
- **Sidebar** — conversation list with unread badges, online status, search filter
- **Real-time messaging** via WebSocket
- **Typing indicators** — "Alice is typing…"
- **Online/offline status** — live dot updates
- **Read receipts** — ✓ / ✓✓
- **Message grouping** by date (Today / Yesterday / date)
- **Mobile responsive** — slide-out sidebar on small screens

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:8000` | Django API base URL |
| `REACT_APP_WS_URL` | `ws://localhost:8000` | WebSocket base URL |
