import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import LandingNavbar from './components/LandingNavbar.jsx';
import HeroSection from './components/HeroSection.jsx';
import WorkspacePreview from './components/WorkspacePreview.jsx';
import FeaturesSection from './components/FeaturesSection.jsx';
import AboutSection from './components/AboutSection.jsx';
import HowItWorksSection from './components/HowItWorksSection.jsx';
import TechSection from './components/TechSection.jsx';
import CtaSection from './components/CtaSection.jsx';
import LandingFooter from './components/LandingFooter.jsx';
import WorkspaceWindow from './components/WorkspaceWindow.jsx';
import MeetingRoom from './components/MeetingRoom.jsx';
import AuthModal from './components/AuthModal.jsx';

export default function App() {
  const [activeRoom, setActiveRoom] = useState('ASTU_DreamTeam');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
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

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleNavigateToWorkspace = () => {
    window.history.pushState({}, '', '/workspace');
    setCurrentPath('/workspace');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleReturnToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleExploreFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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

  // Keep workspace history and data intact on sign-out (clear credentials only)
  const handleSignOut = () => {
    localStorage.removeItem('codetogether_token');
    localStorage.removeItem('codetogether_user');
    setCurrentUser(null);
    if (socket) {
      socket.auth = { token: null };
      socket.emit('auth:authenticate', { token: null });
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
    window.history.pushState({}, '', '/workspace');
    setCurrentPath('/workspace');
  };

  // Route 1: WebRTC Meeting Room (/meeting/:meetingId)
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
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Route 2: Dedicated Full-Screen Collaborative Coding Workspace (/workspace)
  if (currentPath.startsWith('/workspace')) {
    return (
      <div className="h-screen w-full bg-[#070B14] overflow-hidden">
        <WorkspaceWindow
          activeRoom={activeRoom}
          setActiveRoom={setActiveRoom}
          socket={socket}
          connected={connected}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onSignOut={handleSignOut}
          onNavigateToMeeting={handleNavigateToMeeting}
          onReturnToHome={handleReturnToHome}
        />
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Route 3: Modern, Spacious, Professional Landing Page (/)
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between selection:bg-blue-600/40 relative">
      {/* Background radial ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[160px]"></div>
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-cyan-600/8 rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-blue-700/8 rounded-full blur-[160px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Professional Navigation Bar */}
        <LandingNavbar
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onSignOut={handleSignOut}
          onNavigateToWorkspace={handleNavigateToWorkspace}
        />

        {/* Main Landing Page Content */}
        <main className="flex-1 flex flex-col">
          {/* B. Spacious Hero Section */}
          <HeroSection
            onStartCoding={handleNavigateToWorkspace}
            onExploreFeatures={handleExploreFeatures}
            currentUser={currentUser}
          />

          {/* C. Large Workspace Preview Section */}
          <div id="coding-workspace">
            <WorkspacePreview onLaunchWorkspace={handleNavigateToWorkspace} />
          </div>

          {/* D. Features Section */}
          <FeaturesSection />

          {/* E. About CodeTogether Section */}
          <AboutSection />

          {/* F. How It Works Section */}
          <HowItWorksSection onStartCoding={handleNavigateToWorkspace} />

          {/* G. Technology Section */}
          <TechSection />

          {/* H. Final Call to Action */}
          <CtaSection
            onStartCoding={handleNavigateToWorkspace}
            currentUser={currentUser}
          />
        </main>

        {/* I. Professional Footer */}
        <LandingFooter onNavigateToWorkspace={handleNavigateToWorkspace} />
      </div>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
