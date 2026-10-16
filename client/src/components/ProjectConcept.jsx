import React from 'react';
import { Lightbulb, Check, UserCheck } from 'lucide-react';

export default function ProjectConcept() {
  return (
    <div className="h-full rounded-2xl bg-[#091124] border border-blue-900/40 p-5 flex flex-col justify-between text-left shadow-[0_4px_20px_rgba(7,11,20,0.5)]">
      <div>
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-sky-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Project Concept</h3>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed">
          CodeTogether is a real-time collaborative coding platform that allows multiple users to work on the same codebase simultaneously. It provides a shared editor, live chat, voice support, and project rooms — making it easy to learn, build, and solve problems together.
        </p>

        {/* Who is it for? */}
        <div className="mt-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-900/40 flex items-center justify-center text-sky-400">
              <UserCheck className="w-3 h-3" />
            </div>
            <span>Who is it for?</span>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>ASTU students and classmates</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Developers and teams</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Anyone who wants to collaborate and build in real time</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Quote Badge */}
      <div className="mt-5 pt-3 border-t border-blue-950/60">
        <div className="w-full py-2 px-3 rounded-xl bg-blue-950/30 border border-blue-800/30 text-center">
          <span className="text-xs font-medium italic text-sky-300">
            “Great ideas are built together.”
          </span>
        </div>
      </div>
    </div>
  );
}
