import React, { useState } from 'react';
import { Menu, X, ChevronDown, LogOut, ArrowRight, Code2 } from 'lucide-react';

export default function LandingNavbar({
  currentUser,
  onOpenAuth,
  onSignOut,
  onNavigateToWorkspace,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#about' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Tech Stack', href: '#technology' },
  ];

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleWorkspaceAction = () => {
    if (currentUser) {
      onNavigateToWorkspace();
    } else {
      onOpenAuth?.('login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#070B14]/85 backdrop-blur-xl border-b border-blue-900/30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0A1226] border border-blue-500/40 p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.35)] transition-transform group-hover:scale-105 flex items-center justify-center">
            <img
              src="/assets/logo.png"
              alt="CodeTogether Logo"
              className="w-full h-full object-contain rounded-[9px]"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-base tracking-tight text-white flex items-center">
              Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300">Together</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline">
              Live Coding Workspace
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links (Visible on large screens >= 1024px) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="text-xs xl:text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {link.name}
            </a>
          ))}
          <button
            onClick={handleWorkspaceAction}
            className="text-xs xl:text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <span>Workspace</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/60 border border-blue-600/40 text-sky-300 group-hover:border-sky-400/60 transition-colors">
              Live
            </span>
          </button>
        </nav>

        {/* Desktop Right CTA Actions (Visible on large screens >= 1024px) */}
        <div className="hidden lg:flex items-center gap-2.5 xl:gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                id="btn-user-profile"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-700/40 hover:border-blue-500/50 text-xs text-slate-200 transition-all cursor-pointer"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {(currentUser.username || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-medium max-w-[110px] truncate">{currentUser.username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#091124] border border-blue-900/60 shadow-2xl p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-blue-950/60 mb-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.username}</p>
                    {currentUser.email && (
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigateToWorkspace();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-sky-300 hover:bg-blue-900/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Open Workspace</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="btn-auth-trigger"
                onClick={() => onOpenAuth?.('login')}
                className="px-3.5 xl:px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-blue-950/40 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                id="btn-signup-trigger"
                onClick={() => onOpenAuth?.('register')}
                className="hidden xl:inline-flex px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}

          <button
            onClick={handleWorkspaceAction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-combined text-white font-medium text-xs transition-all cursor-pointer active:scale-95"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tablet & Mobile Right Actions + Menu Toggle (< 1024px) */}
        <div className="flex lg:hidden items-center gap-2 sm:gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-700/40 text-xs text-slate-200 cursor-pointer"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {(currentUser.username || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline font-medium max-w-[80px] truncate">{currentUser.username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#091124] border border-blue-900/60 shadow-2xl p-2 z-50 text-left">
                  <div className="px-3 py-1.5 border-b border-blue-950/60 mb-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.username}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigateToWorkspace();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-sky-300 hover:bg-blue-900/40 text-left"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Workspace</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth?.('login')}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            onClick={handleWorkspaceAction}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl btn-combined text-white font-medium text-xs shadow-md cursor-pointer active:scale-95"
          >
            <span className="hidden sm:inline">Launch Workspace</span>
            <span className="sm:hidden">Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </button>

          <button
            id="btn-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 bg-blue-950/50 border border-blue-800/40 hover:text-white hover:border-blue-500/50 hover:bg-blue-900/40 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-sky-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer (Visible below lg / 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-blue-900/40 bg-[#070B14]/98 backdrop-blur-2xl px-5 py-5 space-y-4 text-left shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Navigation</p>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-900/30 transition-all"
              >
                <span>{link.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleWorkspaceAction();
              }}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold text-sky-400 hover:bg-blue-900/30 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                <span>Live Workspace</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/70 border border-blue-500/50 text-sky-300 font-bold">
                Online
              </span>
            </button>
          </div>

          <div className="pt-3 border-t border-blue-900/50 flex flex-col gap-2.5">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/40">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {(currentUser.username || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-white truncate">{currentUser.username}</p>
                    {currentUser.email && (
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateToWorkspace();
                    }}
                    className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    Open Workspace
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignOut?.();
                    }}
                    className="py-2.5 rounded-xl bg-red-950/50 border border-red-800/40 hover:bg-red-900/50 text-red-300 text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth?.('login');
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-950/70 border border-blue-800/50 text-xs text-sky-300 font-semibold text-center hover:bg-blue-900/50 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth?.('register');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs text-white font-semibold text-center shadow-md transition-all cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleWorkspaceAction();
                  }}
                  className="w-full py-3 rounded-xl btn-combined text-white font-semibold text-xs text-center shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
