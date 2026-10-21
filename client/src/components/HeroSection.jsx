import React from 'react';
import { ArrowRight, Sparkles, Zap, Users, Video, ShieldCheck } from 'lucide-react';

export default function HeroSection({ onStartCoding, onExploreFeatures, currentUser }) {
  const highlights = [
    { icon: Zap, text: 'Real-Time Sync' },
    { icon: Users, text: 'Live Presence' },
    { icon: Video, text: 'Integrated Video Calls' },
    { icon: ShieldCheck, text: 'Verified Google Auth' },
  ];

  return (
    <section className="relative w-full pt-16 sm:pt-24 pb-12 sm:pb-16 flex flex-col items-center text-center px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Decorative Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.25)] mb-6 animate-in fade-in duration-300">
        <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
        <span className="text-xs font-semibold text-sky-300 tracking-wide">
          Real-Time Collaborative Coding for Developers & Teams
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl">
        Code Together.{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-400">
          Build Something Amazing.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
        Collaborate on code in real time, communicate with your team, and turn ideas into working projects — all in one unified workspace.
      </p>

      {/* Primary & Secondary CTA Buttons */}
      <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onStartCoding}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold text-sm sm:text-base shadow-[0_0_30px_rgba(37,99,235,0.45)] hover:shadow-[0_0_40px_rgba(56,189,248,0.6)] transition-all cursor-pointer flex items-center gap-2.5 active:scale-95 group"
        >
          <span>{currentUser ? `Enter Workspace as ${currentUser.username}` : 'Start Coding Together'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onExploreFeatures}
          className="px-7 py-3.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/50 border border-blue-700/50 hover:border-blue-500/60 text-slate-200 hover:text-white font-medium text-sm sm:text-base transition-all cursor-pointer"
        >
          Explore Features
        </button>
      </div>

      {/* Key Capability Highlights Bar */}
      <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-6 border-t border-blue-900/30 w-full max-w-3xl">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 font-medium">
              <div className="w-5 h-5 rounded-full bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-sky-400">
                <Icon className="w-3 h-3" />
              </div>
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
