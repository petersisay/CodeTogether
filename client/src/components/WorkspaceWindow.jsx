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
} from 'lucide-react';
import highlightCode from './SyntaxHighlighter.jsx';

const INITIAL_FILES = {
  'App.jsx': `import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';

function App() {
  const [messages, setMessages] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('message', (data) => {
        setMessages(prev => [...prev, data]);
      });
    }

    return () => {
      socket?.off('message');
    };
  }, [socket]);

  return (
    <div className="app">
      <h1>CodeTogether</h1>
      <p>Real-time coding. Real connections.</p>
    </div>
  );
}

export default App;`,
  'index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  'style.css': `/* CodeTogether styles */
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #070B14;
  color: #F8FAFC;
  font-family: 'Inter', sans-serif;
}

h1 {
  font-size: 2.5rem;
  color: #38BDF8;
  margin-bottom: 0.5rem;
}`,
};

export default function WorkspaceWindow({
  activeRoom,
  setActiveRoom,
  onCodeChange,
  socket,
  connected,
}) {
  const [activeTab, setActiveTab] = useState('App.jsx');
  const [files, setFiles] = useState(INITIAL_FILES);
  const [activeNav, setActiveNav] = useState('Rooms');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'Petros',
      time: '10:24',
      text: 'This looks great! 🚀',
      avatar: '/assets/avatar-petros.png',
    },
    {
      id: 2,
      sender: 'Habtu',
      time: '10:25',
      text: 'I added the new function. Check it out.',
      avatar: '/assets/avatar-habtu.png',
    },
    {
      id: 3,
      sender: 'Mekdes',
      time: '10:26',
      text: "Nice! Let's test it now. ✅",
      avatar: '/assets/avatar-mekdes.png',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef(null);
  const textareaRef = useRef(null);
  const preRef = useRef(null);

  const roomsList = [
    { name: 'ASTU_DreamTeam', online: 3, dotColor: 'bg-emerald-400' },
    { name: 'Web Development', online: 2, dotColor: 'bg-emerald-400' },
    { name: 'React Project', online: 1, dotColor: 'bg-blue-400' },
    { name: 'General Chat', online: 0, dotColor: 'bg-slate-500' },
  ];

  const collaborators = [
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

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteCode = ({ file, code }) => {
      setFiles((prev) => ({ ...prev, [file]: code }));
    };

    const handleRemoteMessage = (message) => {
      setChatMessages((prev) => [...prev, message]);
    };

    socket.on('code:update', handleRemoteCode);
    socket.on('chat:message', handleRemoteMessage);

    return () => {
      socket.off('code:update', handleRemoteCode);
      socket.off('chat:message', handleRemoteMessage);
    };
  }, [socket]);

  const handleEditorChange = (e) => {
    const newCode = e.target.value;
    setFiles((prev) => ({
      ...prev,
      [activeTab]: newCode,
    }));

    if (onCodeChange) {
      onCodeChange(activeTab, newCode);
    }
    if (socket && socket.connected) {
      socket.emit('code:change', { room: activeRoom, file: activeTab, code: newCode });
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg = {
      id: Date.now(),
      sender: 'Petros',
      time: timeStr,
      text: inputText.trim(),
      avatar: '/assets/avatar-petros.png',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputText('');

    if (socket && socket.connected) {
      socket.emit('chat:send', { room: activeRoom, message: newMsg });
    }
  };

  const currentCode = files[activeTab] || '';
  const lines = currentCode.split('\n');

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

        {/* Right: Live indicator + Collaborators */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <span>3 online</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>

          {/* Overlapping collaborator avatar circles */}
          <div className="flex items-center -space-x-1.5">
            <img
              src="/assets/avatar-petros.png"
              alt="Petros"
              className="w-5 h-5 rounded-full border border-[#0A1226] object-cover ring-1 ring-blue-500/40"
            />
            <img
              src="/assets/avatar-habtu.png"
              alt="Habtu"
              className="w-5 h-5 rounded-full border border-[#0A1226] object-cover ring-1 ring-emerald-500/40"
            />
            <img
              src="/assets/avatar-mekdes.png"
              alt="Mekdes"
              className="w-5 h-5 rounded-full border border-[#0A1226] object-cover ring-1 ring-purple-500/40"
            />
          </div>
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
                  className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-900/50 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1">
                {roomsList.map((room) => {
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
                        <span className={`w-1.5 h-1.5 rounded-full ${room.dotColor}`}></span>
                        <span className="truncate">{room.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 px-1 rounded bg-blue-950/50">
                        {room.online}
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
          {/* File Tabs */}
          <div className="flex items-center bg-[#080E1E] border-b border-blue-900/40 px-2 pt-1 gap-1 overflow-x-auto select-none">
            {['App.jsx', 'index.js', 'style.css'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-code cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#070D1A] text-sky-300 border-t border-x border-blue-500/30 border-b-transparent font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/20'
                  }`}
                >
                  <FolderCode className="w-3 h-3 text-slate-500" />
                  <span>{tab}</span>
                </button>
              );
            })}
          </div>

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
              {/* Highlighted text behind */}
              <div
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none whitespace-pre font-code text-xs leading-5 p-0 overflow-auto scrollbar-none"
              >
                {highlightCode(currentCode)}
              </div>

              {/* Editable input overlay with identical typography and caret */}
              <textarea
                ref={textareaRef}
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
              {collaborators.map((user) => (
                <div key={user.name} className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/30"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${user.statusColor} ring-1 ring-[#080F22]`}
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
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-1.5">
                  <img
                    src={msg.avatar}
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
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#060B18] border border-blue-900/40 focus:border-blue-500 rounded-lg px-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 outline-none transition-colors"
              />
              <button
                type="submit"
                className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-2.5 h-2.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
