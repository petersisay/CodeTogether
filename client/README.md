# 💻 CodeTogether Frontend — Client Architecture & Development Guide

<p align="center">
  <img src="https://raw.githubusercontent.com/petersisay/CodeTogether/main/client/public/favicon.svg" alt="CodeTogether Logo" width="64" height="64" />
</p>

<h3 align="center">Real-Time Collaborative Web Client (React 19 + Vite 8)</h3>

<p align="center">
  The frontend client for CodeTogether — a high-performance, single-page application providing real-time code editing, peer-to-peer WebRTC video/voice meetings, Google authentication, and instant project ZIP export.
</p>

---

## 📑 Table of Contents
- [Overview](#overview)
- [Component Hierarchy](#component-hierarchy)
- [Tech Stack & Dependencies](#tech-stack--dependencies)
- [Real-Time Collaboration Architecture](#real-time-collaboration-architecture)
- [WebRTC Voice & Video System](#webrtc-voice--video-system)
- [Google Authentication Integration](#google-authentication-integration)
- [Project ZIP Export Workflow](#project-zip-export-workflow)
- [Design System & Aesthetics](#design-system--aesthetics)
- [Environment Configuration](#environment-configuration)
- [Scripts & Development](#scripts--development)
- [Production Deployment (Vercel)](#production-deployment-vercel)

---

## Overview

The CodeTogether client is engineered for responsiveness, low-latency live interactions, and developer productivity. It operates in two primary modes:
1. **Developer Landing Page (`/`)**: A futuristic showcase featuring an animated WebP cyber-mesh hero background, feature tours, team narrative, interactive IDE previews, and authentication modals.
2. **Interactive Workspace (`/workspace`)**: A full-screen pair programming environment with tabbed file navigation, live socket code synchronization, team chat, dynamic user presence, WebRTC calling, and offline project export.
3. **Dedicated Meeting Room (`/meeting/:meetingId`)**: Focused audio/video conferencing with peer visualizers, camera/mic toggling, and room sharing.

---

## Component Hierarchy

```
client/src/
├── main.jsx                       # Application entrypoint & DOM mounting
├── App.jsx                        # Client-side router & global session coordinator
├── index.css                      # Global styles, Tailwind CSS v4, custom utility classes & animations
└── components/
    ├── LandingNavbar.jsx          # Sticky navigation bar with auth triggers & brand logo
    ├── HeroSection.jsx            # Animated hero with WebP background, glow pulses & particles
    ├── WorkspacePreview.jsx       # Interactive mock IDE showcase on landing page
    ├── FeaturesSection.jsx        # 6-card platform capabilities grid
    ├── AboutSection.jsx           # ASTU university developer team narrative & illustration
    ├── HowItWorksSection.jsx      # 3-step numbered workflow guide
    ├── TechSection.jsx            # Production technology stack badges
    ├── CtaSection.jsx             # High-converting bottom CTA banner
    ├── LandingFooter.jsx          # Platform footer, legal, and GitHub link
    ├── WorkspaceWindow.jsx        # Full-screen collaborative IDE layout
    │   ├── Left Sidebar           # Room selector & project file explorer (create/delete)
    │   ├── Center Editor          # Tabbed file navigation, line numbers & SyntaxHighlighter
    │   └── Right Sidebar          # Live collaborator presence list & persistent team chat
    ├── MeetingRoom.jsx            # WebRTC P2P audio/video conference room
    ├── AuthModal.jsx              # Google Identity Services verified sign-up / sign-in modal
    ├── CreateRoomModal.jsx        # Interactive modal to create public/private rooms
    ├── CreateFileModal.jsx        # Modal to create files with dynamic extension detection
    └── SyntaxHighlighter.jsx      # Token-based high-contrast syntax highlighting engine
```

---

## Tech Stack & Dependencies

| Library | Version | Role in Client Application |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Component lifecycle, hooks, and virtual DOM reconciliation |
| **Vite** | `^8.3.0` | Next-generation bundler, instant ES module HMR, optimized production chunks |
| **Tailwind CSS** | `^4.3.3` | Utility-first CSS styling via `@tailwindcss/vite` |
| **Socket.IO Client** | `^4.8.4` | Low-latency bi-directional WebSocket transport for code changes & chat |
| **JSZip** | `^3.10.2` | Browser-side multi-file ZIP archive compression and packaging |
| **Lucide React** | `^1.58.0` | Accessible, ultra-lightweight SVG iconography |
| **Oxlint** | `^1.81.0` | Ultra-fast Rust-based JavaScript/JSX linter |

---

## Real-Time Collaboration Architecture

### 1. Code Synchronization
- Keystrokes in the active file tab trigger debounced socket emission: `code:change`.
- Events carry `{ room, filename, content, version }`.
- Collaborators receive `code:update` and update their editor state without resetting cursor focus.
- Conflict mitigation uses operational sequence numbers to prevent overwrite collisions.

### 2. Live Presence Tracking
- Connected sockets send authenticated handshakes containing the user's JWT.
- Active room presence is broadcasted on `presence:update`.
- Each collaborator displays their genuine avatar, username, and active file badge.
- Simulated or hardcoded demo users have been completely eliminated.

### 3. Team Chat Feeds
- Chat messages are sent via `chat:send` over WebSockets.
- The server writes the message directly to MongoDB Atlas and broadcasts `chat:new` to room members in a single dispatch.
- Single-dispatch prevents duplicate messages that could occur from concurrent REST and socket writes.
- Chat state is retained in guest mode across sign-outs.

---

## WebRTC Voice & Video System

Integrated directly in [`MeetingRoom.jsx`](file:///c:/Users/Administrator/Downloads/CodeTogether/client/src/components/MeetingRoom.jsx):
- **Topology**: Peer-to-peer (P2P) mesh connection using standard browser `RTCPeerConnection`.
- **Signaling**: Relayed over the existing Socket.IO connection:
  - `meeting:join`: Announces client entrance with audio/video constraints.
  - `meeting:signal`: Exchanges SDP Offers, SDP Answers, and ICE candidates between peers.
  - `meeting:media-status`: Synchronizes camera/mic mute states across participants.
  - `meeting:leave`: Notifies remaining peers to close peer connections and reclaim media tracks.
- **NAT Traversal**: Configured with Google's public STUN server (`stun:stun.l.google.com:19302`).
- **Speaking Visualizers**: Real-time audio waveform animation based on audio stream track analysis.

---

## Google Authentication Integration

The client uses official **Google Identity Services (GIS)** rendered through [`AuthModal.jsx`](file:///c:/Users/Administrator/Downloads/CodeTogether/client/src/components/AuthModal.jsx):

```
+-----------------------------------------------------------+
| 1. User clicks "Sign in with Google" / "Sign up"          |
| 2. Google Identity Services displays native OAuth prompt  |
| 3. Client receives cryptographically signed ID Token      |
| 4. Client sends ID Token to:                              |
|    POST /api/auth/google/verify                           |
| 5. If new user:                                           |
|    - Server validates token signature & verified email    |
|    - Modal displays step 2: Username & Password selection |
|    - Client sends: POST /api/auth/google/register         |
| 6. If returning user:                                     |
|    - Server issues JWT session token                      |
| 7. Client stores JWT in localStorage for subsequent auth  |
+-----------------------------------------------------------+
```

---

## Project ZIP Export Workflow

The export feature inside [`WorkspaceWindow.jsx`](file:///c:/Users/Administrator/Downloads/CodeTogether/client/src/components/WorkspaceWindow.jsx) lets developers transition seamlessly from browser coding to their local workstation:

1. **Trigger**: User clicks **Export ZIP** in the workspace header or file explorer toolbar.
2. **Server Verification**: Client calls `GET /api/rooms/:name/export` with `Authorization: Bearer <token>`.
3. **Path Sanitization**: The server verifies caller authorization for private rooms and sanitizes file paths.
4. **Compression**: The client initializes `JSZip`, populates the archive with all room files, and generates a helper `README_LOCAL_SETUP.md`.
5. **Download**: Triggers browser file save for `<room>-source.zip`.
6. **Instruction Modal**: Guides the user through:
   ```bash
   unzip <room>-source.zip -d <room>
   cd <room>
   code .
   ```

---

## Design System & Aesthetics

- **Color Palette**:
  - Dark Navy Background: `#0a0f1d`
  - Elevated Container Navy: `#0f172a`
  - Subtle Borders & Dividers: `#1e293b`
  - Vibrant Cyan/Blue Accents: `#38bdf8`, `#2563eb`, `#60a5fa`
  - Syntax Highlighting: Custom dark theme with high-contrast tokens.
- **Hero Animation**:
  - Background asset: `hero-bg.webp` (61.8 kB ultra-optimized image).
  - Slow 2D translation drift with glowing ambient pulses.
  - Full support for `@media (prefers-reduced-motion)` for accessibility.

---

## Environment Configuration

Create a `.env` file in `client/` using [`client/.env.example`](file:///c:/Users/Administrator/Downloads/CodeTogether/client/.env.example) as a template:

```env
# Backend API Base URL (leave empty for local proxy, or set to production server)
VITE_BACKEND_URL=https://codetogether-v1fo.onrender.com

# Google Identity Services Client ID
VITE_GOOGLE_CLIENT_ID=764795198689-41h522pnno7r3ifmb6im3iu12418m31f.apps.googleusercontent.com
```

---

## Scripts & Development

```bash
# Install dependencies
npm install

# Start Vite development server with HMR on http://localhost:5173
npm run dev

# Build production bundle with minification & tree shaking
npm run build

# Preview production build locally
npm run preview

# Run Oxlint static analysis
npm run lint
```

---

## Production Deployment (Vercel)

The client is configured for zero-configuration Vercel deployment with client-side SPA rewrites defined in [`client/vercel.json`](file:///c:/Users/Administrator/Downloads/CodeTogether/client/vercel.json):

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This guarantees deep routes like `/workspace` and `/meeting/:meetingId` correctly route back to the client-side router without generating 404 errors on browser refresh.
