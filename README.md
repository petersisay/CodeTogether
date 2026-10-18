# CodeTogether — Real-Time Collaborative Coding, Voice & Video Workspace

> **Code • Collaborate • Build Together**  
> *A full-stack collaborative programming workspace where developers write code, communicate via real-time text, voice, and video, and manage projects from a single unified application.*

---

## 🌟 Core Features

1. **Real-Time Code Collaboration:** Multi-user live code editing with file version sequencing, active cursor indicators, and conflict detection.
2. **Secure Google Account Sign-In:** Official Google Identity Services integration with backend token signature verification via `google-auth-library`.
3. **Dedicated Voice & Video Meetings:** Native WebRTC peer-to-peer voice and video calls (`/meeting/:meetingId`) with microphone mute/unmute, camera on/off, real-time speaking indicators, and participant connection state.
4. **Camera-Independent Audio Calls:** Dedicated voice-only mode that functions seamlessly without requesting video camera permissions.
5. **Project Rooms & File Management:** Multi-tab file organization (`App.jsx`, `index.js`, `style.css`), file creation, saving, and deletion with authorized access control.
6. **Real-Time Deduplicated Text Chat:** Instant messaging synchronized through authenticated WebSockets directly to MongoDB without duplicate records.
7. **Honest Presence & Activity Tracking:** Live collaborator presence derived strictly from genuine Socket.IO connections. Zero fake users, fake counts, or fabricated avatars.
8. **Secure JWT Authentication & Authorization:** Token-based session verification protecting all room mutations, file updates, and WebSocket connections with no client-side impersonation.

---

## 🛠️ Technology Stack (MERN + WebRTC)

Built strictly with JavaScript and JSX:

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client, Google Identity Services (`@accounts.google.com/gsi/client`), WebRTC Native Media APIs
- **Backend:** Node.js, Express.js, Socket.IO Server, Mongoose, Google Auth Library (`google-auth-library`), JWT (`jsonwebtoken`), `bcryptjs`
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
- **Google Identity Verification:** The frontend obtains a Google ID token credential using Google Identity Services and sends it to `POST /api/auth/google`. The backend validates token signature, issuer, audience (`GOOGLE_CLIENT_ID`), expiry, and `email_verified: true`, then issues the application JWT session.
- **WebRTC Media Stream:** Audio and video streams flow directly peer-to-peer between participant browsers. Media is never routed through Socket.IO or stored in MongoDB.
- **Socket.IO Signaling:** Acts as the WebRTC signaling gateway for exchanging SDP offers, answers, ICE candidates, and mute/speaking status between authenticated peers.
- **Code Synchronization:** Synchronizes code changes with version tracking and collision notifications to prevent blind overwrites.
- **REST Endpoints:** Handles authentication, rooms, files, and chat history with JWT bearer token verification.

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

1. **Google Account Token Verification:** All Google sign-ins are verified server-side using Google's public key certificates. Browser-supplied profile metadata is never trusted blindly.
2. **Account Linking Protection:** Automatic linking by raw email is prevented to protect existing local accounts from unauthorized takeover.
3. **Socket.IO Handshake Authentication:** Sockets verify JWT tokens on connection. Unauthenticated sockets cannot join rooms or edit code.
4. **Identity Derivation:** Sender identity and avatar are strictly derived from verified JWT tokens on the server, eliminating client-side impersonation.
5. **Protected Mutating Endpoints:** Room creation, file creation, updates, and deletion require valid `Authorization: Bearer <token>` headers.
6. **Strict CORS Policy:** Origin validation restricts access to explicit whitelist origins (`localhost`, `127.0.0.1`, and `https://code-together-weld.vercel.app`).
7. **No Duplicate Chat Messages:** Single-dispatch persistence through authenticated socket events prevents duplicated records caused by concurrent HTTP and WebSocket writes.
8. **Demo Accounts Removed:** All fake avatars, mock chat messages, hardcoded credentials, and simulated online counts have been eliminated from production behavior.
9. **Safe Database Inspection Tools:** Read-only script (`npm run inspect-demo --prefix server`) inspects MongoDB for legacy test accounts without modifying or leaking records.
10. **Production Fail-Safe:** Server fails safely if `JWT_SECRET` is missing in production mode rather than falling back to insecure defaults.

---

## 🧪 Automated Test Suite

CodeTogether includes 28 comprehensive automated unit and integration tests covering Google authentication, route authorization, socket permissions, code collision detection, and WebRTC signaling.

To run the complete test suite:

```bash
# Run backend tests (all 28 tests)
npm test --prefix server

# Run client build verification
npm run build --prefix client

# Or run all tests from the root directory
npm test
```

### Verified Test Cases:
- Google ID token verification (valid signatures, audience matching, issuer validation)
- Google token expiration and unverified email rejection (401 / 403)
- Account takeover protection (rejecting Google takeover of existing password account)
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
   - `CLIENT_URL`: `https://code-together-weld.vercel.app`
   - `GOOGLE_CLIENT_ID`: `764795198689-41h522pnno7r3ifmb6im3iu12418m31f.apps.googleusercontent.com`

### 3. Frontend — Vercel
1. Import the repository into Vercel.
2. Build Settings:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment Variables:
   - `VITE_BACKEND_URL`: `https://codetogether-v1fo.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID`: `764795198689-41h522pnno7r3ifmb6im3iu12418m31f.apps.googleusercontent.com`
4. Direct routes (like `/meeting/:meetingId`) are automatically rewritten to `/index.html` via `client/vercel.json` for seamless SPA routing and page refreshes.

### 4. Google Cloud Console Configuration
1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), select the OAuth 2.0 Web Client:
2. **Authorized JavaScript origins:**
   - `https://code-together-weld.vercel.app`
   - `http://localhost:5173` (for local development)
3. Ensure the Client ID matches `GOOGLE_CLIENT_ID` on Render and `VITE_GOOGLE_CLIENT_ID` on Vercel.

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
