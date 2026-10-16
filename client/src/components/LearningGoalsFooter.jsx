import React from 'react';
import { Target, Check, Rocket } from 'lucide-react';

export default function LearningGoalsFooter({ onLetsGo }) {
  const col1 = [
    'Understand real-time systems (WebSockets)',
    'Learn collaboration and conflict resolution',
    'Build a full MERN stack application',
  ];

  const col2 = [
    'Practice clean code and Git workflow',
    'Improve problem-solving and communication',
    'Create an impressive portfolio project',
  ];

  return (
    <footer className="w-full mt-6 pt-5 pb-8 border-t border-blue-900/30 flex flex-col lg:flex-row items-center justify-between gap-6 text-left">
      {/* 1. Left: Handwritten Slogan */}
      <div className="shrink-0">
        <div className="font-handwriting text-2xl sm:text-3xl text-sky-300 -rotate-2 select-none drop-shadow-[0_2px_8px_rgba(56,189,248,0.25)]">
          Real People. Real Time. Real Projects.
        </div>
      </div>

      {/* 2. Middle: Learning Goals */}
      <div className="flex-1 max-w-2xl px-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-sky-400">
            <Target className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white tracking-tight">Learning Goals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-300">
          <div className="space-y-1.5">
            {col1.map((goal, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{goal}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {col2.map((goal, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Right: Ready CTA & Rocket */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-600/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          <Rocket className="w-5 h-5 text-sky-400" />
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <div className="text-xs font-semibold text-slate-200">
            Ready to build something amazing?
          </div>
          <button
            onClick={onLetsGo}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium text-xs shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all cursor-pointer flex items-center gap-1.5 group active:scale-95"
          >
            <span>Let's Go!</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
