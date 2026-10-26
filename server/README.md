# ⚙️ CodeTogether Backend — Server Architecture & API Guide

<p align="center">
  <img src="https://raw.githubusercontent.com/petersisay/CodeTogether/main/client/public/favicon.svg" alt="CodeTogether Logo" width="64" height="64" />
</p>

<h3 align="center">Node.js, Express, Socket.IO & MongoDB Atlas Backend Engine</h3>

<p align="center">
  The backend service for CodeTogether — managing cryptographic authentication, persistent collaborative rooms, WebSocket synchronization, WebRTC conference signaling, and secure project export packaging.
</p>

---

## 📑 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Authentication & Security Pipeline](#authentication--security-pipeline)
- [REST API Endpoints](#rest-api-endpoints)
- [Socket.IO Real-Time Engine](#socketio-real-time-engine)
- [WebRTC Signaling Protocol](#webrtc-signaling-protocol)
- [Database Models & Dual Persistence](#database-models--dual-persistence)
- [Room-Level Authorization & Export Sanitization](#room-level-authorization--export-sanitization)
- [Testing & Benchmarking](#testing--benchmarking)
- [Environment Variables](#environment-variables)
- [Deployment on Render](#deployment-on-render)

---

## Architecture Overview

The server operates as a unified HTTP REST API and WebSocket daemon running on Node.js (ES Modules):
- **Express 4**: Serves REST endpoints for authentication, room listing, file management, and project export.
- **Socket.IO 4.8**: Powers bi-directional, event-driven communication for live code typing, presence, and chat.
- **WebRTC Signaling Hub**: Acts as the signaling broker for client-side peer-to-peer audio and video calls.
- **Mongoose 8 / MongoDB Atlas**: Persists user profiles, multi-file code documents, and message archives.

---

## Directory Structure

```
server/
├── config/
│   └── db.js                       # MongoDB Atlas Mongoose connection lifecycle & events
├── middleware/
│   └── auth.js                     # JWT validation middleware (authenticateToken, verifyToken)
├── models/
│   ├── User.js                     # Mongoose user schema (googleId, email, passwordHash, avatar)
│   ├── Room.js                     # Mongoose room schema with nested files array & access controls
│   └── Message.js                  # Persistent chat messages with timestamps
├── routes/
│   ├── authRoutes.js               # Google ID token verification & user credential management
│   └── roomRoutes.js               # Room CRUD, file auto-save, and /export endpoint with path sanitization
├── scripts/
│   ├── benchmarkPerformance.js     # Latency and throughput micro-benchmarking script
│   ├── inspectDemoAccounts.js      # Utility script to inspect database identities
│   └── cleanupDemoAccounts.js      # Utility script to purge deprecated demo artifacts
├── tests/
│   ├── auth.test.js                # Google verification & token tests (13 tests)
│   ├── rooms_api.test.js           # Room authorization & export tests (12 tests)
│   └── socket_and_webrtc.test.js   # Real-time synchronization & signaling tests (4 tests)
├── .env.example                    # Template for backend environment variables
├── package.json                    # Backend dependencies & test scripts
├── render.yaml                     # Render Infrastructure-as-Code service definition
├── server.js                       # Primary server entrypoint, middleware configuration & port binding
└── socket.js                       # Socket.IO connection handling, rooms, chat, and WebRTC broker
```

---

## Authentication & Security Pipeline

### 1. Google ID Token Verification
Incoming Google ID tokens are verified server-side using Google's official `google-auth-library`:
- Cryptographic verification via Google's public key JWKS endpoints.
- Audience assertion matching `GOOGLE_CLIENT_ID`.
- Issuer validation (`accounts.google.com` or `https://accounts.google.com`).
- Expiration check against UTC clock timestamps.
- Mandatory email verification assertion (`email_verified: true`).

### 2. Account Takeover Protection
To prevent identity hijacking, if a Google account attempts sign-in with an email address that is already registered to a local password-based account, the server rejects the request with HTTP 409 Conflict.

### 3. Password Hashing
All local passwords are salt-hashed using `bcryptjs` with 10 salt rounds before persistence. Plaintext passwords are never stored or logged.

### 4. JWT Session Tokens
Successful authentications issue a stateless JSON Web Token signed with `JWT_SECRET` via HMAC-SHA256, carrying `{ id, username, email, avatar }` and expiring in 7 days.

---

## REST API Endpoints

### Health & Monitoring
- `GET /api/health`: Returns API status, uptime, project metadata, and server timestamp. (Sub-2ms response latency).

### Authentication (`/api/auth`)
- `POST /api/auth/google/verify`: Verifies a Google ID token credential; returns whether the user is new or existing.
- `POST /api/auth/google/register`: Completes onboarding for a verified Google user by setting username and password.
- `POST /api/auth/login`: Authenticates returning users with username/email and password; returns JWT.
- `GET /api/auth/me`: Validates caller JWT and returns current authenticated user profile.

### Rooms & Files (`/api/rooms`)
- `GET /api/rooms`: Returns list of available rooms with active file summaries.
- `POST /api/rooms`: Creates a new room (Public or Private). *(Requires JWT)*
- `GET /api/rooms/:name`: Retrieves details and files for a specific room.
- `POST /api/rooms/:name/files`: Adds a new file to a room. *(Requires JWT + Room Authorization)*
- `PUT /api/rooms/:name/files/:filename`: Updates file content. *(Requires JWT + Room Authorization)*
- `DELETE /api/rooms/:name/files/:filename`: Deletes a file. *(Requires JWT + Room Authorization)*
- `GET /api/rooms/:name/export`: Exports room files as sanitized JSON payload for client-side ZIP packaging. *(Requires JWT + Room Authorization)*

---

## Socket.IO Real-Time Engine

Socket.IO binds to the Express HTTP server and handles real-time bidirectional streams:

```
+--------------------+---------------------------------------------------------------+
| Event              | Purpose & Payload                                             |
+--------------------+---------------------------------------------------------------+
| room:join          | Authenticated user enters room; triggers room data hydration  |
| room:leave         | User departs; removes socket from room and presence list      |
| code:change        | Emits code edits: { room, filename, content, version }        |
| code:update        | Broadcasts code updates to all other participants in the room  |
| chat:send          | Persists message to MongoDB and broadcasts chat:new in 1-step |
| presence:update    | Emits active participant list with genuine usernames & avatars|
| cursor:move        | Synchronizes live collaborator cursor coordinates in editor   |
+--------------------+---------------------------------------------------------------+
```

### Single-Dispatch Chat Delivery
To eliminate duplicate chat messages, messages sent via `chat:send` are committed to MongoDB and broadcasted in a single server action. Rest API duplicate posting routes are eliminated.

---

## WebRTC Signaling Protocol

The server relays WebRTC signaling messages between mesh peers without processing raw video/audio data:

```
Client A                          Server (Socket.IO Hub)                 Client B
   |                                        |                               |
   |--- meeting:join { roomId, user } ----->|                               |
   |                                        |--- meeting:user-joined ------>|
   |                                        |                               |
   |--- meeting:signal { to, sdpOffer } --->|                               |
   |                                        |--- meeting:signal (Offer) --->|
   |                                        |                               |
   |                                        |<-- meeting:signal (Answer) ---|
   |<-- meeting:signal (Answer) ------------|                               |
   |                                        |                               |
   |==================== P2P WebRTC Media Stream ===========================|
   |                                        |                               |
   |--- meeting:media-status { mic, cam } ->|                               |
   |                                        |--- meeting:media-status ----->|
   |                                        |                               |
   |--- meeting:leave --------------------->|                               |
   |                                        |--- meeting:user-left -------->|
```

---

## Database Models & Dual Persistence

1. **User Schema**:
   - `username`: String (Unique, Indexed)
   - `email`: String (Unique, Indexed)
   - `password`: String (Bcrypt hash)
   - `googleId`: String (Optional, for OAuth accounts)
   - `avatar`: String (Profile image URL)

2. **Room Schema**:
   - `name`: String (Unique, Indexed)
   - `description`: String
   - `creator`: String
   - `isPrivate`: Boolean (Default: false)
   - `authorizedUsers`: Array of usernames
   - `files`: Array of `{ filename, content, language, updatedAt }`

3. **Message Schema**:
   - `room`: String (Indexed)
   - `sender`: String
   - `avatar`: String
   - `text`: String
   - `timestamp`: Date

### Development Fallback Strategy
If `MONGODB_URI` is not configured, the server automatically starts in **in-memory persistence mode**. All authentication, rooms, files, and chat functions remain completely functional in-memory. This enables instant offline development and zero-dependency automated testing.

---

## Room-Level Authorization & Export Sanitization

### Room Authorization Helper
Implemented in [`server/routes/roomRoutes.js`](file:///c:/Users/Administrator/Downloads/CodeTogether/server/routes/roomRoutes.js):
```javascript
export function isUserAuthorizedForRoom(room, username) {
  if (!room) return false;
  if (!room.isPrivate && (!room.authorizedUsers || room.authorizedUsers.length === 0)) {
    return true; // Public room
  }
  if (room.creator && room.creator === username) return true;
  if (Array.isArray(room.authorizedUsers) && room.authorizedUsers.includes(username)) return true;
  return false;
}
```

### Path Sanitization on Export
`GET /api/rooms/:name/export` prevents path traversal vulnerabilities:
- Stored filenames are normalized and stripped of control characters, null bytes, and Windows drive roots (`C:\`).
- Traversal sequences (`../` or `..\`) are stripped completely.
- Leading and trailing slashes are removed.
- Validated relative paths are returned for client-side ZIP packaging.

---

## Testing & Benchmarking

The server uses Node.js's native test runner (`node:test`, `node:assert`) without heavy third-party runners:

```bash
# Run all 33 unit and integration tests
npm test

# Run micro-benchmark performance tests
npm run benchmark
```

### Benchmark Results
- `GET /api/health`: **1.95 ms** average latency.
- `GET /api/rooms`: **0.83 ms** average latency.
- JWT Generation: **0.087 ms** per token (~11,400 ops/second).

---

## Environment Variables

Configure these in `server/.env` using [`server/.env.example`](file:///c:/Users/Administrator/Downloads/CodeTogether/server/.env.example):

```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://code-together-weld.vercel.app
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/codetogether?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
GOOGLE_CLIENT_ID=764795198689-41h522pnno7r3ifmb6im3iu12418m31f.apps.googleusercontent.com
```

---

## Deployment on Render

Configured via Infrastructure-as-Code in [`render.yaml`](file:///c:/Users/Administrator/Downloads/CodeTogether/render.yaml):

```yaml
services:
  - type: web
    name: codetogether-api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: CLIENT_URL
        value: https://code-together-weld.vercel.app
```

Render automatically provisions SSL certificates, sets up WebSocket upgrades, and builds continuously from pushes to `origin/main`.
