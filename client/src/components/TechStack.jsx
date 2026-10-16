import React from 'react';
import { Layers } from 'lucide-react';

export default function TechStack() {
  const stack = [
    {
      name: 'React',
      role: '(frontend)',
      color: '#38BDF8',
      icon: (
        <svg className="w-6 h-6" viewBox="-11.5 -10.23174 23 20.46348" fill="none">
          <circle cx="0" cy="0" r="2.05" fill="#38BDF8" />
          <g stroke="#38BDF8" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      ),
    },
    {
      name: 'Vite',
      role: '(build tool)',
      color: '#A855F7',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
          <path d="M29.5 5.5L16.8 28.2C16.4 28.9 15.6 28.9 15.2 28.2L2.5 5.5C2.1 4.7 2.7 3.8 3.6 4L15.6 6.3C15.9 6.4 16.1 6.4 16.4 6.3L28.4 4C29.3 3.8 29.9 4.7 29.5 5.5Z" fill="#7C3AED" />
          <path d="M19.5 4.5L11 17H16.5L13 25.5L23.5 13H17.5L20 4.5" fill="#FBBF24" />
        </svg>
      ),
    },
    {
      name: 'Node.js',
      role: '(backend)',
      color: '#22C55E',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
          <path d="M16 3L27.5 9.6V22.4L16 29L4.5 22.4V9.6L16 3Z" stroke="#22C55E" strokeWidth="2" fill="#14532D" fillOpacity="0.3" />
          <text x="16" y="19" textAnchor="middle" fill="#4ADE80" fontSize="10" fontWeight="bold" fontFamily="monospace">JS</text>
        </svg>
      ),
    },
    {
      name: 'Express',
      role: '(API)',
      color: '#E2E8F0',
      icon: (
        <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center font-bold text-xs text-white border border-slate-600">
          ex
        </div>
      ),
    },
    {
      name: 'Socket.IO',
      role: '(real-time)',
      color: '#F8FAFC',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" stroke="#E2E8F0" />
          <path d="M13 3L8 13H13L11 21L17 11H12L13 3Z" fill="#38BDF8" stroke="#38BDF8" strokeWidth="1" />
        </svg>
      ),
    },
    {
      name: 'MongoDB',
      role: '(database)',
      color: '#10B981',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 6 7 6 13C6 17 8.5 20.5 11.5 21.8L12 22L12.5 21.8C15.5 20.5 18 17 18 13C18 7 12 2 12 2Z" fill="#10B981" />
          <path d="M12 2V22C12.3 21.8 14.5 20 15 16C15.5 12 13 8 12 2Z" fill="#34D399" />
          <path d="M12 22V2C11.7 2 9 6 9 13C9 17 11 21 12 22Z" fill="#059669" />
        </svg>
      ),
    },
    {
      name: 'Tailwind CSS',
      role: '(styling)',
      color: '#38BDF8',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#38BDF8">
          <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-[#091124] border border-blue-900/40 p-4 flex flex-col text-left shadow-[0_4px_20px_rgba(7,11,20,0.5)]">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-sky-400">
          <Layers className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight">Tech Stack</h3>
      </div>

      {/* 7 Technologies in responsive row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 items-center justify-between">
        {stack.map((item) => (
          <div
            key={item.name}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#080E1D] border border-blue-950/60 hover:border-blue-700/40 transition-all text-center group"
          >
            <div className="w-8 h-8 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="text-xs font-bold text-slate-100">{item.name}</div>
            <div className="text-[10px] text-slate-400">{item.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
