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
    <section className="relative w-full overflow-hidden flex flex-col items-center justify-center pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 min-h-[600px] lg:min-h-[700px]">
      {/* =========================================================================
          ANIMATED DEVELOPER HERO BACKGROUND LAYER
          Uses attached background image with WebP + PNG fallback, gentle drift,
          glowing pulses, and flowing light particles. Fully pointer-events-none.
         ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden="true">
        {/* Full-width responsive background image layer */}
        <picture className="absolute inset-0 w-full h-full">
          <source srcSet="/assets/hero-bg.webp" type="image/webp" />
          <img
            src="/assets/hero-bg.png"
            alt=""
            className="w-full h-full object-cover object-center hero-bg-drift opacity-80 sm:opacity-85 scale-[1.03]"
            loading="eager"
            fetchPriority="high"
          />
        </picture>

        {/* Center-aligned subtle dark overlay: preserves headline readability while keeping edge illustrations luminous */}
        <div className="absolute inset-0 bg-radial-[at_center_center] from-[#070B14]/75 via-[#070B14]/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/90 via-transparent to-[#070B14]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/50 via-transparent to-[#070B14]/50" />

        {/* Soft glowing blue & cyan illumination pulses */}
        <div className="absolute top-1/4 left-6 sm:left-16 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-blue-500/20 blur-[100px] hero-pulse-glow" />
        <div className="absolute top-1/3 right-6 sm:right-16 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-cyan-400/20 blur-[110px] hero-pulse-glow-alt" />

        {/* Luminous flowing particles */}
        <div className="hero-particle hero-particle-1" />
        <div className="hero-particle hero-particle-2" />
        <div className="hero-particle hero-particle-3" />
        <div className="hero-particle hero-particle-4" />
      </div>

      {/* =========================================================================
          HERO CONTENT LAYER (Interactive & Readability Maximized)
         ========================================================================= */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        {/* Decorative Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#08122B]/85 backdrop-blur-md border border-blue-500/40 shadow-[0_0_25px_rgba(37,99,235,0.3)] mb-6 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-xs font-semibold text-sky-300 tracking-wide">
            Real-Time Collaborative Coding for Developers & Teams
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Code Together.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">
            Build Something Amazing.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-200 max-w-2xl font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
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
            className="px-7 py-3.5 rounded-xl bg-[#09132E]/80 backdrop-blur-md hover:bg-blue-900/60 border border-blue-700/60 hover:border-blue-400/70 text-slate-100 hover:text-white font-medium text-sm sm:text-base transition-all cursor-pointer shadow-sm"
          >
            Explore Features
          </button>
        </div>

        {/* Key Capability Highlights Bar */}
        <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-6 border-t border-blue-900/40 w-full max-w-3xl">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                <div className="w-5 h-5 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center text-sky-400">
                  <Icon className="w-3 h-3" />
                </div>
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
