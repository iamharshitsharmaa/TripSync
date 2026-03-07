# ✈️ TripSync — Collaborative Trip Planner

> Plan trips together. AI-powered itineraries, real-time collaboration, smart expense splits, group chat and live presence — all in one place.

![TripSync](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80)

---

## 🌐 Live Demo

- **Frontend:** [tripsync.vercel.app]([https://trip-sync-sigma.vercel.app])
- **Backend API:** [tripsync-backend-production.up.railway.app](https://tripsync-backend-production.up.railway.app/api/health)

---

## 📖 About

TripSync is a full-stack MERN application that lets friend groups plan trips together in real time. Instead of juggling WhatsApp threads, Google Sheets, and scattered booking confirmations, TripSync brings everything into one collaborative dashboard — powered by AI.

---

## ✨ Features

### 🤖 TripSync AI
- Describe your trip in plain language — AI builds the full itinerary instantly
- Smart expense splitting across members
- Budget optimization suggestions
- Powered by Groq (Llama 3.3 70B)

### 🗓️ Itinerary Builder
- Drag-and-drop activities across days
- Set times, locations, costs per activity
- Every change syncs live to all members via Socket.io

### 👥 Collaboration
- Invite members by 6-character code or email
- Role-based access: Owner / Editor / Viewer
- Live presence indicators — see who's online right now

### 💬 Real-time Group Chat
- Built-in chat per trip
- Typing indicators
- Full message history
- Real-time delivery via Socket.io

### 💰 Budget Tracker
- Set a trip budget limit
- Log expenses by category
- AI-powered expense splitting
- Per-person spend breakdown with visual charts

### ✅ Packing Checklists
- Create and assign checklist items to members
- Everyone tracks their own progress
- No more duplicate packing

### 🏨 Stays & Flights
- Attach flight details, hotel confirmations, transfers
- All reservations accessible by every member

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Socket.io Client | Real-time features |
| Zustand | State management |
| React Router v6 | Routing |
| Axios | HTTP client |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | Server |
| MongoDB + Mongoose | Database |
| Socket.io | Real-time communication |
| JWT (access + refresh) | Authentication |
| Groq SDK | AI (Llama 3.3 70B) |
| Cloudinary | Image uploads |
| Redis | Session / caching |
| Nodemailer | Email invites |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Railway | Backend hosting |
| MongoDB Atlas | Database hosting |
| Cloudinary | CDN for images |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Cloudinary account

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/tripsync.git
cd tripsync
```

### 2. Setup the Backend

```bash
cd Backend
npm install
```

Create a `.env` file in `/Backend`:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Start the backend:

```bash
npm run dev
```

### 3. Setup the Frontend

```bash
cd ../Frontend
npm install
```

Create a `.env` file in `/Frontend`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## 📁 Project Structure

```
tripsync/
├── Frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level pages
│   │   ├── store/            # Zustand stores
│   │   ├── hooks/            # Custom hooks (useSocket, usePresence)
│   │   └── utils/            # Axios instance, helpers
│   ├── public/
│   ├── index.html
│   └── vite.config.js
│
└── Backend/
    └── src/
        ├── controllers/      # Route handlers
        ├── middleware/        # verifyJWT, requireTripAccess
        ├── models/           # Mongoose models
        ├── routes/           # Express routers
        ├── services/         # Email service
        ├── utils/            # ApiError, ApiResponse, asyncHandler
        ├── socket.js         # Socket.io logic
        └── index.js          # Entry point
```

---

## 🔐 Authentication

TripSync uses a dual-token JWT strategy:

- **Access token** — short-lived, sent in `Authorization` header
- **Refresh token** — 30-day expiry, stored in `httpOnly` cookie
- Tokens refresh silently in the background via axios interceptors
- Google OAuth supported

---

## 🌍 Deployment

### Backend → Railway
1. Push your repo to GitHub
2. Create a new Railway project → connect your repo
3. Set all environment variables in Railway dashboard
4. Set health check path to `/api/health`
5. Deploy

### Frontend → Vercel
1. Connect your repo to Vercel
2. Set `VITE_API_URL` to your Railway backend URL + `/api`
3. Deploy

---

## 📡 API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| GET | `/api/trips` | ✅ | Get all user trips |
| POST | `/api/trips` | ✅ | Create a trip |
| GET | `/api/trips/:id` | ✅ | Get trip details |
| POST | `/api/join` | ✅ | Join trip by code |
| POST | `/api/ai/plan` | ✅ | AI trip planning |
| GET | `/api/health` | ❌ | Health check |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

[Harshit](https://github.com/iamharshitsharmaa)

---

<div align="center">
  Built with ❤️ for travelers everywhere
  <br/>
  <a href="https://tripsync.vercel.app">Live Demo</a> · <a href="https://github.com/yourusername/tripsync/issues">Report Bug</a> · <a href="https://github.com/yourusername/tripsync/issues">Request Feature</a>
</div>
