import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import NavbarHero from './components/NavbarHero.jsx';
import WorkspaceWindow from './components/WorkspaceWindow.jsx';
import RightIllustration from './components/RightIllustration.jsx';
import ProjectConcept from './components/ProjectConcept.jsx';
import KeyFeatures from './components/KeyFeatures.jsx';
import TechStack from './components/TechStack.jsx';
import ArchitectureDiagram from './components/ArchitectureDiagram.jsx';
import LearningGoalsFooter from './components/LearningGoalsFooter.jsx';
import AuthModal from './components/AuthModal.jsx';
import MeetingRoom from './components/MeetingRoom.jsx';

export default function App() {
  const [activeRoom, setActiveRoom] = useState('ASTU_DreamTeam');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname + window.location.search);

  // 1. Initialize user from validated localStorage credentials
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('codetogether_user');
      const storedToken = localStorage.getItem('codetogether_token');
      if (storedUser && storedToken) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    }
  }, []);

  // 2. Browser History / URL routing listener
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3. Initialize Socket.IO connection with JWT token
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const token = localStorage.getItem('codetogether_token');

    const socketInstance = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      const currentToken = localStorage.getItem('codetogether_token');
      if (currentToken) {
        socketInstance.emit('auth:authenticate', { token: currentToken });
        socketInstance.emit('room:join', { room: activeRoom });
      }
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('auth:error', () => {
      localStorage.removeItem('codetogether_token');
      localStorage.removeItem('codetogether_user');
      setCurrentUser(null);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // 4. Update room when activeRoom or currentUser changes
  useEffect(() => {
    if (socket && socket.connected && currentUser) {
      socket.emit('room:join', { room: activeRoom });
    }
  }, [activeRoom, currentUser, socket]);

  const handleStartCoding = () => {
    const el = document.getElementById('coding-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    if (!currentUser) {
      setIsAuthOpen(true);
    }
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    if (socket) {
      socket.auth = { token };
      socket.emit('auth:authenticate', { token });
      socket.emit('room:join', { room: activeRoom });
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('codetogether_token');
    localStorage.removeItem('codetogether_user');
    setCurrentUser(null);
    if (socket) {
      socket.auth = { token: null };
      socket.emit('auth:authenticate', { token: null });
      socket.disconnect();
      socket.connect();
    }
  };

  const handleNavigateToMeeting = (meetingId, mode = 'video') => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const newPath = `/meeting/${encodeURIComponent(meetingId)}?mode=${mode}`;
    window.history.pushState({}, '', newPath);
    setCurrentPath(newPath);
  };

  const handleReturnToWorkspace = () => {
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  // Route: /meeting/:meetingId
  if (currentPath.startsWith('/meeting/')) {
    const rawPath = currentPath.split('?')[0];
    const meetingId = decodeURIComponent(rawPath.replace('/meeting/', '')) || activeRoom;
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') === 'audio' ? 'audio' : 'video';

    return (
      <div className="min-h-screen bg-[#070B14]">
        <MeetingRoom
          meetingId={meetingId}
          initialMode={mode}
          socket={socket}
          currentUser={currentUser}
          onReturnToWorkspace={handleReturnToWorkspace}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col items-center justify-start px-3 sm:px-6 lg:px-8 py-5 select-text">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-sky-600/8 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1440px] flex flex-col gap-6">
        {/* =========================================================================
            TOP SECTION: Part 2 (Hero) + Part 3 (Workspace) + Part 4 (Illustration)
           ========================================================================= */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Landing Page Hero & Feature Highlights (Part 2) */}
          <div className="lg:col-span-4 flex flex-col justify-start">
            <NavbarHero onStartCoding={handleStartCoding} currentUser={currentUser} />
          </div>

          {/* Center Column: Collaborative Coding Workspace (Part 3) */}
          <div id="coding-workspace" className="lg:col-span-6 w-full">
            <WorkspaceWindow
              activeRoom={activeRoom}
              setActiveRoom={setActiveRoom}
              socket={socket}
              connected={connected}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
              onSignOut={handleSignOut}
              onNavigateToMeeting={handleNavigateToMeeting}
            />
          </div>

          {/* Right Column: Illustration (Part 4) */}
          <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-center pt-2">
            <RightIllustration />
          </div>
        </div>

        {/* =========================================================================
            MIDDLE SECTION: Part 5 (Project Concept) + Part 6 (Key Features) + Part 7/8 (Tech Stack & Architecture)
           ========================================================================= */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Column 1: Project Concept (Part 5) */}
          <div className="lg:col-span-3">
            <ProjectConcept />
          </div>

          {/* Column 2: Key Features (Part 6) */}
          <div className="lg:col-span-4">
            <KeyFeatures />
          </div>

          {/* Column 3: Tech Stack & Architecture (Part 7 & Part 8) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <TechStack />
            <ArchitectureDiagram />
          </div>
        </div>

        {/* =========================================================================
            BOTTOM SECTION: Learning Goals Footer (Part 9)
           ========================================================================= */}
        <div className="w-full">
          <LearningGoalsFooter onLetsGo={handleStartCoding} />
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

