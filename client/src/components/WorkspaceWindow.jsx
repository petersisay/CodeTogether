import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  LayoutGrid,
  FolderCode,
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
  onNavigateToMeeting,
}) {
  const [activeTab, setActiveTab] = useState('App.jsx');
  const [files, setFiles] = useState({});
  const [activeNav, setActiveNav] = useState('Rooms');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [roomsList, setRoomsList] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [conflictAlert, setConflictAlert] = useState(null);

  const chatScrollRef = useRef(null);
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const saveTimeoutRef = useRef(null);

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

  // 7. Send chat message (Single dispatch via authenticated socket to avoid duplicate DB records)
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

  // Fallback collaborators list matching reference image if socket list is still connecting
  const displayCollaborators =
    collaborators.length > 0
      ? collaborators
      : [
          {
            name: 'Petros',
            avatar: '/assets/avatar-petros.png',
            activity: 'Editing App.jsx',
            statusColor: 'bg-emerald-400',
          },
          {
            name: 'Habtu',
            avatar: '/assets/avatar-habtu.png',
            activity: 'Editing style.css',
            statusColor: 'bg-emerald-400',
          },
          {
            name: 'Mekdes',
            avatar: '/assets/avatar-mekdes.png',
            activity: 'Viewing index.js',
            statusColor: 'bg-emerald-400',
          },
        ];

  return (
    <div className="w-full rounded-2xl bg-[#080E1E] border border-blue-900/50 shadow-[0_0_40px_rgba(14,35,80,0.4)] overflow-hidden flex flex-col text-left">
      {/* 1. WORKSPACE HEADER */}
      <div className="h-11 bg-[#0A1226] border-b border-blue-900/40 px-3.5 flex items-center justify-between select-none">
        {/* Left: CodeTogether Logo */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-900/50 border border-blue-500/40 flex items-center justify-center">
            <span className="font-code text-[11px] text-sky-400 font-bold">&lt;/&gt;</span>
          </div>
          <span className="font-bold text-xs text-slate-100 tracking-tight">CodeTogether</span>
        </div>

        {/* Center: Workspace Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#0C1733] border border-blue-800/40 text-[11px] text-slate-200 cursor-pointer hover:border-blue-600/50 transition-colors">
          <LayoutGrid className="w-3 h-3 text-sky-400" />
          <span className="font-medium">{activeRoom || 'ASTU_DreamTeam'}</span>
          <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
        </div>

        {/* Right: Call Actions + Live indicator + Collaborators + User Login */}
        <div className="flex items-center gap-2">
          {/* Quick Voice & Video Call Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigateToMeeting?.(activeRoom, 'audio')}
              title="Start Voice Call"
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-700/50 text-[10px] text-sky-300 hover:text-white hover:bg-blue-900/60 cursor-pointer transition-all"
            >
              <Phone className="w-3 h-3 text-sky-400" />
              <span className="hidden md:inline">Voice</span>
            </button>
            <button
              onClick={() => onNavigateToMeeting?.(activeRoom, 'video')}
              title="Join Video Meeting"
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/40 border border-blue-500/50 text-[10px] text-sky-200 hover:text-white hover:bg-blue-600/60 cursor-pointer transition-all"
            >
              <Video className="w-3 h-3 text-cyan-300" />
              <span className="hidden md:inline">Video</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <span>{Math.max(displayCollaborators.length, 1)} online</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>

          {/* Overlapping collaborator avatar circles */}
          <div className="flex items-center -space-x-1.5 cursor-pointer" onClick={onOpenAuth}>
            {displayCollaborators.slice(0, 3).map((collab, i) => (
              <img
                key={i}
                src={collab.avatar}
                alt={collab.name}
                title={collab.name}
                className="w-5 h-5 rounded-full border border-[#0A1226] object-cover ring-1 ring-blue-500/40"
              />
            ))}
          </div>

          {/* User Sign In Badge */}
          <button
            id="btn-auth-trigger"
            onClick={onOpenAuth}
            className="px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-700/40 text-[10px] text-sky-300 hover:text-white hover:bg-blue-900/50 cursor-pointer transition-colors"
          >
            {currentUser ? currentUser.username : 'Sign In'}
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE BODY */}
      <div className="grid grid-cols-12 min-h-[490px] bg-[#070D1B]">
        {/* A. LEFT SIDEBAR */}
        <div className="col-span-12 sm:col-span-3 lg:col-span-3 bg-[#091124] border-r border-blue-900/30 p-2.5 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Primary Navigation */}
            <nav className="space-y-0.5">
              {[
                { name: 'Home', icon: Home },
                { name: 'Rooms', icon: LayoutGrid },
                { name: 'Files', icon: FolderCode },
                { name: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/20 text-sky-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/30'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* My Rooms Section */}
            <div className="pt-1 border-t border-blue-950/50">
              <div className="flex items-center justify-between px-1.5 mb-1.5 text-[11px] font-semibold text-slate-300">
                <span>My Rooms</span>
                <button
                  title="Create Room"
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-900/50 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1">
                {(roomsList.length > 0
                  ? roomsList
                  : [
                      { name: 'ASTU_DreamTeam', online: 3, dotColor: 'bg-emerald-400' },
                      { name: 'Web Development', online: 2, dotColor: 'bg-emerald-400' },
                      { name: 'React Project', online: 1, dotColor: 'bg-blue-400' },
                      { name: 'General Chat', online: 0, dotColor: 'bg-slate-500' },
                    ]
                ).map((room) => {
                  const isSelected = (activeRoom || 'ASTU_DreamTeam') === room.name;
                  return (
                    <div
                      key={room.name}
                      onClick={() => setActiveRoom && setActiveRoom(room.name)}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/30 text-white border border-blue-500/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${room.dotColor || 'bg-emerald-400'}`}></span>
                        <span className="truncate">{room.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 px-1 rounded bg-blue-950/50">
                        {room.online || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* B. CENTRAL CODE EDITOR */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-6 bg-[#070D1A] flex flex-col border-b sm:border-b-0 border-r border-blue-900/30">
          {/* File Tabs + Add File Button */}
          <div className="flex items-center bg-[#080E1E] border-b border-blue-900/40 px-2 pt-1 gap-1 overflow-x-auto select-none">
            {Object.keys(files).length > 0 ? (
              Object.keys(files).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <div
                    key={tab}
                    onClick={() => handleTabSelect(tab)}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-code cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#070D1A] text-sky-300 border-t border-x border-blue-500/30 border-b-transparent font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/20'
                    }`}
                  >
                    <FolderCode className="w-3 h-3 text-slate-500" />
                    <span>{tab}</span>
                    {Object.keys(files).length > 1 && (
                      <button
                        title="Delete file"
                        onClick={(e) => handleDeleteFile(e, tab)}
                        className="opacity-0 group-hover:opacity-100 ml-1 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-1 text-xs text-slate-500">Loading files...</div>
            )}

            {/* Plus Tab to Add New File */}
            <button
              id="btn-create-file-trigger"
              title="Add File"
              onClick={() => setIsCreateFileOpen(true)}
              className="p-1 rounded text-slate-500 hover:text-white hover:bg-blue-900/40 cursor-pointer ml-1"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Saved Indicator */}
            {savedStatus && (
              <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 pr-2">
                <Check className="w-2.5 h-2.5" />
                <span>Saved</span>
              </div>
            )}
          </div>

          {/* Conflict Alert Banner */}
          {conflictAlert && (
            <div className="bg-amber-950/80 border-b border-amber-500/40 px-3 py-1 text-[11px] text-amber-200 flex items-center gap-2 select-none">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{conflictAlert}</span>
            </div>
          )}

          {/* Code Canvas with Line Numbers & Syntax Highlighted View */}
          <div className="relative flex-1 flex p-2.5 overflow-hidden font-code text-xs leading-5">
            {/* Line numbers */}
            <div className="w-8 select-none text-slate-600 text-right pr-2.5 font-mono space-y-0">
              {lines.map((_, i) => (
                <div key={i} className="h-5 text-[11px] leading-5 text-slate-600">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code area with syntax highlighter and transparent editable textarea */}
            <div className="relative flex-1 h-full min-h-[380px] overflow-hidden">
              <div
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none whitespace-pre font-code text-xs leading-5 p-0 overflow-auto scrollbar-none"
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
                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-sky-400 resize-none outline-none font-code text-xs leading-5 p-0 border-0 focus:ring-0 whitespace-pre overflow-auto font-normal selection:bg-blue-600/40 z-10"
              />
            </div>
          </div>
        </div>

        {/* C. RIGHT SIDEBAR: Live Collaborators + Integrated Chat */}
        <div className="col-span-12 sm:col-span-3 lg:col-span-3 bg-[#080F22] flex flex-col justify-between">
          {/* Live Collaborators */}
          <div className="p-3 border-b border-blue-900/30">
            <div className="flex items-center justify-between mb-2.5 text-xs font-semibold text-slate-200">
              <span>Live Collaborators</span>
              <Maximize2 className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" />
            </div>

            <div className="space-y-2">
              {displayCollaborators.map((user, idx) => (
                <div key={user.socketId || `${user.name}-${user.activity || ''}-${idx}`} className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/30"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${user.statusColor || 'bg-emerald-400'} ring-1 ring-[#080F22]`}
                    ></span>
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-medium text-slate-200">{user.name}</div>
                    <div className="text-[10px] text-sky-400">{user.activity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integrated Chat Panel */}
          <div className="flex-1 flex flex-col p-2.5 min-h-[250px]">
            <div className="flex items-center justify-between mb-1.5 pb-1 text-xs font-semibold text-slate-200 border-b border-blue-950/40">
              <span>Chat</span>
              <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-white" />
            </div>

            {/* Chat Messages */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[180px] scrollbar-thin"
            >
              {chatMessages.map((msg, i) => (
                <div key={msg.id || i} className="flex items-start gap-1.5">
                  <img
                    src={msg.avatar || '/assets/avatar-petros.png'}
                    alt={msg.sender}
                    className="w-4 h-4 rounded-full object-cover mt-0.5 ring-1 ring-blue-500/20 shrink-0"
                  />
                  <div className="flex-1 text-left leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-200">{msg.sender}</span>
                      <span className="text-[8px] text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 bg-[#0C152E] px-2 py-0.5 rounded border border-blue-950/60 mt-0.5 inline-block leading-snug">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleSendMessage} className="mt-2 flex items-center gap-1.5 pt-1 border-t border-blue-950/40">
              <input
                type="text"
                id="input-chat-box"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#060B18] border border-blue-900/40 focus:border-blue-500 rounded-lg px-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 outline-none transition-colors"
              />
              <button
                type="submit"
                id="btn-chat-send"
                className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-2.5 h-2.5" />
              </button>
            </form>
          </div>
        </div>
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
