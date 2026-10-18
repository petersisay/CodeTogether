import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User, Loader2, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AuthModal({
  isOpen,
  initialMode = 'login', // 'login' | 'register'
  onClose,
  onAuthSuccess,
}) {
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);

  // Two-step Google onboarding state
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const googleBtnRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '764795198689-41h522pnno7r3ifmb6im3iu12418m31f.apps.googleusercontent.com';

  // Synchronize initial mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode !== 'register');
      setError('');
      setPendingGoogleAuth(null);
    }
  }, [isOpen, initialMode]);

  // Handle Google Credential Token from GIS
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setError('Google authentication failed to return a valid credential.');
      return;
    }

    setError('');
    setGoogleLoading(true);

    try {
      // 1. Verify credential on backend to check if user already exists
      const verifyRes = await fetch(`${backendUrl}/api/auth/google/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Google verification rejected by server');
      }

      // If user is already registered, complete sign-in immediately
      if (verifyData.exists && verifyData.token) {
        localStorage.setItem('codetogether_token', verifyData.token);
        localStorage.setItem('codetogether_user', JSON.stringify(verifyData.user));
        onAuthSuccess?.(verifyData.user, verifyData.token);
        onClose?.();
        return;
      }

      // If this is a new user registering via verified Google account:
      // Transition to Step 2: Prompt for username and password to save user data
      setPendingGoogleAuth({
        credential: response.credential,
        email: verifyData.email,
        displayName: verifyData.displayName,
        avatar: verifyData.avatar,
        suggestedUsername: verifyData.suggestedUsername,
      });
      setSignupUsername(verifyData.suggestedUsername || '');
      setSignupPassword('');
    } catch (err) {
      console.error('[Google Auth Error]:', err);
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Complete registration for new verified Google user
  const handleCompleteGoogleRegistration = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanUsername = signupUsername.trim();
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (cleanUsername.length > 30) {
      setError('Username cannot exceed 30 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    if (signupPassword && signupPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: pendingGoogleAuth.credential,
          username: cleanUsername,
          password: signupPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete Google registration');
      }

      localStorage.setItem('codetogether_token', data.token);
      localStorage.setItem('codetogether_user', JSON.stringify(data.user));

      onAuthSuccess?.(data.user, data.token);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services button
  useEffect(() => {
    if (!isOpen || pendingGoogleAuth) return;

    let timerId;
    let attempts = 0;

    const setupGoogle = () => {
      attempts++;
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: isLogin ? 'signin_with' : 'signup_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 320,
          });
          setGisLoaded(true);
        } catch (e) {
          console.warn('[GIS Setup Notice]:', e);
        }
      } else if (attempts < 15) {
        timerId = setTimeout(setupGoogle, 250);
      }
    };

    setupGoogle();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isOpen, googleClientId, isLogin, pendingGoogleAuth]);

  // Handle Returning User Password Sign-In
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your username or Google email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('codetogether_token', data.token);
      localStorage.setItem('codetogether_user', JSON.stringify(data.user));

      onAuthSuccess?.(data.user, data.token);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Safe early return strictly AFTER all hook calls
  if (!isOpen) return null;

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#091124] border border-blue-600/40 shadow-[0_0_50px_rgba(37,99,235,0.4)] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-900/40 bg-[#0A142A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-900/50 border border-blue-500/40 flex items-center justify-center text-sky-400 font-code font-bold text-xs">
              &lt;/&gt;
            </div>
            <h3 className="text-base font-bold text-white">
              {pendingGoogleAuth
                ? 'Complete Account Setup'
                : isLogin
                ? 'Sign In to CodeTogether'
                : 'Join CodeTogether'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Visible only when not in post-Google onboarding step) */}
        {!pendingGoogleAuth && (
          <div className="flex border-b border-blue-900/40 bg-[#070D1B] p-1.5 gap-1.5">
            <button
              type="button"
              id="tab-signin"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isLogin
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW A: STEP 2 - POST-GOOGLE VERIFICATION USERNAME SETUP */}
          {pendingGoogleAuth ? (
            <form onSubmit={handleCompleteGoogleRegistration} className="space-y-4">
              {/* Verified Google Account Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
                {pendingGoogleAuth.avatar ? (
                  <img
                    src={pendingGoogleAuth.avatar}
                    alt={pendingGoogleAuth.displayName}
                    className="w-10 h-10 rounded-full border border-emerald-400/50 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                    {pendingGoogleAuth.displayName?.[0] || 'G'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Google Email Verified</span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{pendingGoogleAuth.email}</p>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Choose a unique username for the workspace, and set an optional password to sign in with credentials anytime.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Choose Username <span className="text-sky-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    id="input-signup-username"
                    required
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="e.g. dev_coder"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060B18] border border-blue-900/40 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Letters, numbers, underscores, and hyphens (3–30 characters)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Set Password <span className="text-slate-500">(Optional for direct sign-in)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    id="input-signup-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters (optional)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060B18] border border-blue-900/40 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Allows signing in via username or Google email with password
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingGoogleAuth(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-complete-signup"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Complete & Enter Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : !isLogin ? (
            /* VIEW B: GOOGLE-ONLY REGISTRATION / SIGN UP */
            <div className="space-y-4 py-1">
              <div className="p-4 rounded-xl bg-gradient-to-b from-blue-950/40 to-[#070D1B] border border-blue-800/40 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-500/40 flex items-center justify-center mx-auto text-sky-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-white">
                  Verified Google Sign-Up Only
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  To ensure genuine collaboration and prevent spam, new CodeTogether accounts must be registered with a verified Google account.
                </p>
              </div>

              {/* Google Sign-Up Action */}
              <div className="flex flex-col items-center justify-center pt-2">
                {googleLoading ? (
                  <div className="w-full py-3 rounded-full bg-blue-900/40 border border-blue-600/50 flex items-center justify-center gap-2 text-sky-300 text-xs font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Google account...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    {/* Official GIS container */}
                    <div ref={googleBtnRef} className="flex justify-center min-h-[44px]"></div>

                    {/* Resilient fallback button if GIS is loading or in headless tests */}
                    {!gisLoaded && (
                      <button
                        type="button"
                        id="btn-google-signup"
                        onClick={() => {
                          if (window.google?.accounts?.id) {
                            window.google.accounts.id.prompt();
                          } else {
                            setError('Connecting to Google Identity Services...');
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
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
                        <span>Sign up with Google</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  id="btn-toggle-to-signin"
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                  className="text-xs text-sky-400 hover:underline cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          ) : (
            /* VIEW C: RETURNING USER SIGN IN (Google OR Username/Email + Password) */
            <div className="space-y-4">
              {/* Google 1-Click Sign-In */}
              <div className="flex flex-col items-center justify-center pt-1 pb-1">
                {googleLoading ? (
                  <div className="w-full py-3 rounded-full bg-blue-900/40 border border-blue-600/50 flex items-center justify-center gap-2 text-sky-300 text-xs font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in with Google...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    {/* Official GIS container */}
                    <div ref={googleBtnRef} className="flex justify-center min-h-[44px]"></div>

                    {!gisLoaded && (
                      <button
                        type="button"
                        id="btn-google-signin"
                        onClick={() => {
                          if (window.google?.accounts?.id) {
                            window.google.accounts.id.prompt();
                          } else {
                            setError('Connecting to Google Identity Services...');
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
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
                        <span>Sign in with Google</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-blue-900/40"></div>
                <span className="px-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  or sign in with password
                </span>
                <div className="flex-1 border-t border-blue-900/40"></div>
              </div>

              {/* Returning User Identifier + Password Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username or Google Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      id="input-auth-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username or user@gmail.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060B18] border border-blue-900/40 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      id="input-auth-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060B18] border border-blue-900/40 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-auth-submit"
                  disabled={loading || googleLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Signing in...' : 'Sign In with Password'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    id="btn-toggle-auth-mode"
                    onClick={() => {
                      setIsLogin(false);
                      setError('');
                    }}
                    className="text-xs text-sky-400 hover:underline cursor-pointer"
                  >
                    Don't have an account? Sign up with Google
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
