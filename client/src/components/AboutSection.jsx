import React from 'react';
import { CheckCircle2, GraduationCap, Users2, Code2, Globe2 } from 'lucide-react';

export default function AboutSection() {
  const points = [
    {
      title: 'Crafted for Students & Engineers',
      desc: 'Designed for ASTU students, software engineering teams, and distributed developers who learn faster by coding side-by-side.',
    },
    {
      title: 'Eliminates Git Merge Conflicts',
      desc: 'No more waiting for branches or resolving git push rejections during hackathons. Edit code concurrently with live feedback.',
    },
    {
      title: 'Zero Local Setup Required',
      desc: 'Launch directly in any modern browser. Code, debug, chat, and jump into voice/video calls without installing compilers or local dependencies.',
    },
    {
      title: 'Persistent Cloud State',
      desc: 'Rooms, source files, and conversation history are automatically preserved in MongoDB Atlas, ready whenever your team returns.',
    },
  ];

  return (
    <section id="about" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-left border-t border-blue-900/30">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Mission & Narrative */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-800/40 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Our Mission & Story</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Built for Developers Who{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Create Together
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            CodeTogether is a real-time collaborative workspace engineered to bridge the gap between individual programming and true teamwork. Whether you are pair programming for an ASTU class assignment, sprinting in a 48-hour hackathon, or mentoring a junior engineer, CodeTogether gives you one unified screen to think, code, and build simultaneously.
          </p>

          {/* 4 Feature Checklist Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {points.map((point, index) => (
              <div key={index} className="p-4 rounded-xl bg-[#091122] border border-blue-900/40 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{point.title}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Visual Team Illustration & Glassmorphic Highlights */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md mx-auto">
            {/* Glowing Backdrop */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 to-sky-500/20 rounded-3xl blur-2xl opacity-70"></div>

            {/* Illustration Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-blue-600/40 bg-[#0A1226]/80 p-2 shadow-2xl">
              <img
                src="/assets/team-illustration.png"
                alt="CodeTogether collaborative development team"
                className="w-full h-auto object-cover rounded-xl"
              />

              {/* Floating Pill Badges */}
              <div className="absolute top-5 right-5 px-3 py-1.5 rounded-xl bg-[#070D1B]/90 border border-blue-500/40 backdrop-blur-md text-[11px] font-bold text-sky-300 shadow-xl flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Concurrent Pair Coding</span>
              </div>

              <div className="absolute bottom-5 left-5 px-3 py-1.5 rounded-xl bg-[#070D1B]/90 border border-blue-500/40 backdrop-blur-md text-[11px] font-bold text-emerald-300 shadow-xl flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>WebRTC P2P Voice & Video</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
