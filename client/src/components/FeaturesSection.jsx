import React from 'react';
import { Zap, LayoutGrid, FolderCode, MessageSquare, Video, Users } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: 'Real-Time Collaborative Editing',
      description:
        'Concurrently edit files with fellow developers. Socket.IO broadcasts keystrokes with sequence ordering and collision alerts so code stays unified.',
      badge: 'Low Latency',
    },
    {
      icon: LayoutGrid,
      title: 'Dedicated Project Rooms',
      description:
        'Organize your work into private or public rooms like ASTU_DreamTeam. Switch between projects seamlessly with instant room-level state hydration.',
      badge: 'Isolated Workspaces',
    },
    {
      icon: FolderCode,
      title: 'Full File Management',
      description:
        'Create, edit, switch, and delete multiple source files (.jsx, .js, .css, .json). Automatic debounced cloud saving keeps your changes preserved.',
      badge: 'Auto-Save',
    },
    {
      icon: MessageSquare,
      title: 'Persistent Live Team Chat',
      description:
        'Coordinate with your team right alongside the code editor. Real-time chat messages are stored directly in MongoDB Atlas and deduplicated automatically.',
      badge: 'Integrated Chat',
    },
    {
      icon: Video,
      title: 'Voice & Video Meetings',
      description:
        'Jump into high-definition WebRTC audio/video meetings with zero plugins. Peer-to-peer mesh architecture keeps communication clear and synchronized.',
      badge: 'WebRTC P2P',
    },
    {
      icon: Users,
      title: 'Accurate Collaborator Presence',
      description:
        'See genuine connected teammates with verified avatars, online status, and current file focus. Zero fake bot accounts or simulated statistics.',
      badge: 'Authentic Presence',
    },
  ];

  return (
    <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-left">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
        <span className="text-xs font-bold text-sky-400 tracking-wider uppercase bg-blue-950/70 border border-blue-800/40 px-3.5 py-1.5 rounded-full inline-block mb-3">
          Core Capabilities
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Everything You Need to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Code Together
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
          Engineered for engineering students, hackathon squads, and pair programmers who demand frictionless, live synchronization.
        </p>
      </div>

      {/* 3x2 Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {features.map((feat, index) => {
          const Icon = feat.icon;
          return (
            <div
              key={index}
              className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-[#0A1226] to-[#070D1B] border border-blue-900/40 hover:border-blue-500/50 shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.25)] transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-950/70 border border-blue-700/50 flex items-center justify-center text-sky-400 group-hover:scale-105 group-hover:text-cyan-300 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 rounded-full bg-blue-950/50 border border-blue-900/50">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                  {feat.title}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  {feat.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-900/30 flex items-center text-[11px] font-semibold text-sky-400 group-hover:text-sky-300">
                <span>Production Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
