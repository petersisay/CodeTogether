# CodeTogether — Real-Time Collaborative Coding, Voice & Video Workspace

> **Code • Collaborate • Build Together**  
> *A full-stack collaborative programming workspace where developers write code, communicate via real-time text, voice, and video, and manage projects from a single unified application.*

---

## 🌟 Core Features

1. **Real-Time Code Collaboration:** Multi-user live code editing with file version sequencing, active cursor indicators, and conflict detection.
2. **Dedicated Voice & Video Meetings:** Native WebRTC peer-to-peer voice and video calls (`/meeting/:meetingId`) with microphone mute/unmute, camera on/off, real-time speaking indicators, and participant connection state.
3. **Camera-Independent Audio Calls:** Dedicated voice-only mode that functions seamlessly without requesting video camera permissions.
4. **Project Rooms & File Management:** Multi-tab file organization (`App.jsx`, `index.js`, `style.css`), file creation, saving, and deletion with authorized access control.
5. **Real-Time Deduplicated Text Chat:** Instant messaging synchronized through authenticated WebSockets directly to MongoDB without duplicate records.
6. **Presence & Activity Tracking:** Live collaborator avatars showing who is online and which file/line they are editing.
7. **Secure JWT Authentication & Authorization:** Token-based authentication verifying all room mutations, file updates, and WebSocket connections with no client-side impersonation.

---

## 🛠️ Technology Stack (MERN + WebRTC)

Built strictly with JavaScript and JSX:

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client, WebRTC Native Media APIs
- **Backend:** Node.js, Express.js, Socket.IO Server, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`
- **Database:** MongoDB Atlas
- **Testing:** Node.js native test runner (`node:test`, `node:assert`)
- **Deployment:** Vercel (Frontend SPA with rewrites), Render (Backend Express & Socket.IO server)

---

## 🏗️ System Architecture

```
[ Client: React + Vite (Vercel) ] ◄═══════════════► [ Peer Client: React ]
             ▲                          (Direct WebRTC Audio/Video Mesh)
             │ WebSocket (Signaling, Live Sync, Chat)
             │ HTTP / REST (Auth, Health, Room Data)
             ▼
[ Server: Node.js + Express + Socket.IO (Render) ]
             ▲
             │ MongoDB Wire Protocol
             ▼
[ Database: MongoDB Atlas ]
```

### Communication Flow:
- **WebRTC Media Stream:** Audio and video streams flow directly peer-to-peer between participant browsers. Media is never routed through Socket.IO or stored in MongoDB.
- **Socket.IO Signaling:** Acts as the WebRTC signaling gateway for exchanging SDP offers, answers, ICE candidates, and mute/speaking status between authenticated peers.
- **Code Synchronization:** Synchronizes code changes with version tracking and collision notifications to prevent blind overwrites.
- **REST Endpoints:** Handles registration, login, and initial resource hydration with JWT bearer token verification.

---

## 📞 WebRTC Voice & Video Architecture

### Call Types Supported
- **One-to-One Calls:** Direct peer-to-peer connection with high-definition audio and video.
- **Small-Group Mesh Calls:** Connects up to 4–6 participants simultaneously in a full-mesh topology (one `RTCPeerConnection` per remote peer).

### STUN and TURN Configuration
- **STUN (Free):** Uses Google Public STUN servers (`stun:stun.l.google.com:19302`) by default for NAT traversal, suitable for standard home and university networks.
- **TURN (Optional):** In restrictive corporate, university, or cellular networks with symmetric NATs, a TURN relay server can be configured via environment variables (`TURN_SERVER`, `TURN_USERNAME`, `TURN_CREDENTIAL`).
- **Production Cost Note:** Free STUN handles initial testing and direct peer traversal at zero cost. Production TURN servers (e.g. Twilio Network Traversal, Metered, or Coturn on a VPS) relay media packets when direct P2P fails, introducing bandwidth-based operational costs (typically $0.0004–$0.001 per gigabyte).

---

## 🔐 Security & Reliability Improvements

1. **Socket.IO Handshake Authentication:** Sockets verify JWT tokens on connection. Unauthenticated sockets cannot join rooms or edit code.
2. **Identity Derivation:** Sender identity and avatar are strictly derived from verified JWT tokens on the server, eliminating client-side impersonation.
3. **Protected Mutating Endpoints:** Room creation, file creation, updates, and deletion require valid `Authorization: Bearer <token>` headers.
4. **Strict CORS Policy:** Origin validation restricts access to explicit whitelist origins (`localhost`, `127.0.0.1`, and production domain).
5. **No Duplicate Chat Messages:** Single-dispatch persistence through authenticated socket events prevents duplicated records caused by concurrent HTTP and WebSocket writes.
6. **Production Fail-Safe:** Server fails safely if `JWT_SECRET` is missing in production mode rather than falling back to insecure defaults.
7. **Database Reliability:** Explicit HTTP status codes (400, 401, 403, 409, 500, 503) are returned instead of silently masking database errors with in-memory storage.

---

## 🧪 Automated Test Suite

CodeTogether includes 19 comprehensive unit and integration tests covering authentication, route authorization, socket permissions, code collision detection, and WebRTC signaling.

To run the complete test suite:

```bash
# Run backend tests
npm test --prefix server

# Run client build verification
npm run build --prefix client

# Or run all tests from the root directory
npm test
```

### Verified Test Cases:
- Token generation and verification
- Invalid and tampered token rejection
- Room listing and unauthenticated access rejection (401)
- Authenticated room and file CRUD operations
- Unauthenticated socket rejection on `room:join`
- Authenticated socket presence broadcasting
- Real-time code change broadcasting with version sequence
- Meeting join and participant discovery
- WebRTC SDP offer and answer forwarding
- WebRTC ICE candidate routing
- Media status toggling (mic, camera, speaking indicators)
- Participant departure and socket cleanup

---

## 🚀 Deployment Guide

### 1. Database — MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Configure database user credentials and allow access from `0.0.0.0/0`.
3. Set your connection string in backend environment variables.

### 2. Backend — Render
1. Connect repository `https://github.com/petersisay/CodeTogether.git` to Render as a Web Service.
2. Configure settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<your_mongodb_atlas_uri>`
   - `JWT_SECRET`: `<minimum_32_character_secret>`
   - `CLIENT_URL`: `<your_vercel_frontend_url>`

### 3. Frontend — Vercel
1. Import the repository into Vercel.
2. Build Settings:
   - **Root Directory:** `client` (or use root `vercel.json`)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment Variables:
   - `VITE_BACKEND_URL`: `<your_render_backend_url>`
4. Direct routes (like `/meeting/:meetingId`) are automatically rewritten to `/index.html` via `vercel.json` for seamless SPA routing and page refreshes.

---

## 💻 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/petersisay/CodeTogether.git
cd CodeTogether

# Install all dependencies
npm run install:all

# Start backend server (port 5000)
npm run dev:server

# Start frontend development server (port 5173)
npm run dev:client
```

Open `http://localhost:5173` in your browser.
