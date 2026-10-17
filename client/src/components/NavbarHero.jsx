import React from 'react';
import { Zap, Users, MessageSquare, Cloud } from 'lucide-react';

export default function NavbarHero({ onStartCoding, currentUser }) {
  const features = [
    {
      icon: Zap,
      title: 'Real-time',
      subtitle: 'Collaboration',
    },
    {
      icon: Users,
      title: 'Team',
      subtitle: 'Workspaces',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      subtitle: '& Voice',
    },
    {
      icon: Cloud,
      title: 'Cloud',
      subtitle: 'Ready',
    },
  ];

  return (
    <section className="w-full flex flex-col justify-start text-left pt-2 pb-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 mb-2">
        <div className="w-12 h-12 rounded-xl bg-[#0B1528] border border-blue-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          <span className="font-code font-bold text-xl text-sky-400">&lt;/&gt;</span>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center m-0">
            Code<span className="text-[#38BDF8]">Together</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-sky-400/90 mt-0.5">
            Code <span className="text-blue-500">•</span> Collaborate <span className="text-blue-500">•</span> Build Together
          </p>
        </div>
      </div>

      {/* Main Description */}
      <div className="mt-4 max-w-xl">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
          A real-time collaborative coding workspace for students, developers and teams.
        </h2>
        <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
          CodeTogether lets you write, edit, and run code together in real time. Share ideas, solve problems, and build amazing projects — no matter where you are.
        </p>
      </div>

      {/* 4 Feature Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 max-w-xl">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-xl bg-[#091122]/90 border border-blue-900/40 hover:border-blue-500/40 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-700/40 flex items-center justify-center text-sky-400 shrink-0 group-hover:bg-blue-900/50 group-hover:text-cyan-300 transition-all">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left leading-tight truncate">
                <div className="text-[11px] font-semibold text-slate-200 truncate">{item.title}</div>
                <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Call-to-action & Handwritten Slogan */}
      <div className="flex flex-wrap items-center gap-5 mt-7">
        <button
          onClick={onStartCoding}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.5)] transition-all cursor-pointer flex items-center gap-2 group active:scale-95"
        >
          <span>{currentUser ? `Continue as ${currentUser.username}` : 'Start Coding Together'}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <div className="font-handwriting text-xl sm:text-2xl text-sky-300/90 -rotate-3 select-none drop-shadow-[0_2px_8px_rgba(56,189,248,0.2)]">
          Better code with better people.
        </div>
      </div>
    </section>
  );
}
