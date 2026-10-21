import React from 'react';
import { Layers, Cpu, Database, Network, Globe, Lock, Palette, Zap } from 'lucide-react';

export default function TechSection() {
  const technologies = [
    {
      name: 'React 19',
      category: 'Frontend Library',
      description: 'Component architecture with hooks, state synchronization, and reactive UI.',
      icon: Layers,
      highlight: 'v19.2',
    },
    {
      name: 'Vite',
      category: 'Build Tool & Bundler',
      description: 'Ultra-fast Hot Module Replacement and production bundle optimization (425ms build).',
      icon: Zap,
      highlight: 'Fast HMR',
    },
    {
      name: 'Node.js & Express',
      category: 'Backend Server',
      description: 'Modular ES modules server handling RESTful APIs and room management on Render.',
      icon: Cpu,
      highlight: 'REST APIs',
    },
    {
      name: 'Socket.IO',
      category: 'Real-Time Protocol',
      description: 'Low-latency bi-directional WebSockets for keystroke broadcast and presence.',
      icon: Network,
      highlight: 'Sub-ms Sync',
    },
    {
      name: 'MongoDB Atlas',
      category: 'Cloud Database',
      description: 'Stores persistent users, room documents, file contents, and chat message history.',
      icon: Database,
      highlight: 'Atlas Cloud',
    },
    {
      name: 'WebRTC',
      category: 'Audio & Video Mesh',
      description: 'Direct browser peer-to-peer media streams with speaking wave visualizers.',
      icon: Globe,
      highlight: 'Native P2P',
    },
    {
      name: 'Google Identity Services',
      category: 'Cryptographic Auth',
      description: 'Cryptographically verified ID tokens with server-side signature validation.',
      icon: Lock,
      highlight: 'Verified Only',
    },
    {
      name: 'Tailwind CSS',
      category: 'Styling System',
      description: 'Utility-first dark-mode developer aesthetics with custom electric blue theme.',
      icon: Palette,
      highlight: 'Dark Theme',
    },
  ];

  return (
    <section id="technology" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-left border-t border-blue-900/30">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
        <span className="text-xs font-bold text-sky-400 tracking-wider uppercase bg-blue-950/70 border border-blue-800/40 px-3.5 py-1.5 rounded-full inline-block mb-3">
          Architecture
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Modern & Reliable{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Technology Stack
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
          Engineered purely with verified, production-grade tools. No bloated mock dependencies.
        </p>
      </div>

      {/* Responsive Tech Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {technologies.map((tech, idx) => {
          const Icon = tech.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#091122] border border-blue-900/40 hover:border-blue-500/50 shadow-md hover:shadow-[0_0_25px_rgba(37,99,235,0.2)] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-700/40 flex items-center justify-center text-sky-400 group-hover:scale-105 group-hover:text-cyan-300 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-sky-300 px-2 py-0.5 rounded-full bg-blue-950/70 border border-blue-800/50">
                    {tech.highlight}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  {tech.name}
                </h3>
                <span className="text-[11px] font-medium text-slate-400 block mb-2">
                  {tech.category}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {tech.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
