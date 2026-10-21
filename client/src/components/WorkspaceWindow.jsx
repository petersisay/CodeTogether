import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  LayoutGrid,
  FolderCode,
  FileCode,
  Settings,
  Plus,
  ChevronDown,
  Send,
  MoreHorizontal,
  Maximize2,
  Trash2,
  Save,
  Check,
  Video,
  Phone,
  AlertTriangle,
  LogOut,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
  Users,
} from 'lucide-react';
import highlightCode from './SyntaxHighlighter.jsx';
import CreateRoomModal from './CreateRoomModal.jsx';
import CreateFileModal from './CreateFileModal.jsx';

export default function WorkspaceWindow({
  activeRoom,
  setActiveRoom,
  socket,
  connected,
  currentUser,
  onOpenAuth,
  onSignOut,
  onNavigateToMeeting,
  onReturnToHome,
}) {
  const [activeTab, setActiveTab] = useState('App.jsx');
  const [files, setFiles] = useState({});
  const [activeNav, setActiveNav] = useState('Files'); // 'Rooms' | 'Files'
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [roomsList, setRoomsList] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [conflictAlert, setConflictAlert] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Sidebar visibility toggles for desktop
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Mobile view tab: 'editor' | 'files' | 'chat'
  const [mobileTab, setMobileTab] = useState('editor');

  const chatScrollRef = useRef(null);
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('codetogether_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 1. Fetch Rooms List
  const fetchRooms = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/rooms`);
      if (res.ok) {
        const data = await res.json();
        setRoomsList(data);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 2. Load Room Details (Files & Messages) when room changes
  useEffect(() => {
    const loadRoom = async () => {
      try {
        // Fetch files
        const roomRes = await fetch(`${backendUrl}/api/rooms/${activeRoom}`);
        if (roomRes.ok) {
          const roomData = await roomRes.json();
          const fileMap = {};
          if (roomData.files && roomData.files.length > 0) {
            roomData.files.forEach((f) => {
              fileMap[f.filename] = f.content;
            });
            setFiles(fileMap);
            if (!fileMap[activeTab]) {
              setActiveTab(roomData.files[0].filename);
            }
          }
        }

        // Fetch messages
        const msgRes = await fetch(`${backendUrl}/api/rooms/${activeRoom}/messages`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setChatMessages(msgData);
        }
      } catch (err) {
        console.warn('Failed to load room details:', err);
      }
    };

    loadRoom();
  }, [activeRoom]);

  // 3. Socket.IO Listeners for Real-Time Synchronization
  useEffect(() => {
    if (!socket) return;

    // Receive live presence updates
    const handlePresence = (data) => {
      if (data && data.collaborators) {
        setCollaborators(data.collaborators);
      }
    };

    // Receive live code updates from other users with collision awareness
    const handleCodeUpdate = ({ file, code, version, sender, hasCollision }) => {
      setFiles((prev) => ({
        ...prev,
        [file]: code,
      }));
      if (hasCollision) {
        setConflictAlert(`Concurrent edit synchronized from ${sender} on ${file}.`);
        setTimeout(() => setConflictAlert(null), 4000);
      }
    };

    // Receive real-time chat messages (deduplicated)
    const handleChatMessage = (msg) => {
      setChatMessages((prev) => {
        if (
          prev.some(
            (m) =>
              m.id === msg.id ||
              (m.sender === msg.sender && m.text === msg.text && m.time === msg.time)
          )
        ) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    // Receive file created/deleted by collaborators
    const handleFileCreated = (file) => {
      setFiles((prev) => ({ ...prev, [file.filename]: file.content }));
    };

    const handleFileDeleted = ({ filename }) => {
      setFiles((prev) => {
        const copy = { ...prev };
        delete copy[filename];
        return copy;
      });
      setActiveTab((prev) => (prev === filename ? Object.keys(files)[0] || 'App.jsx' : prev));
    };

    socket.on('presence:list', handlePresence);
    socket.on('code:update', handleCodeUpdate);
    socket.on('chat:message', handleChatMessage);
    socket.on('file:created', handleFileCreated);
    socket.on('file:deleted', handleFileDeleted);

    return () => {
      socket.off('presence:list', handlePresence);
      socket.off('code:update', handleCodeUpdate);
      socket.off('chat:message', handleChatMessage);
      socket.off('file:created', handleFileCreated);
      socket.off('file:deleted', handleFileDeleted);
    };
  }, [socket, files]);

  // 4. Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 5. Code editing & synchronization
  const handleEditorChange = (e) => {
    const newCode = e.target.value;
    setFiles((prev) => ({
      ...prev,
      [activeTab]: newCode,
    }));

    // Emit live change to other socket participants
    if (socket && socket.connected) {
      socket.emit('code:change', {
        room: activeRoom,
        file: activeTab,
        code: newCode,
      });
    }

    // Debounced auto-save to backend API with auth header
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${backendUrl}/api/rooms/${activeRoom}/files/${activeTab}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ content: newCode }),
        });
        if (res.ok) {
          setSavedStatus(true);
          setTimeout(() => setSavedStatus(false), 2000);
        } else if (res.status === 401) {
          onOpenAuth?.();
        }
      } catch (err) {}
    }, 1000);
  };

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // 6. Switch active file and notify socket
  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    if (socket && socket.connected) {
      socket.emit('file:switch', { room: activeRoom, file: tab });
    }
  };

  // 7. Send chat message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    if (socket && socket.connected) {
      socket.emit('chat:send', { room: activeRoom, text: inputText.trim() });
    }
    setInputText('');
  };

  // 8. Delete file
  const handleDeleteFile = async (e, filename) => {
    e.stopPropagation();
    if (Object.keys(files).length <= 1) return;

    try {
      await fetch(`${backendUrl}/api/rooms/${activeRoom}/files/${filename}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      setFiles((prev) => {
        const copy = { ...prev };
        delete copy[filename];
        return copy;
      });

      if (socket && socket.connected) {
        socket.emit('file:delete', { room: activeRoom, filename });
      }

      const remaining = Object.keys(files).filter((f) => f !== filename);
      if (remaining.length > 0) {
        setActiveTab(remaining[0]);
      }
    } catch (err) {}
  };

  const currentCode = files[activeTab] || '';
  const lines = currentCode.split('\n');
  const liveCollaborators = Array.isArray(collaborators) ? collaborators : [];

  return (
    <div className="w-full h-screen flex flex-col bg-[#070B14] text-slate-100 overflow-hidden text-left select-text">
      {/* =========================================================================
          TOP WORKSPACE TOOLBAR (Height: 56px)
         ========================================================================= */}
      <header className="h-14 bg-[#091124] border-b border-blue-900/40 px-3 sm:px-4 flex items-center justify-between select-none shrink-0 z-20">
        {/* Left Section: Back to Home + Logo + Room Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onReturnToHome && (
            <button
              onClick={onReturnToHome}
              title="Return to Home"
              className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 hover:bg-blue-900/50 hover:text-white text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Home</span>
            </button>
          )}

          {/* CodeTogether Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 p-[1px]">
              <div className="w-full h-full rounded-[7px] bg-[#0A1226] flex items-center justify-center">
                <span className="font-code font-bold text-xs text-sky-400">&lt;/&gt;</span>
              </div>
            </div>
            <span className="font-bold text-sm text-white tracking-tight hidden sm:inline">
              Code<span className="text-[#38BDF8]">Together</span>
            </span>
          </div>

          {/* Room Selector Pill */}
          <div className="relative">
            <div
              onClick={() => setActiveNav(activeNav === 'Rooms' ? 'Files' : 'Rooms')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0C1733] border border-blue-800/40 hover:border-blue-500/50 text-xs text-slate-200 cursor-pointer transition-all"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold">{activeRoom || 'ASTU_DreamTeam'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{connected ? 'Live Sync' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Center Section: Active File & Cloud Save Status */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#081024] border border-blue-900/30 text-xs">
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-slate-200">{activeTab}</span>
          </div>

          {savedStatus && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 animate-in fade-in">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </div>
          )}
        </div>

        {/* Right Section: Call Triggers + Collaborators + Sidebar Toggles + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Voice & Video Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigateToMeeting?.(activeRoom, 'audio')}
              title="Start Voice Call"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-950/70 border border-blue-700/50 hover:bg-blue-900/60 text-xs text-sky-300 hover:text-white transition-all cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline text-xs">Voice</span>
            </button>
            <button
              onClick={() => onNavigateToMeeting?.(activeRoom, 'video')}
              title="Join Video Meeting"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-xs font-medium text-white shadow-sm transition-all cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden xl:inline text-xs">Video Call</span>
            </button>
          </div>

          {/* Collaborator Avatars */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>{liveCollaborators.length}</span>
            <span className="hidden xl:inline">online</span>
          </div>

          {liveCollaborators.length > 0 && (
            <div className="hidden sm:flex items-center -space-x-1.5">
              {liveCollaborators.slice(0, 3).map((collab, i) =>
                collab.avatar ? (
                  <img
                    key={collab.id || collab.socketId || i}
                    src={collab.avatar}
                    alt={collab.name}
                    title={collab.name}
                    className="w-6 h-6 rounded-full border border-[#091124] object-cover ring-1 ring-blue-500/40"
                  />
                ) : (
                  <div
                    key={collab.id || collab.socketId || i}
                    title={collab.name}
                    className="w-6 h-6 rounded-full bg-blue-700 border border-[#091124] text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-blue-500/40"
                  >
                    {(collab.name || '?').charAt(0).toUpperCase()}
                  </div>
                )
              )}
            </div>
          )}

          {/* Desktop Sidebar Toggle Buttons */}
          <div className="hidden lg:flex items-center gap-1 border-l border-blue-900/40 pl-2">
            <button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              title={showLeftSidebar ? 'Collapse File Tree' : 'Expand File Tree'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors cursor-pointer"
            >
              {showLeftSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-sky-400" />}
            </button>
            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              title={showRightSidebar ? 'Collapse Team Chat' : 'Expand Team Chat'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors cursor-pointer"
            >
              {showRightSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4 text-sky-400" />}
            </button>
          </div>

          {/* User Profile / Auth Button */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                id="btn-user-profile"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-950/70 border border-blue-700/40 text-xs text-slate-200 hover:border-blue-500 transition-colors cursor-pointer"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {(currentUser.username || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-medium max-w-[90px] truncate">{currentUser.username}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#091124] border border-blue-900/60 shadow-2xl p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-2 border-b border-blue-950/60 mb-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.username}</p>
                    {currentUser.email && (
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSignOut?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                id="btn-auth-trigger"
                onClick={() => onOpenAuth?.('login')}
                className="px-3 py-1 rounded-xl bg-blue-950/70 border border-blue-700/40 text-xs text-sky-300 hover:text-white hover:bg-blue-900/50 cursor-pointer transition-colors"
              >
                Sign In
              </button>
              <button
                id="btn-signup-trigger"
                onClick={() => onOpenAuth?.('register')}
                className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-sm cursor-pointer transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE 3-PANEL BODY (Takes all remaining screen height)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* A. LEFT SIDEBAR: Project Rooms & Files Explorer */}
        <aside
          className={`
            ${showLeftSidebar ? 'w-64 sm:w-72' : 'w-0 overflow-hidden'}
            ${mobileTab === 'files' ? 'flex w-full absolute inset-0 z-30' : 'hidden lg:flex'}
            bg-[#080F22] border-r border-blue-900/40 flex-col justify-between shrink-0 transition-all duration-200
          `}
        >
          <div className="flex-1 flex flex-col overflow-y-auto p-3 space-y-4">
            {/* Primary Nav Switcher */}
            <div className="flex bg-[#060B18] p-1 rounded-xl border border-blue-900/30 gap-1">
              <button
                onClick={() => setActiveNav('Files')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeNav === 'Files'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderCode className="w-3.5 h-3.5" />
                <span>Files</span>
              </button>
              <button
                onClick={() => setActiveNav('Rooms')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeNav === 'Rooms'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Rooms</span>
              </button>
            </div>

            {/* TAB 1: FILE EXPLORER */}
            {activeNav === 'Files' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-300">
                  <span className="uppercase tracking-wider text-[10px] text-slate-400">Project Files</span>
                  <button
                    id="btn-create-file-trigger"
                    title="Add File"
                    onClick={() => setIsCreateFileOpen(true)}
                    className="p-1 rounded-lg text-sky-400 hover:text-white hover:bg-blue-900/50 cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New File</span>
                  </button>
                </div>

                <div className="space-y-1">
                  {Object.keys(files).length > 0 ? (
                    Object.keys(files).map((tab) => {
                      const isActive = activeTab === tab;
                      return (
                        <div
                          key={tab}
                          onClick={() => {
                            handleTabSelect(tab);
                            if (mobileTab === 'files') setMobileTab('editor');
                          }}
                          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-blue-600/30 text-sky-300 border border-blue-500/40 font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                            <span className="truncate">{tab}</span>
                          </div>
                          {Object.keys(files).length > 1 && (
                            <button
                              title="Delete file"
                              onClick={(e) => handleDeleteFile(e, tab)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 rounded transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-4 text-center text-xs text-slate-500 italic">
                      No files loaded
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ROOMS LIST */}
            {activeNav === 'Rooms' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-300">
                  <span className="uppercase tracking-wider text-[10px] text-slate-400">Available Rooms</span>
                  <button
                    title="Create Room"
                    onClick={() => setIsCreateRoomOpen(true)}
                    className="p-1 rounded-lg text-sky-400 hover:text-white hover:bg-blue-900/50 cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Room</span>
                  </button>
                </div>

                <div className="space-y-1">
                  {roomsList.length > 0 ? (
                    roomsList.map((room) => {
                      const isSelected = (activeRoom || 'ASTU_DreamTeam') === room.name;
                      return (
                        <div
                          key={room.name}
                          onClick={() => {
                            if (setActiveRoom) setActiveRoom(room.name);
                            if (mobileTab === 'files') setMobileTab('editor');
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-600/30 text-white border border-blue-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2 h-2 rounded-full ${room.dotColor || 'bg-emerald-400'}`}></span>
                            <span className="truncate">{room.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded-full bg-blue-950/50 border border-blue-900/40">
                            {room.online || 0} online
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-4 text-center text-xs text-slate-500 italic">
                      No rooms found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-blue-900/30 text-xs text-slate-400 flex items-center justify-between">
            <span>Room: {activeRoom}</span>
            <span className="text-[11px] text-emerald-400">Online</span>
          </div>
        </aside>

        {/* B. CENTRAL DOMINANT CODE EDITOR */}
        <main
          className={`
            ${mobileTab !== 'editor' ? 'hidden lg:flex' : 'flex'}
            flex-1 flex-col bg-[#050914] min-w-0 h-full overflow-hidden
          `}
        >
          {/* File Tabs Bar */}
          <div className="h-10 bg-[#070D1A] border-b border-blue-900/40 px-3 flex items-center gap-1.5 overflow-x-auto select-none shrink-0">
            {Object.keys(files).length > 0 ? (
              Object.keys(files).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <div
                    key={tab}
                    onClick={() => handleTabSelect(tab)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#050914] text-sky-300 border-t-2 border-sky-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/20'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-sky-400" />
                    <span>{tab}</span>
                    {Object.keys(files).length > 1 && (
                      <button
                        title="Delete file"
                        onClick={(e) => handleDeleteFile(e, tab)}
                        className="opacity-0 group-hover:opacity-100 ml-1 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-1 text-xs text-slate-500">Loading files...</div>
            )}

            <button
              title="Add File"
              onClick={() => setIsCreateFileOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Conflict Alert Banner */}
          {conflictAlert && (
            <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-1.5 text-xs text-amber-200 flex items-center gap-2 select-none shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{conflictAlert}</span>
            </div>
          )}

          {/* Full-Height Code Editor Canvas */}
          <div className="relative flex-1 flex p-4 overflow-hidden font-code text-sm leading-6">
            {/* Line numbers */}
            <div className="w-10 select-none text-slate-600 text-right pr-3 font-mono space-y-0 shrink-0">
              {lines.map((_, i) => (
                <div key={i} className="h-6 text-xs leading-6 text-slate-600">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code area with syntax highlighter and transparent editable textarea */}
            <div className="relative flex-1 h-full overflow-hidden">
              <div
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none whitespace-pre font-code text-sm leading-6 p-0 overflow-auto scrollbar-none"
              >
                {highlightCode(currentCode)}
              </div>

              <textarea
                ref={textareaRef}
                id="code-editor-textarea"
                value={currentCode}
                onChange={handleEditorChange}
                onScroll={handleScroll}
                spellCheck="false"
                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-sky-400 resize-none outline-none font-code text-sm leading-6 p-0 border-0 focus:ring-0 whitespace-pre overflow-auto font-normal selection:bg-blue-600/40 z-10"
              />
            </div>
          </div>
        </main>

        {/* C. RIGHT SIDEBAR: Live Collaborators & Team Chat */}
        <aside
          className={`
            ${showRightSidebar ? 'w-72 sm:w-80' : 'w-0 overflow-hidden'}
            ${mobileTab === 'chat' ? 'flex w-full absolute inset-0 z-30' : 'hidden lg:flex'}
            bg-[#080F22] border-l border-blue-900/40 flex-col justify-between shrink-0 transition-all duration-200
          `}
        >
          {/* Active Collaborators Section */}
          <div className="p-3.5 border-b border-blue-900/30">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Active Collaborators</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/30">
                {liveCollaborators.length} Online
              </span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {liveCollaborators.length > 0 ? (
                liveCollaborators.map((user, idx) => (
                  <div
                    key={user.id || user.socketId || `${user.name}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#0A142A] border border-blue-900/30 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/30"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-700/80 text-white font-bold text-[10px] flex items-center justify-center ring-1 ring-blue-500/30">
                            {(user.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${user.statusColor || 'bg-emerald-400'} ring-1 ring-[#080F22]`}
                        ></span>
                      </div>
                      <div className="text-left leading-tight truncate">
                        <div className="font-semibold text-slate-200 truncate">{user.name}</div>
                        <div className="text-[10px] text-sky-400 truncate">{user.activity || 'Editing'}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-3 px-2 text-center text-xs text-slate-400 italic">
                  No other collaborators in this room right now
                </div>
              )}
            </div>
          </div>

          {/* Integrated Chat Panel */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            <div className="flex items-center justify-between pb-2 text-xs font-semibold text-slate-200 border-b border-blue-900/30 mb-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Room Discussion</span>
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin text-xs"
            >
              {chatMessages.length > 0 ? (
                chatMessages.map((msg, i) => (
                  <div key={msg.id || i} className="flex items-start gap-2">
                    {msg.avatar ? (
                      <img
                        src={msg.avatar}
                        alt={msg.sender}
                        className="w-5 h-5 rounded-full object-cover mt-0.5 ring-1 ring-blue-500/20 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-blue-700/80 text-white font-bold text-[9px] flex items-center justify-center ring-1 ring-blue-500/20 shrink-0 mt-0.5">
                        {(msg.sender || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 text-left leading-tight">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-slate-200 text-xs">{msg.sender}</span>
                        <span className="text-[9px] text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 bg-[#0C1733] p-2 rounded-xl border border-blue-900/40 inline-block leading-relaxed break-words max-w-full">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                  <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No messages yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Start collaborating with your team!</p>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 pt-2 border-t border-blue-900/30">
              <input
                type="text"
                id="input-chat-box"
                placeholder="Type a message to team..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#060B18] border border-blue-900/50 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
              />
              <button
                type="submit"
                id="btn-chat-send"
                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          MOBILE VIEW TAB SWITCHER (Visible only on screens < 1024px)
         ========================================================================= */}
      <div className="lg:hidden h-12 bg-[#091124] border-t border-blue-900/40 flex items-center justify-around px-2 select-none shrink-0 z-40">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer ${
            mobileTab === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Editor</span>
        </button>
        <button
          onClick={() => setMobileTab('files')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer ${
            mobileTab === 'files' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          <FolderCode className="w-4 h-4" />
          <span>Files & Rooms</span>
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer ${
            mobileTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat ({chatMessages.length})</span>
        </button>
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onRoomCreated={(newRoom) => {
          setRoomsList((prev) => [...prev, newRoom]);
          if (setActiveRoom) setActiveRoom(newRoom.name);
        }}
      />

      <CreateFileModal
        isOpen={isCreateFileOpen}
        onClose={() => setIsCreateFileOpen(false)}
        activeRoom={activeRoom}
        onFileCreated={(filename, content) => {
          setFiles((prev) => ({ ...prev, [filename]: content }));
          setActiveTab(filename);
          if (socket && socket.connected) {
            socket.emit('file:create', { room: activeRoom, file: { filename, content } });
          }
        }}
      />
    </div>
  );
}
