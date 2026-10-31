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
        <span className="text-xs font-bold text-sky-400 tracking-wider uppercase bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border border-indigo-700/50 px-4 py-1.5 rounded-full inline-block mb-3 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
          Core Capabilities
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Everything You Need to{' '}
          <span className="gradient-text-combined">
            Code Together
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
          Engineered for engineering students, hackathon squads, and pair programmers who demand frictionless, live synchronization.
        </p>
      </div>

      {/* 3x2 Feature Cards Grid with Combined Harmonious Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {features.map((feat, index) => {
          const Icon = feat.icon;
          const cardStyles = [
            {
              border: 'border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_4px_25px_rgba(6,182,212,0.15)] hover:shadow-[0_0_35px_rgba(6,182,212,0.3)]',
              bg: 'from-[#081628] via-[#061020] to-[#070D1B]',
              icon: 'bg-cyan-950/70 border-cyan-500/50 text-cyan-400 group-hover:text-cyan-300',
              badge: 'text-cyan-300 bg-cyan-950/70 border-cyan-800/60',
              accentText: 'text-cyan-400',
            },
            {
              border: 'border-indigo-500/30 hover:border-indigo-400/60 shadow-[0_4px_25px_rgba(99,102,241,0.15)] hover:shadow-[0_0_35px_rgba(99,102,241,0.3)]',
              bg: 'from-[#0D1432] via-[#090E24] to-[#070D1B]',
              icon: 'bg-indigo-950/70 border-indigo-500/50 text-indigo-400 group-hover:text-indigo-300',
              badge: 'text-indigo-300 bg-indigo-950/70 border-indigo-800/60',
              accentText: 'text-indigo-400',
            },
            {
              border: 'border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_4px_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.3)]',
              bg: 'from-[#081C1B] via-[#061414] to-[#070D1B]',
              icon: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400 group-hover:text-emerald-300',
              badge: 'text-emerald-300 bg-emerald-950/70 border-emerald-800/60',
              accentText: 'text-emerald-400',
            },
            {
              border: 'border-purple-500/30 hover:border-purple-400/60 shadow-[0_4px_25px_rgba(168,85,247,0.15)] hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]',
              bg: 'from-[#160E2A] via-[#100A20] to-[#070D1B]',
              icon: 'bg-purple-950/70 border-purple-500/50 text-purple-400 group-hover:text-purple-300',
              badge: 'text-purple-300 bg-purple-950/70 border-purple-800/60',
              accentText: 'text-purple-400',
            },
            {
              border: 'border-rose-500/30 hover:border-rose-400/60 shadow-[0_4px_25px_rgba(244,63,94,0.15)] hover:shadow-[0_0_35px_rgba(244,63,94,0.3)]',
              bg: 'from-[#1A0E1C] via-[#120914] to-[#070D1B]',
              icon: 'bg-rose-950/70 border-rose-500/50 text-rose-400 group-hover:text-rose-300',
              badge: 'text-rose-300 bg-rose-950/70 border-rose-800/60',
              accentText: 'text-rose-400',
            },
            {
              border: 'border-sky-500/30 hover:border-sky-400/60 shadow-[0_4px_25px_rgba(56,189,248,0.15)] hover:shadow-[0_0_35px_rgba(56,189,248,0.3)]',
              bg: 'from-[#0A162E] via-[#071022] to-[#070D1B]',
              icon: 'bg-sky-950/70 border-sky-500/50 text-sky-400 group-hover:text-sky-300',
              badge: 'text-sky-300 bg-sky-950/70 border-sky-800/60',
              accentText: 'text-sky-400',
            },
          ][index % 6];

          return (
            <div
              key={index}
              className={`p-6 sm:p-7 rounded-2xl bg-gradient-to-b ${cardStyles.bg} border ${cardStyles.border} transition-all duration-200 group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all group-hover:scale-105 ${cardStyles.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cardStyles.badge}`}>
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

              <div className={`mt-6 pt-4 border-t border-slate-800/50 flex items-center text-[11px] font-semibold ${cardStyles.accentText}`}>
                <span>Production Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
