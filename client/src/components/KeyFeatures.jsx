import React from 'react';
import {
  Star,
  Activity,
  FolderTree,
  MessageSquare,
  UserCheck,
  Users,
  Smartphone,
} from 'lucide-react';

export default function KeyFeatures() {
  const features = [
    {
      title: 'Real-time Code Editing',
      description: 'Multiple users can edit the same file at the same time.',
      icon: Activity,
    },
    {
      title: 'File Management',
      description: 'Organize your files and codebase easily.',
      icon: FolderTree,
    },
    {
      title: 'Live Chat & Voice',
      description: 'Discuss ideas, share links, and solve problems faster.',
      icon: MessageSquare,
    },
    {
      title: 'User Presence',
      description: "See who's online and what they're working on.",
      icon: UserCheck,
    },
    {
      title: 'Project Rooms',
      description: 'Create private or public rooms for your projects.',
      icon: Users,
    },
    {
      title: 'Responsive Design',
      description: 'Works on desktop, tablet, and mobile.',
      icon: Smartphone,
    },
  ];

  return (
    <div className="h-full rounded-2xl bg-[#091124] border border-blue-900/40 p-5 flex flex-col text-left shadow-[0_4px_20px_rgba(7,11,20,0.5)]">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-sky-400">
          <Star className="w-4 h-4 fill-sky-400" />
        </div>
        <h3 className="text-base font-bold text-white tracking-tight">Key Features</h3>
      </div>

      {/* 6 Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#080E1D] border border-blue-950/70 hover:border-blue-700/50 transition-all flex items-start gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-sky-400 shrink-0 group-hover:text-cyan-300 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left leading-tight">
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
