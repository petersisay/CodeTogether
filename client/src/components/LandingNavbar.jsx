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

  return (
    <header className="sticky top-0 z-50 w-full bg-[#070B14]/85 backdrop-blur-xl border-b border-blue-900/30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 p-[1px] shadow-[0_0_15px_rgba(37,99,235,0.35)] transition-transform group-hover:scale-105">
            <div className="w-full h-full rounded-[11px] bg-[#0A1226] flex items-center justify-center">
              <span className="font-code font-bold text-sm text-sky-400">&lt;/&gt;</span>
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-base tracking-tight text-white flex items-center">
              Code<span className="text-[#38BDF8]">Together</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline">
              Live Coding Workspace
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              {link.name}
            </a>
          ))}
          <button
            onClick={onNavigateToWorkspace}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Workspace</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/50 border border-blue-600/40 text-sky-300">
              Live
            </span>
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
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
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-blue-950/40 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                id="btn-signup-trigger"
                onClick={() => onOpenAuth?.('register')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}

          <button
            onClick={onNavigateToWorkspace}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer active:scale-95"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onNavigateToWorkspace}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs shadow-sm cursor-pointer"
          >
            Workspace
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-900/30 bg-[#091124] px-5 py-4 space-y-3 text-left animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="block py-2 text-xs font-medium text-slate-300 hover:text-sky-400"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-blue-900/40 flex flex-col gap-2">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">{currentUser.username}</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="text-xs text-red-400 hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth?.('login');
                  }}
                  className="w-full py-2 rounded-xl bg-blue-950/60 border border-blue-800/40 text-xs text-sky-300 font-medium text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth?.('register');
                  }}
                  className="w-full py-2 rounded-xl bg-blue-600 text-xs text-white font-medium text-center"
                >
                  Sign Up
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToWorkspace();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-medium text-xs text-center shadow-lg"
            >
              Start Coding Together →
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
