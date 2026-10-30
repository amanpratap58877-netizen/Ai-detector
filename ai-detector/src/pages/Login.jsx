import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Shield,
  Check,
  Flame,
  Database,
  Sparkles,
  Zap,
  KeyRound,
  LogIn,
  UserPlus
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  checkBackendHealth
} from '../api/client';
import {
  signInWithGoogleFirebase,
  signInWithGoogleRedirect,
  checkGoogleRedirectResult,
  signInWithEmailFirebase,
  registerWithEmailFirebase,
  resetPasswordFirebase
} from '../config/firebase';
import ThreeLoginSphere from '../components/ThreeLoginSphere';

export default function Login({ onLoginSuccess, isDark, onNotify }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [backendHealth, setBackendHealth] = useState(null);

  // Password Reset Modal via Firebase
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Check MySQL / Backend status and handle Google Redirect returns on load
  useEffect(() => {
    async function checkHealthAndRedirect() {
      try {
        const health = await checkBackendHealth();
        setBackendHealth(health);
      } catch {
        setBackendHealth({ online: false });
      }

      // Check if user just completed Google Redirect OAuth
      try {
        const redirectUser = await checkGoogleRedirectResult();
        if (redirectUser) {
          const userEmail = redirectUser.email || '';
          const userName = redirectUser.displayName || userEmail.split('@')[0];
          const userPhoto = redirectUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName.replace(/\s+/g, '')}`;
          const res = await loginWithGoogle({
            email: userEmail,
            name: userName,
            avatar: userPhoto,
            organization: 'Independent Researcher',
          });
          if (onNotify) {
            onNotify('success', 'Google Authenticated', `Welcome back, ${userName}! Validated via MySQL.`);
          }
          onLoginSuccess(res.user);
        }
      } catch (err) {
        console.warn('Redirect check notice:', err);
      }
    }
    checkHealthAndRedirect();
  }, []);

  // Quick domain append helper
  const handleAppendDomain = (domain) => {
    if (!email) {
      setEmail(domain);
      return;
    }
    if (!email.includes('@')) {
      setEmail(email.trim() + domain);
    } else {
      const prefix = email.split('@')[0];
      setEmail(prefix + domain);
    }
  };

  // Password Strength Calculator (for Register mode)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'Required', color: 'bg-slate-300 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, text: 'Moderate', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, text: 'Good', color: 'bg-sky-500' };
    return { score: 4, text: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // 1. Google Authentication via Firebase + MySQL Sync
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const fbUser = await signInWithGoogleFirebase();
      const userEmail = fbUser.email || '';
      const userName = fbUser.displayName || userEmail.split('@')[0];
      const userPhoto = fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName.replace(/\s+/g, '')}`;

      // Synchronize session with MySQL Database
      const res = await loginWithGoogle({
        email: userEmail,
        name: userName,
        avatar: userPhoto,
        organization: 'Independent Researcher',
      });

      if (onNotify) {
        onNotify('success', 'Google Authenticated', `Welcome, ${userName}! Validated via MySQL.`);
      }
      onLoginSuccess(res.user);
    } catch (err) {
      console.warn('Google Sign-In Notice:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google Sign-In window was closed before completion. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        try {
          await signInWithGoogleRedirect();
          return;
        } catch {
          setErrorMessage('Popup blocked by browser. Please allow popups or sign in with your email below.');
        }
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage('Domain unauthorized in Firebase Console. Add localhost/127.0.0.1 to Firebase Console > Authentication > Settings > Authorized Domains.');
      } else if (err.code === 'auth/configuration-not-found') {
        setErrorMessage('Firebase Authentication is not activated yet for project "ai-detector-8fa75". Go to Firebase Console > Authentication, click "Get started", and enable Google in the Sign-in method tab.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage('Google provider is not enabled in Firebase Console. Enable it in Firebase Console > Authentication > Sign-in method.');
      } else {
        setErrorMessage(err.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Real Email & Password Submit (MySQL Database Validation)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please provide a valid email format (e.g. name@gmail.com).');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        // Authenticate directly against MySQL database
        const res = await loginWithEmail(email.trim().toLowerCase(), password);

        // Also sync Firebase session if available
        try {
          await signInWithEmailFirebase(email.trim().toLowerCase(), password);
        } catch {
          // Non-blocking Firebase session sync
        }

        if (onNotify) {
          onNotify('success', 'Authentication Successful', `Welcome back, ${res.user.name}! Validated via MySQL.`);
        }
        onLoginSuccess(res.user);
      } else {
        // Registration Mode
        if (!name.trim()) {
          setErrorMessage('Please provide your full name.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        // 1. Register in MySQL database
        const res = await registerWithEmail({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          organization: organization.trim() || 'Independent Auditor',
          role: 'Auditor',
        });

        // 2. Register in Firebase Auth
        try {
          await registerWithEmailFirebase(email.trim().toLowerCase(), password, name.trim());
        } catch {
          // Non-blocking Firebase registration
        }

        if (onNotify) {
          onNotify('success', 'Account Registered', `Account created successfully for ${res.user.email}!`);
        }
        onLoginSuccess(res.user);
      }
    } catch (err) {
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Switch to "Sign Up" tab to register.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to "Sign In".';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Reset via Firebase
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setResetLoading(true);
    setResetStatus(null);
    try {
      await resetPasswordFirebase(resetEmail.trim().toLowerCase());
      setResetStatus({
        type: 'success',
        message: `Password reset instructions sent to ${resetEmail.trim()}. Check your inbox or spam folder.`
      });
    } catch (err) {
      let msg = 'Failed to send reset link. Make sure the email is registered.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No user registered with this email in Firebase Auth.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      setResetStatus({ type: 'error', message: msg });
    } finally {
      setResetLoading(false);
    }
  };

  const isMySQL = backendHealth?.database?.driver === 'mysql';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 relative z-10 selection:bg-brand-500/20 selection:text-brand-300">
      {/* Ambient Radial Aura Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[450px] h-[450px] bg-indigo-500/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Glassmorphic Wrapper */}
      <div className="w-full max-w-5xl relative">
        <div className="rounded-[32px] p-[1px] bg-gradient-to-b from-white/30 via-white/10 to-transparent dark:from-white/15 dark:via-white/5 dark:to-white/0 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-3xl rounded-[31px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all duration-300">

            {/* ========================================================
                LEFT COLUMN: Interactive 3D Hologram & Telemetry Lab
               ======================================================== */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#060a14] via-[#0b1328] to-[#040712] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
              {/* Subtle Animated Glow Orbs */}
              <div className="absolute top-0 -left-16 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none animate-pulse [animation-duration:8s]" />
              <div className="absolute bottom-0 -right-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse [animation-duration:10s]" />

              {/* Top Branding Section */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-500 opacity-60 blur-sm group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 via-navy-900 to-brand-950 border border-brand-400/30 flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
                      <ShieldCheck className="w-6 h-6 text-brand-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2 text-white">
                      <span>AI-DETECTOR</span>
                      <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-md bg-gradient-to-r from-brand-500/25 to-indigo-500/25 text-brand-300 border border-brand-500/40">
                        Pro
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Linguistic Forensics & Audit Studio
                    </p>
                  </div>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-[10px] text-slate-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>v2.5 ONLINE</span>
                </div>
              </div>

              {/* Center 3D Three.js Viewport */}
              <div className="relative my-4 flex-1 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px]">
                {/* Cybernetic Holographic Compass Rings */}
                <div className="absolute inset-4 rounded-full border border-indigo-500/10 pointer-events-none animate-spin [animation-duration:60s]" />
                <div className="absolute inset-12 rounded-full border border-dashed border-cyan-500/10 pointer-events-none animate-spin [animation-duration:45s] [animation-direction:reverse]" />

                {/* Live Three.js Interactive Sphere */}
                <ThreeLoginSphere isDark={true} isAuthenticating={loading} />

                {/* Interactive Status Pill */}
                <div className="absolute bottom-2 px-3.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/70 text-[10px] text-slate-300 font-mono flex items-center gap-2 shadow-xl shadow-black/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>Interactive Quantum Core • Parallax</span>
                </div>
              </div>

              {/* Bottom Telemetry & Security Badges */}
              <div className="relative z-10 pt-4 border-t border-slate-800/80 space-y-2.5">
                {/* Engine 1: MySQL Server 8.0 */}
                <div className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <span className="flex items-center gap-2 font-medium text-[11px]">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Database Validation
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[10px] text-emerald-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isMySQL ? 'MySQL Server 8.0' : 'SQLite Local Core'}
                  </span>
                </div>

                {/* Engine 2: Firebase Auth */}
                <div className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <span className="flex items-center gap-2 font-medium text-[11px]">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Firebase Cloud Auth
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-[10px] text-amber-300 font-mono">
                    Google OAuth 2.0
                  </span>
                </div>

                {/* Micro Security Guarantee */}
                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-cyan-400" />
                    Salted PBKDF2
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    180ms Heuristics
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    Strict Live Verification
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================
                RIGHT COLUMN: Modern Authentication Workspace
               ======================================================== */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white dark:bg-[#0c1222]">
              {/* Header Title Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Enterprise Access
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ai-detector-8fa75
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {mode === 'login' ? 'Sign in to AI-DETECTOR' : 'Sign Up for AI-DETECTOR'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Enter your credentials or authenticate via Google to access the audit studio.'
                    : 'Create your account to start auditing academic and enterprise documents.'}
                </p>
              </div>

              {/* Google OAuth Button */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/[0.08] hover:border-brand-500/60 dark:hover:border-brand-500/60 hover:shadow-lg hover:shadow-brand-500/10 active:scale-[0.99] transition-all duration-200 group font-semibold text-sm disabled:opacity-60"
                >
                  {/* Official Google Multicolor Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span className="flex-1 text-center font-bold">
                    {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Hairline Separator */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-white/10 w-full" />
                  <span className="bg-white dark:bg-[#0c1222] px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold absolute">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Segmented Mode Switcher (Sign In / Sign Up) */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 dark:bg-white/[0.04] rounded-2xl mb-4 border border-slate-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-md shadow-black/5'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-md shadow-black/5'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Authentication Form adhering to modern autofill standards */}
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <>
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative group">
                        <User className="w-4 h-4 text-slate-400 group-focus-within:text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                        <input
                          id="reg-name"
                          name="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          autoComplete="name"
                          required
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs sm:text-sm focus:bg-white dark:focus:bg-navy-950 focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-org" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Organization / Institution (Optional)
                      </label>
                      <div className="relative group">
                        <Building className="w-4 h-4 text-slate-400 group-focus-within:text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                        <input
                          id="reg-org"
                          name="organization"
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. Apex University"
                          autoComplete="organization"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs sm:text-sm focus:bg-white dark:focus:bg-navy-950 focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email Address with Quick Append Pills */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAppendDomain('@gmail.com')}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-brand-500/10 text-slate-600 dark:text-slate-300 hover:text-brand-500 font-mono transition-colors"
                        title="Append @gmail.com"
                      >
                        + @gmail.com
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppendDomain('@outlook.com')}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-brand-500/10 text-slate-600 dark:text-slate-300 hover:text-brand-500 font-mono transition-colors hidden sm:inline-block"
                        title="Append @outlook.com"
                      >
                        + @outlook.com
                      </button>
                    </div>
                  </div>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      autoComplete="username"
                      spellCheck="false"
                      inputMode="email"
                      enterKeyHint="next"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs sm:text-sm focus:bg-white dark:focus:bg-navy-950 focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setResetStatus(null);
                          setShowResetModal(true);
                        }}
                        className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-all"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      enterKeyHint="done"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs sm:text-sm focus:bg-white dark:focus:bg-navy-950 focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
                      tabIndex="-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dynamic Password Strength Indicator (Sign Up Mode) */}
                  {mode === 'register' && password && (
                    <div className="mt-2 space-y-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Password strength:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{passwordStrength.text}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full rounded-full transition-all duration-300 ${
                              step <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200 dark:bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Remember Me Option */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 dark:border-navy-700 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span>Stay signed in for 30 days</span>
                    </label>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:via-indigo-500 hover:to-brand-600 disabled:opacity-60 text-white font-bold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{mode === 'login' ? 'Signing in...' : 'Signing up...'}</span>
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <span>Sign In to AI-DETECTOR</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Security Watermark */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-4 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Direct MySQL Server 8.0 Validation & Firebase Authentication Engine</span>
        </p>
      </div>

      {/* Firebase Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Reset Password
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sent securely via Firebase Authentication
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetStatus(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {resetStatus && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 ${
                    resetStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {resetStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  )}
                  <span className="leading-relaxed">{resetStatus.message}</span>
                </div>
              )}

              <div>
                <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs focus:bg-white dark:focus:bg-navy-950 focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {resetLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Email</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-[#080d1a] border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Firebase Cloud Security
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetStatus(null);
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
