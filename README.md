# CodeTogether — Live Coding Workspace

> **Code • Collaborate • Build Together**  
> *A real-time collaborative coding workspace for students, developers and teams.*

CodeTogether lets you write, edit, and run code together in real time. Share ideas, solve problems, and build amazing projects — no matter where you are.

---

## 🌟 Key Features

1. **Real-time Code Editing:** Multiple users can edit the same file simultaneously with conflict-free updates.
2. **File Management:** Organize files and codebases easily with multi-tab support (`App.jsx`, `index.js`, `style.css`).
3. **Live Chat & Voice:** Discuss ideas, share links, and solve problems faster with integrated chat.
4. **User Presence:** See who is online and what file they are actively editing or viewing.
5. **Project Rooms:** Create private or public project rooms (`ASTU_DreamTeam`, `Web Development`, `React Project`, `General Chat`).
6. **Responsive Design:** Optimized experience across desktop, tablet, and mobile devices.

---

## 🛠️ Technology Stack (MERN)

Built strictly with JavaScript:

- **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client
- **Backend:** Node.js, Express.js, Socket.IO Server, Mongoose
- **Database:** MongoDB Atlas
- **Styling:** Tailwind CSS with custom neon accents and dark navy theme

---

## 🏗️ System Architecture

```
[ Client: React + Vite (Vercel) ]
             ▲
             │ WebSocket (Real-time updates)
             │ HTTP / REST (API queries)
             ▼
[ Server: Node.js + Express (Render) ]
             ▲
             │ MongoDB Operations
             ▼
[ Database: MongoDB Atlas ]
```

### Communication Paths
- **Client ↔ Server:** WebSocket connection for bi-directional live code updates and chat messages; HTTP/REST for initial room data and health monitoring.
- **Server ↔ Database:** MongoDB Atlas persists room definitions, chat message history, file versions, and user profiles.

---

## 🚀 Deployment Guide

### 1. Database — MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and configure Network Access (allow access from anywhere `0.0.0.0/0` for cloud deployment).
3. Copy your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/codetogether?retryWrites=true&w=majority`.

### 2. Backend — Render
1. Connect this GitHub repository (`https://github.com/petersisay/CodeTogether.git`) to [Render](https://render.com).
2. Select **Web Service**:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Add Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<your MongoDB Atlas connection string>`
   - `CLIENT_URL`: `<your Vercel frontend URL>`

### 3. Frontend — Vercel
1. Import this repository into [Vercel](https://vercel.com).
2. Configure Project Settings:
   - **Root Directory:** `client` (or use the root `vercel.json`)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variables:
   - `VITE_BACKEND_URL`: `<your deployed Render backend URL, e.g. https://codetogether-api.onrender.com>`

---

## 🔐 Environment Variables Reference

### Backend (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Port the Express server listens on | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

### Frontend (`client/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Backend URL for REST API & WebSockets | `http://localhost:5000` |

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/petersisay/CodeTogether.git
cd CodeTogether

# Install all dependencies (both client and server)
npm run install:all
```

### Running Locally
```bash
# Start backend server (port 5000)
npm run dev:server

# In a separate terminal, start frontend client (port 5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start collaborating!

---

## 🎯 Learning Goals

- Understand real-time systems using WebSockets
- Learn collaboration and conflict resolution
- Build a full MERN stack application
- Practice clean code and Git workflow
- Improve problem-solving and communication
- Create an impressive portfolio project
