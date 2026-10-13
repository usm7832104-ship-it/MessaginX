import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Lock, User, AtSign, ArrowRight, ShieldCheck, Users, Sparkles, AlertCircle } from 'lucide-react';
import { MAX_MEMBERS_CAP } from '../services/chatService';

interface AuthModalProps {
  isOpen: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const {
    signInWithGoogle,
    signInWithCredentials,
    signUpWithCredentials,
    switchDemoUser,
    registeredCount,
    allMembers,
    isLoading
  } = useAuth();

  const [authMode, setAuthMode] = useState<'google' | 'credentials'>('google');
  const [credTab, setCredTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen) return null;

  const isCapReached = registeredCount >= MAX_MEMBERS_CAP;

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setActionLoading(true);
    const res = await signInWithGoogle();
    setActionLoading(false);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setActionLoading(true);

    if (credTab === 'signin') {
      if (!username || !password) {
        setErrorMessage('Please enter both username and password.');
        setActionLoading(false);
        return;
      }
      const res = await signInWithCredentials(username, password);
      setActionLoading(false);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } else {
      if (!displayName || !username || !password) {
        setErrorMessage('Name, username, and password are required.');
        setActionLoading(false);
        return;
      }
      if (isCapReached) {
        setErrorMessage(`Registration closed: Max limit of ${MAX_MEMBERS_CAP} members reached.`);
        setActionLoading(false);
        return;
      }
      const res = await signUpWithCredentials(displayName, username, password, bio);
      setActionLoading(false);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      {/* Background radial glow */}
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl p-6 sm:p-8"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 mb-3 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            PulseChat
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Exclusive real-time messaging workspace with glassmorphism design.
          </p>

          {/* 15-Member Quota Bar */}
          <div className="w-full mt-4 p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Member Capacity
              </span>
              <span className={`font-mono text-xs tabular-nums ${isCapReached ? 'text-amber-400 font-semibold' : 'text-cyan-400'}`}>
                {registeredCount} / {MAX_MEMBERS_CAP} joined
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCapReached
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (registeredCount / MAX_MEMBERS_CAP) * 100)}%` }}
              />
            </div>
            {isCapReached && (
              <p className="text-[11px] text-amber-300 text-left flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                Capacity reached. Existing members can sign in below.
              </p>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-slate-950/60 p-1 mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setAuthMode('google'); setErrorMessage(null); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              authMode === 'google'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Sign-In (Primary)
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('credentials'); setErrorMessage(null); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              authMode === 'credentials'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Username & Password
          </button>
        </div>

        {/* Mode 1: Primary Google Sign-in */}
        {authMode === 'google' && (
          <div className="space-y-4">
            <button
              type="button"
              disabled={actionLoading || isLoading}
              onClick={handleGoogleLogin}
              className="w-full h-12 rounded-xl bg-white text-slate-900 font-medium text-sm flex items-center justify-center gap-3 shadow-lg shadow-white/5 hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>{actionLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <p className="text-[11px] text-center text-slate-500">
              One-click Google authentication via Firebase Auth popup.
            </p>
          </div>
        )}

        {/* Mode 2: Secondary Username and Password */}
        {authMode === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            <div className="flex gap-2 text-xs border-b border-white/10 pb-2 mb-3">
              <button
                type="button"
                onClick={() => { setCredTab('signin'); setErrorMessage(null); }}
                className={`pb-1 font-medium transition-colors ${
                  credTab === 'signin'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                disabled={isCapReached}
                onClick={() => { setCredTab('signup'); setErrorMessage(null); }}
                className={`pb-1 font-medium transition-colors ${
                  credTab === 'signup'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : isCapReached
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register New Account {isCapReached ? '(Cap Reached)' : ''}
              </button>
            </div>

            {credTab === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Maya Lin"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Status / Bio (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Building sleek interfaces 🚀"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {credTab === 'signup' ? 'Handle (@username)' : 'Username or Email'}
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder={credTab === 'signup' ? 'mayalin' : 'username or email'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <span>{actionLoading ? 'Processing...' : credTab === 'signin' ? 'Sign In with Username' : 'Create Account & Join'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <p className="text-[11px] text-center text-slate-400 mt-2">
              {credTab === 'signin'
                ? 'Tip: Preset members can sign in with password "password123"'
                : 'Choose any username (min 3 chars) and password (min 4 chars)'}
            </p>
          </form>
        )}

        {/* Quick Testing Switcher */}
        {allMembers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Quick Cohort Testing Switcher
              </span>
              <span className="text-[10px] text-slate-500">1-click simulation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {allMembers.slice(0, 6).map((member) => (
                <button
                  key={member.uid}
                  type="button"
                  onClick={() => switchDemoUser(member)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-white/5 hover:border-cyan-500/30 text-left transition-all"
                >
                  <img
                    src={member.photoURL}
                    alt={member.displayName}
                    className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-slate-200 truncate">{member.displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate">@{member.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
