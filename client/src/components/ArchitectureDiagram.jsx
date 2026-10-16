import React from 'react';
import { Network, Server, Database } from 'lucide-react';

export default function ArchitectureDiagram() {
  return (
    <div className="w-full rounded-2xl bg-[#091124] border border-blue-900/40 p-4 flex flex-col text-left shadow-[0_4px_20px_rgba(7,11,20,0.5)]">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-sky-400">
          <Network className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight">Architecture</h3>
      </div>

      {/* Diagram container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-[#070D1B] border border-blue-950/60 w-full overflow-hidden">
        {/* 1. CLIENT */}
        <div className="flex-1 min-w-[110px] p-2.5 rounded-xl bg-[#0A162F] border border-blue-600/40 flex items-center gap-2.5 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-sky-300 shrink-0">
            <span className="font-code font-bold text-xs">&lt;/&gt;</span>
          </div>
          <div className="text-left leading-tight truncate">
            <div className="text-xs font-bold text-white truncate">Client</div>
            <div className="text-[10px] text-sky-400 font-medium truncate">(React + Vite)</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Vercel</div>
          </div>
        </div>

        {/* Arrow 1: Client <--> Server */}
        <div className="flex flex-col items-center justify-center px-0.5 text-center shrink-0">
          <div className="text-[8px] font-semibold text-sky-400 tracking-wider">WebSocket</div>
          <div className="w-10 sm:w-12 h-0.5 bg-blue-500/60 my-0.5 relative">
            <div className="absolute -left-0.5 -top-1 w-1.5 h-1.5 border-l-2 border-b-2 border-sky-400 -rotate-45"></div>
            <div className="absolute -right-0.5 -top-1 w-1.5 h-1.5 border-r-2 border-t-2 border-sky-400 -rotate-45"></div>
          </div>
          <div className="text-[8px] font-semibold text-slate-400 tracking-wider">HTTP/REST</div>
        </div>

        {/* 2. SERVER */}
        <div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-[#091F1E] border border-emerald-600/40 flex items-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight truncate">
            <div className="text-xs font-bold text-white truncate">Server</div>
            <div className="text-[10px] text-emerald-400 font-medium truncate">(Node.js + Express)</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Render</div>
          </div>
        </div>

        {/* Arrow 2: Server --> Database */}
        <div className="flex items-center justify-center px-0.5 shrink-0">
          <div className="w-8 sm:w-10 h-0.5 bg-emerald-500/60 relative">
            <div className="absolute -right-0.5 -top-1 w-1.5 h-1.5 border-r-2 border-t-2 border-emerald-400 -rotate-45"></div>
          </div>
        </div>

        {/* 3. DATABASE */}
        <div className="flex-1 min-w-[110px] p-2.5 rounded-xl bg-[#071714] border border-emerald-700/40 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight truncate">
            <div className="text-xs font-bold text-white truncate">Database</div>
            <div className="text-[10px] text-emerald-400 font-medium truncate">(MongoDB Atlas)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
