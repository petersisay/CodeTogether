import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User, Loader2, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleBtnRef = useRef(null);

  if (!isOpen) return null;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '764795198689-41h522pnno7r3ifmb6im3iu12418m31f.apps.googleusercontent.com';

  // Handle Google Credential Token from GIS
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setError('Google authentication failed to return a credential.');
      return;
    }

    setError('');
    setGoogleLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication rejected by server');
      }

      localStorage.setItem('codetogether_token', data.token);
      localStorage.setItem('codetogether_user', JSON.stringify(data.user));

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      console.error('[Google Sign-In Error]:', err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Initialize Google Identity Services button
  useEffect(() => {
    if (!isOpen) return;

    let timeoutId;
    const initializeGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          // Render official Google button
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 320,
          });
        } catch (e) {
          console.warn('[GIS Init Error]:', e);
        }
      } else {
        // Retry shortly if GIS script is still loading asynchronously
        timeoutId = setTimeout(initializeGoogle, 300);
      }
    };

    initializeGoogle();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, googleClientId]);

  // Standard Email/Password Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? `${backendUrl}/api/auth/login` : `${backendUrl}/api/auth/register`;
    const payload = isLogin
      ? { identifier: email || username, password }
      : { username: username.trim(), email: email.trim().toLowerCase(), password };

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

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. GOOGLE SIGN-IN SECTION */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2">
            {googleLoading ? (
              <div className="w-full py-3 rounded-full bg-blue-900/40 border border-blue-600/50 flex items-center justify-center gap-2 text-sky-300 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Google account...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                {/* Official GIS container */}
                <div ref={googleBtnRef} className="flex justify-center min-h-[44px]"></div>

                {/* Direct Google Action button fallback if GIS iframe takes time */}
                {(!window.google || !window.google.accounts) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.google?.accounts?.id) {
                        window.google.accounts.id.prompt();
                      } else {
                        setError('Google authentication script is connecting. Please ensure your browser allows Google scripts.');
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-blue-900/40"></div>
            <span className="px-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">or continue with email</span>
            <div className="flex-1 border-t border-blue-900/40"></div>
          </div>

          {/* 2. EMAIL / PASSWORD FORM */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
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
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
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
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Please wait...' : isLogin ? 'Sign In with Password' : 'Create Account'}</span>
            </button>

            <div className="text-center pt-2">
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
    </div>
  );
}
