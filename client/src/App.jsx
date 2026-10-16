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

export default function App() {
  const [activeRoom, setActiveRoom] = useState('ASTU_DreamTeam');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      socketInstance.emit('room:join', { room: activeRoom, user: 'Petros' });
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // When room changes, notify socket server
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('room:join', { room: activeRoom, user: 'Petros' });
    }
  }, [activeRoom, socket]);

  const handleStartCoding = () => {
    const el = document.getElementById('coding-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col items-center justify-start px-3 sm:px-6 lg:px-8 py-5 select-text">
      {/* Background radial glow matching the reference design */}
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
            <NavbarHero onStartCoding={handleStartCoding} />
          </div>

          {/* Center Column: Collaborative Coding Workspace (Part 3) */}
          <div id="coding-workspace" className="lg:col-span-6 w-full">
            <WorkspaceWindow
              activeRoom={activeRoom}
              setActiveRoom={setActiveRoom}
              socket={socket}
              connected={connected}
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
    </div>
  );
}
