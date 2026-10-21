import React from 'react';
import { LayoutGrid, FolderCode, FileCode, MessageSquare, Users, Video, Phone, Check, ArrowRight, ExternalLink } from 'lucide-react';

export default function WorkspacePreview({ onLaunchWorkspace }) {
  const codeSnippet = `import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Real-Time Collaborative Workspace
export default function CollaborativeEditor() {
  const [code, setCode] = useState('// Welcome to CodeTogether');
  const [activeUsers, setActiveUsers] = useState(['Petros', 'Habtu', 'Mekdes']);

  useEffect(() => {
    // Synchronize edits seamlessly across all connected peers
    socket.on('code:update', ({ newCode, sender }) => {
      console.log(\`Received live updates from \${sender}\`);
      setCode(newCode);
    });
  }, []);

  return <Editor value={code} onChange={handleLiveSync} />;
}`;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Container with Blue Ambient Glow */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#080E1E] border border-blue-600/40 shadow-[0_0_60px_rgba(37,99,235,0.25)] overflow-hidden text-left transition-all group hover:border-blue-500/60">
        
        {/* Top Window Chrome / Title Bar */}
        <div className="h-12 bg-[#0A142A] border-b border-blue-900/50 px-4 flex items-center justify-between select-none">
          {/* macOS Window Dots */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
            <div className="ml-3 hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-200">
              <span className="text-sky-400 font-code">&lt;/&gt;</span>
              <span>CodeTogether IDE</span>
            </div>
          </div>

          {/* Room Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0C1836] border border-blue-800/40 text-xs text-sky-200">
            <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold">ASTU_DreamTeam</span>
            <span className="text-[10px] text-slate-400">/ App.jsx</span>
          </div>

          {/* Status & Call Icons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Collaboration</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-700/40 flex items-center justify-center text-sky-400">
                <Video className="w-3.5 h-3.5" />
              </span>
              <span className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-700/40 flex items-center justify-center text-sky-400">
                <Phone className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3-Column IDE Visual Layout */}
        <div className="grid grid-cols-12 min-h-[460px] bg-[#060B18]">
          {/* Left Mini Explorer (Hidden on mobile) */}
          <div className="hidden md:flex md:col-span-3 lg:col-span-2 bg-[#081024] border-r border-blue-900/30 p-3 flex-col justify-between">
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rooms</span>
                <div className="mt-1 space-y-1">
                  <div className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-sky-300 font-medium flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>ASTU_DreamTeam</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Hackathon_Squad</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Files</span>
                <div className="mt-1 space-y-1">
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#0C1A38] text-sky-200 font-medium flex items-center justify-between border-l-2 border-sky-400">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-sky-400" />
                      <span>App.jsx</span>
                    </div>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>authRoutes.js</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>styles.css</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-blue-900/30 text-[11px] text-slate-400">
              <span>Auto-saved to MongoDB</span>
            </div>
          </div>

          {/* Center Code Editor Preview */}
          <div className="col-span-12 md:col-span-6 lg:col-span-7 flex flex-col bg-[#050914] min-w-0">
            {/* Tab Bar */}
            <div className="h-9 bg-[#070D1B] border-b border-blue-900/40 flex items-center px-2 gap-1 overflow-x-auto">
              <div className="px-3 py-1 rounded-t-lg bg-[#050914] border-t-2 border-sky-400 text-xs font-semibold text-slate-100 flex items-center gap-2">
                <FileCode className="w-3 h-3 text-sky-400" />
                <span>App.jsx</span>
              </div>
              <div className="px-3 py-1 text-xs text-slate-400 flex items-center gap-2">
                <span>authRoutes.js</span>
              </div>
              <div className="px-3 py-1 text-xs text-slate-400 flex items-center gap-2">
                <span>styles.css</span>
              </div>
            </div>

            {/* Editor Code Area */}
            <div className="relative p-4 sm:p-5 font-code text-xs sm:text-sm text-slate-300 overflow-hidden leading-relaxed">
              <pre className="font-code leading-6">
                <code>
                  {codeSnippet.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="w-7 text-slate-600 select-none text-right pr-3">{i + 1}</span>
                      <span className="flex-1 whitespace-pre-wrap">{line}</span>
                    </div>
                  ))}
                </code>
              </pre>

              {/* Multi-User Cursor Indicators */}
              <div className="absolute top-28 left-48 hidden sm:flex items-center gap-1 bg-sky-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg animate-pulse">
                <span>Petros (editing)</span>
              </div>
              <div className="absolute bottom-20 right-28 hidden sm:flex items-center gap-1 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                <span>Habtu (viewing)</span>
              </div>
            </div>
          </div>

          {/* Right Mini Chat & Collaborators */}
          <div className="hidden lg:flex lg:col-span-3 bg-[#081024] border-l border-blue-900/30 p-3 flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Collaborators</span>
                  <span className="text-emerald-400 font-semibold">3 Active</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { name: 'Petros', role: 'Full Stack', active: true },
                    { name: 'Habtu', role: 'Frontend', active: true },
                    { name: 'Mekdes', role: 'Backend', active: true },
                  ].map((user) => (
                    <div key={user.name} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0A142A] border border-blue-900/30 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="font-semibold text-slate-200">{user.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{user.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Team Chat</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#0B1630] border border-blue-900/30">
                    <span className="text-[10px] font-bold text-sky-400">Petros: </span>
                    <span className="text-slate-300">Live sync and voice channels are ready!</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B1630] border border-blue-900/30">
                    <span className="text-[10px] font-bold text-purple-400">Habtu: </span>
                    <span className="text-slate-300">Testing multi-cursor edits now. Smooth!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-700/30 text-[11px] text-sky-300">
              <span>Ready to start real-time coding with your team?</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner with Action Button */}
        <div className="bg-[#0A142A] border-t border-blue-900/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>Interactive IDE showcase — Launch the full workspace to code, chat, and call live.</span>
          </div>

          <button
            onClick={onLaunchWorkspace}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer flex items-center gap-2 group active:scale-95"
          >
            <span>Launch Full Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
