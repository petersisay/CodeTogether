import React from 'react';
import { Code2 } from 'lucide-react';

export default function LandingFooter({ onNavigateToWorkspace }) {
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-[#09132F] border-t border-blue-800/40 pt-14 pb-10 text-left text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-blue-800/30">
          {/* Brand & Narrative (Col 1-5) */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#0E1F4D] border border-blue-500/50 p-0.5 shadow-sm flex items-center justify-center">
                <img src="/assets/logo.png" alt="CodeTogether Logo" className="w-full h-full object-contain rounded-md" />
              </div>
              <span className="font-bold text-base tracking-tight text-white flex items-center">
                Code<span className="text-[#38BDF8]">Together</span>
              </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              A real-time collaborative coding workspace designed for students, software engineering teams, and pair programmers.
            </p>
          </div>

          {/* Navigation Links (Col 6-8) */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Navigation
            </span>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('features')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('about')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  About CodeTogether
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('how-it-works')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('technology')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  Technology Stack
                </button>
              </li>
            </ul>
          </div>

          {/* Product Links (Col 9-12) */}
          <div className="md:col-span-4 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Workspace & Rooms
            </span>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onNavigateToWorkspace}
                  className="text-sky-400 font-semibold hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Launch Live Workspace</span>
                </button>
              </li>
              <li className="text-slate-400">Default Room: <span className="font-mono text-slate-300">ASTU_DreamTeam</span></li>
              <li className="text-slate-400">WebRTC Voice & Video mesh calls</li>
              <li className="text-slate-400">Encrypted token authentication via Google</li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-400 text-xs">
          <div>
            © {new Date().getFullYear()} CodeTogether. Built for collaborative developer learning.
          </div>
        </div>
      </div>
    </footer>
  );
}
