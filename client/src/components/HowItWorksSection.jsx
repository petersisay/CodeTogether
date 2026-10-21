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
    },
    {
      number: '02',
      icon: LayoutGrid,
      title: 'Create or Join a Project Room',
      description:
        'Enter an existing workspace like ASTU_DreamTeam or create your own custom room. All room files, chat history, and active sessions load automatically.',
    },
    {
      number: '03',
      icon: Sparkles,
      title: 'Collaborate & Build in Real Time',
      description:
        'Write and run code concurrently with line-by-line sync. Discuss ideas in live chat, launch WebRTC voice/video calls, and auto-save work directly to MongoDB.',
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-left border-t border-blue-900/30">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
        <span className="text-xs font-bold text-sky-400 tracking-wider uppercase bg-blue-950/70 border border-blue-800/40 px-3.5 py-1.5 rounded-full inline-block mb-3">
          Simple Workflow
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          How It{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
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
              className="relative p-7 rounded-2xl bg-gradient-to-b from-[#0A1226] to-[#070D1B] border border-blue-900/40 hover:border-blue-500/50 shadow-xl transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-950/70 border border-blue-700/50 flex items-center justify-center text-sky-400 group-hover:scale-105 group-hover:text-cyan-300 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-code text-2xl font-extrabold text-blue-500/40 group-hover:text-sky-400/80 transition-colors">
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

              <div className="mt-6 pt-4 border-t border-blue-900/30 flex items-center text-xs font-semibold text-sky-400">
                <span>Step {step.number}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
