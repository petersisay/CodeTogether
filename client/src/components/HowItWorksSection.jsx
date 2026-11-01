import React from 'react';
import { ShieldCheck, LayoutGrid, Sparkles, ArrowRight } from 'lucide-react';

export default function HowItWorksSection({ onStartCoding }) {
  const steps = [
    {
      number: '01',
      icon: ShieldCheck,
      title: 'Sign In Securely with Google',
      description:
        'Verify your account in seconds using Google Identity Services. Pick a custom username to represent your developer profile across workspace sessions.',
      accent: 'cyan',
      cardClass: 'border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.12)]',
      iconClass: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
      numClass: 'text-cyan-400/60 group-hover:text-cyan-300',
      badgeClass: 'text-cyan-300 border-cyan-800/40 bg-cyan-950/60',
    },
    {
      number: '02',
      icon: LayoutGrid,
      title: 'Create or Join a Project Room',
      description:
        'Enter an existing workspace like ASTU_DreamTeam or create your own custom room. All room files, chat history, and active sessions load automatically.',
      accent: 'indigo',
      cardClass: 'border-indigo-500/30 hover:border-indigo-400/60 shadow-[0_0_20px_rgba(99,102,241,0.12)]',
      iconClass: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
      numClass: 'text-indigo-400/60 group-hover:text-indigo-300',
      badgeClass: 'text-indigo-300 border-indigo-800/40 bg-indigo-950/60',
    },
    {
      number: '03',
      icon: Sparkles,
      title: 'Collaborate & Build in Real Time',
      description:
        'Write and run code concurrently with line-by-line sync. Discuss ideas in live chat, launch WebRTC voice/video calls, and auto-save work directly to MongoDB.',
      accent: 'emerald',
      cardClass: 'border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.12)]',
      iconClass: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
      numClass: 'text-emerald-400/60 group-hover:text-emerald-300',
      badgeClass: 'text-emerald-300 border-emerald-800/40 bg-emerald-950/60',
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-left border-t border-blue-900/30">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
        <span className="text-xs font-bold text-sky-300 tracking-wider uppercase bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-cyan-950/80 border border-blue-700/50 px-3.5 py-1.5 rounded-full inline-block mb-3 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          Simple Workflow
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          How It{' '}
          <span className="gradient-text-combined">
            Works
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
          From sign-in to writing collaborative code with your team in less than 30 seconds.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className={`relative p-7 rounded-2xl bg-gradient-to-b from-[#0E1F4D] to-[#0B1739] border transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1 ${step.cardClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-all ${step.iconClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`font-code text-2xl font-extrabold transition-colors ${step.numClass}`}>
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                  {step.title}
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-900/30 flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${step.badgeClass}`}>
                  Step {step.number}
                </span>
                <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-300 transition-colors">
                  Instant Access
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
