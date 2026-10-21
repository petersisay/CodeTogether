import React from 'react';
import { Heart, Code2 } from 'lucide-react';

export default function LandingFooter({ onNavigateToWorkspace }) {
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-[#050914] border-t border-blue-900/40 pt-14 pb-10 text-left text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-blue-900/30">
          {/* Brand & Narrative (Col 1-5) */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 p-[1px]">
                <div className="w-full h-full rounded-[7px] bg-[#0A1226] flex items-center justify-center">
                  <span className="font-code font-bold text-xs text-sky-400">&lt;/&gt;</span>
                </div>
              </div>
              <span className="font-bold text-base tracking-tight text-white flex items-center">
                Code<span className="text-[#38BDF8]">Together</span>
              </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              A real-time collaborative coding workspace designed for students, software engineering teams, and pair programmers.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/petersisay/CodeTogether"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-slate-300 hover:text-white hover:border-blue-600/50 transition-colors"
              >
                <svg className="w-4 h-4 text-sky-400 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-xs font-medium">GitHub Repository</span>
              </a>
            </div>
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
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Proudly crafted for</span>
            <span className="text-sky-400 font-semibold">ASTU</span>
            <span>& developers everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
