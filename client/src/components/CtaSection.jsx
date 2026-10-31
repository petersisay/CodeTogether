import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CtaSection({ onStartCoding, currentUser }) {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0B1530] via-[#0A1226] to-[#070D1B] border border-blue-500/40 p-8 sm:p-14 lg:p-16 shadow-[0_0_80px_rgba(37,99,235,0.25)] overflow-hidden">
        {/* Multi-tone Ambient Glowing Blobs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-cyan-950/80 border border-blue-500/50 text-xs font-semibold text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>Ready to Build with Your Team?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Your Next Great Project{' '}
            <span className="gradient-text-combined">
              Starts Together.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Bring your ideas, your code, and your team into one collaborative workspace. Zero local install lag, zero git merge frustration.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartCoding}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl btn-combined text-white font-semibold text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 group"
            >
              <span>{currentUser ? `Enter Workspace as ${currentUser.username}` : 'Start Coding Together'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
