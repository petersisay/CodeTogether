# 📗 CodeTogether — REST & WebSocket API Specification

**Version**: 1.0.0  
**Base URL**: `https://codetogether-v1fo.onrender.com` (Production) / `http://localhost:5000` (Local)  
**Protocol**: HTTPS (REST API) & WSS (Socket.IO Real-Time Engine)  

---

## 📑 Table of Contents
- [Authentication Specification](#authentication-specification)
- [Standard Error Handling & Status Codes](#standard-error-handling--status-codes)
- [REST API Endpoints](#rest-api-endpoints)
  - [System Health](#system-health)
  - [Authentication Routes](#authentication-routes)
  - [Room Management Routes](#room-management-routes)
  - [File Operations Routes](#file-operations-routes)
  - [Project Export Route](#project-export-route)
- [Socket.IO Real-Time Event Protocol](#socketio-real-time-event-protocol)
- [WebRTC Signaling Protocol](#webrtc-signaling-protocol)

---

## Authentication Specification

All protected REST routes require an HMAC-SHA256 signed JSON Web Token (JWT) passed in the `Authorization` HTTP header:

```http
Authorization: Bearer <your_jwt_token_here>
```

When connecting to Socket.IO, the JWT must be supplied in the connection `auth` payload:
```javascript
const socket = io(SERVER_URL, {
  auth: { token: localStorage.getItem('token') }
});
```

Unauthenticated requests to protected endpoints return:
```json
{
  "error": "Authentication required. Please sign in to perform this action."
}
```

---

## Standard Error Handling & Status Codes

| HTTP Status | Meaning | Typical Trigger |
| :--- | :--- | :--- |
| **`200 OK`** | Request succeeded | Successful GET, PUT, or DELETE request |
| **`201 Created`** | Resource provisioned | Successful room, file, or account creation |
| **`400 Bad Request`** | Malformed parameters | Missing required field (e.g. credential, filename, text) |
| **`401 Unauthorized`** | Authentication failed | Missing, invalid, expired, or tampered token |
| **`403 Forbidden`** | Permission denied | Accessing or exporting a private room without authorization |
| **`404 Not Found`** | Resource missing | Room or file name does not exist |
| **`409 Conflict`** | Resource collision | Room/file already exists, or local account exists for Google email |
| **`500 Internal Error`** | Server malfunction | Unhandled database or network exception |

---

## REST API Endpoints

### System Health

#### `GET /api/health`
Checks backend service availability and provides project metadata.

- **Auth**: None (Public)
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "project": "CodeTogether",
  "tagline": "Code • Collaborate • Build Together",
  "version": "1.0.0",
  "timestamp": "2026-10-27T01:30:00.000Z"
}
```

---

### Authentication Routes

#### `POST /api/auth/google/verify`
Verifies a Google Identity Services credential (ID Token) and determines whether the user is new or existing.

- **Auth**: None (Public)
- **Request Body**:
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI..."
}
```
- **Response (Existing User)**: `200 OK`
```json
{
  "isNewUser": false,
  "user": {
    "id": "6718d7...",
    "username": "petros",
    "email": "petros@example.com",
    "avatar": "https://lh3.googleusercontent.com/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response (New User)**: `200 OK`
```json
{
  "isNewUser": true,
  "googleProfile": {
    "googleId": "10839217...",
    "email": "newdev@gmail.com",
    "name": "Alex Developer",
    "avatar": "https://lh3.googleusercontent.com/...",
    "suggestedUsername": "alexdeveloper"
  }
}
```

#### `POST /api/auth/google/register`
Completes the onboarding workflow for a verified Google account by establishing a workspace username and password.

- **Auth**: None (Public)
- **Request Body**:
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI...",
  "username": "alexdev",
  "password": "securepassword123"
}
```
- **Response**: `201 Created`
```json
{
  "user": {
    "id": "6718d9...",
    "username": "alexdev",
    "email": "newdev@gmail.com",
    "avatar": "https://lh3.googleusercontent.com/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/login`
Authenticates returning users with username/email and password.

- **Auth**: None (Public)
- **Request Body**:
```json
{
  "username": "alexdev",
  "password": "securepassword123"
}
```
- **Response**: `200 OK`
```json
{
  "user": {
    "id": "6718d9...",
    "username": "alexdev",
    "email": "newdev@gmail.com",
    "avatar": "https://lh3.googleusercontent.com/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `GET /api/auth/me`
Fetches the currently authenticated user profile from the session JWT.

- **Auth**: `Bearer <token>`
- **Response**: `200 OK`
```json
{
  "user": {
    "id": "6718d9...",
    "username": "alexdev",
    "email": "newdev@gmail.com",
    "avatar": "https://lh3.googleusercontent.com/..."
  }
}
```

---

### Room Management Routes

#### `GET /api/rooms`
Retrieves a list of available rooms with summary file metadata.

- **Auth**: None (Public)
- **Response**: `200 OK`
```json
[
  {
    "name": "ASTU_DreamTeam",
    "description": "Adama Science and Technology University collaborative room",
    "fileCount": 3,
    "activeUsers": 2,
    "isPrivate": false
  }
]
```

#### `POST /api/rooms`
Provisions a new collaborative project room.

- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "name": "CloudArchitecture",
  "description": "Distributed microservices project",
  "isPrivate": false,
  "authorizedUsers": []
}
```
- **Response**: `201 Created`
```json
{
  "name": "CloudArchitecture",
  "description": "Distributed microservices project",
  "creator": "alexdev",
  "isPrivate": false,
  "files": [
    {
      "filename": "index.js",
      "content": "// Welcome to CloudArchitecture\n",
      "language": "javascript"
    }
  ]
}
```

#### `GET /api/rooms/:name`
Retrieves all files and metadata for the specified room.

- **Auth**: None (Public read)
- **Response**: `200 OK`
```json
{
  "name": "ASTU_DreamTeam",
  "description": "Adama Science and Technology University collaborative room",
  "isPrivate": false,
  "files": [
    {
      "filename": "App.jsx",
      "content": "import React from 'react';...",
      "language": "javascript"
    }
  ]
}
```

---

### File Operations Routes

#### `POST /api/rooms/:name/files`
Creates a new file within a room.

- **Auth**: `Bearer <token>` (Must be authorized if room is private)
- **Request Body**:
```json
{
  "filename": "components/Header.jsx",
  "content": "export default function Header() { return <header>Navbar</header>; }",
  "language": "javascript"
}
```
- **Response**: `201 Created`
```json
{
  "message": "File created successfully",
  "file": {
    "filename": "components/Header.jsx",
    "content": "export default function Header() { return <header>Navbar</header>; }",
    "language": "javascript"
  }
}
```

#### `PUT /api/rooms/:name/files/:filename`
Updates existing file content.

- **Auth**: `Bearer <token>` (Must be authorized if room is private)
- **Request Body**:
```json
{
  "content": "// Updated content\nexport default function Header() { ... }"
}
```
- **Response**: `200 OK`
```json
{
  "message": "File updated successfully",
  "filename": "components/Header.jsx"
}
```

#### `DELETE /api/rooms/:name/files/:filename`
Deletes a file from the room.

- **Auth**: `Bearer <token>` (Must be authorized if room is private)
- **Response**: `200 OK`
```json
{
  "message": "File deleted successfully",
  "filename": "components/Header.jsx"
}
```

---

### Project Export Route

#### `GET /api/rooms/:name/export`
Exports all room files as a sanitized payload for client-side packaging into a ZIP archive.

- **Auth**: `Bearer <token>` (Must be authorized if room is private)
- **Security Protections**:
  - Validates caller authorization against private room whitelists (returns `403 Forbidden` if denied).
  - Sanitizes filenames, removing path traversal (`../`), null bytes, and Windows drive roots.
- **Response**: `200 OK`
```json
{
  "room": "ASTU_DreamTeam",
  "files": [
    {
      "filename": "App.jsx",
      "content": "import React from 'react';..."
    },
    {
      "filename": "index.js",
      "content": "import './style.css';..."
    },
    {
      "filename": "style.css",
      "content": "body { margin: 0; }..."
    }
  ],
  "exportedAt": "2026-10-27T01:30:00.000Z"
}
```

---

## Socket.IO Real-Time Event Protocol

### Client-to-Server Events

| Event Name | Payload Schema | Description |
| :--- | :--- | :--- |
| `room:join` | `{ room: string }` | Enters a collaborative room. Triggers authorization validation. |
| `room:leave` | `{ room: string }` | Leaves current room and departs active presence tracking. |
| `code:change` | `{ room: string, filename: string, content: string, version: number }` | Emits code modifications with version sequence. |
| `chat:send` | `{ room: string, text: string }` | Sends chat message. Persisted to database and broadcast in single dispatch. |
| `cursor:move` | `{ room: string, line: number, ch: number, filename: string }` | Broadcasts live editor cursor position. |

### Server-to-Client Events

| Event Name | Payload Schema | Description |
| :--- | :--- | :--- |
| `room:data` | `{ room: string, files: Array, messages: Array }` | Initial room state delivered upon joining. |
| `code:update` | `{ filename: string, content: string, version: number, sender: string }` | Broadcasts remote collaborator code updates. |
| `chat:new` | `{ id: string, room: string, sender: string, avatar: string, text: string, timestamp: string }` | Broadcasts new message to room members. |
| `presence:update` | `{ room: string, count: number, users: Array<User> }` | Broadcasts real-time list of online participants. |
| `error:unauthorized`| `{ message: string }` | Emitted when unauthenticated or unauthorized socket attempts private action. |

---

## WebRTC Signaling Protocol

Mesh signaling events are transported over the established Socket.IO connection:

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `meeting:join` | Client -> Server | `{ meetingId, user, media: { audio, video } }` | Joins a video/audio conference. |
| `meeting:user-joined` | Server -> Clients | `{ socketId, user, media }` | Notifies active peers to initiate peer connections. |
| `meeting:signal` | Bidirectional | `{ to, from, signal: (SDP or ICE Candidate) }` | Relays WebRTC signaling payloads between peers. |
| `meeting:media-status`| Bidirectional | `{ meetingId, media: { audio, video } }` | Updates microphone/camera mute indicators. |
| `meeting:leave` | Client -> Server | `{ meetingId }` | Closes conference session and cleans up tracks. |
| `meeting:user-left` | Server -> Clients | `{ socketId, username }` | Notifies remaining peers to teardown peer connection. |
