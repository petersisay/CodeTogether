import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('/assets/avatar-petros.png');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const avatarOptions = [
    { label: 'Petros', src: '/assets/avatar-petros.png' },
    { label: 'Habtu', src: '/assets/avatar-habtu.png' },
    { label: 'Mekdes', src: '/assets/avatar-mekdes.png' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? `${backendUrl}/api/auth/login` : `${backendUrl}/api/auth/register`;
    const payload = isLogin
      ? { identifier: email || username, password }
      : { username, email, password, avatar };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('codetogether_token', data.token);
      localStorage.setItem('codetogether_user', JSON.stringify(data.user));

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick preset login helper for testing
  const handleQuickLogin = async (name, av) => {
    setError('');
    setLoading(true);
    try {
      const emailVal = `${name.toLowerCase()}@codetogether.dev`;
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name,
          email: emailVal,
          password: 'password123',
          avatar: av,
        }),
      });

      let data = await res.json();
      if (!res.ok) {
        // Try logging in instead if already registered
        const loginRes = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: emailVal,
            password: 'password123',
          }),
        });
        data = await loginRes.json();
      }

      if (data.token) {
        localStorage.setItem('codetogether_token', data.token);
        localStorage.setItem('codetogether_user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl bg-[#091124] border border-blue-600/40 shadow-[0_0_50px_rgba(37,99,235,0.4)] overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-900/40 bg-[#0A142A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-900/50 border border-blue-500/40 flex items-center justify-center text-sky-400 font-code font-bold text-xs">
              &lt;/&gt;
            </div>
            <h3 className="text-base font-bold text-white">
              {isLogin ? 'Sign In to CodeTogether' : 'Create an Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. dev_user"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060B18] border border-blue-900/40 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Choose Avatar</label>
                <div className="flex items-center gap-3">
                  {avatarOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => setAvatar(opt.src)}
                      className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all cursor-pointer ${
                        avatar === opt.src
                          ? 'border-sky-400 bg-blue-950/60'
                          : 'border-blue-950 hover:border-blue-800'
                      }`}
                    >
                      <img src={opt.src} alt={opt.label} className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-xs text-slate-200">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isLogin ? 'Email or Username' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type={isLogin ? 'text' : 'email'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060B18] border border-blue-900/40 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060B18] border border-blue-900/40 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          {/* Quick Demo Identities for instant multi-user testing */}
          <div className="pt-2 border-t border-blue-950/60 text-center">
            <span className="text-[11px] text-slate-400">Quick sign in as demonstration collaborator:</span>
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Petros', '/assets/avatar-petros.png')}
                className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/40 text-[11px] text-sky-300 hover:bg-blue-900/40 cursor-pointer"
              >
                Petros
              </button>
              <button
                type="button"
                id="btn-quick-habtu"
                onClick={() => handleQuickLogin('Habtu', '/assets/avatar-habtu.png')}
                className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/40 text-[11px] text-emerald-300 hover:bg-blue-900/40 cursor-pointer"
              >
                Habtu
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('Mekdes', '/assets/avatar-mekdes.png')}
                className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/40 text-[11px] text-purple-300 hover:bg-blue-900/40 cursor-pointer"
              >
                Mekdes
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs text-sky-400 hover:underline cursor-pointer"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
