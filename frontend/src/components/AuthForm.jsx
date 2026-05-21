import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Mail, Lock, User, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AuthForm() {
  const { login, register, authError, authLoading } = useSocket();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please fill in all required credentials.');
      return;
    }

    if (!isLogin && !username) {
      setLocalError('Please choose a username.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    let success;
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(username, email, password);
    }

    if (success) {
      console.log('Authentication success!');
    }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-[calc(100vh-42px)] flex items-center justify-center p-4 relative overflow-hidden grid-bg">
      {/* Decorative Neon Blurs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[80px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-emerald-500/10 blur-[80px] -z-10 animate-pulse" />

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 relative z-20 overflow-hidden">
        {/* Glowing border line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neonCyan to-transparent" />

        {/* Brand Banner */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-3">
            <TrendingUp className="w-6 h-6 text-[#090a0f]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            BHARAT STOCKS
          </h1>
          <p className="text-xs text-textMuted mt-1">Real-Time Indian Paper Trading Terminal</p>
        </div>

        {/* Form Tabs */}
        <div className="flex bg-slate-950/60 p-1 rounded-lg mb-6 border border-white/5">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              isLogin ? 'bg-[#191d2c] text-white shadow shadow-cyan-500/15' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => {
              setIsLogin(true);
              setLocalError(null);
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              !isLogin ? 'bg-[#191d2c] text-white shadow shadow-cyan-500/15' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => {
              setIsLogin(false);
              setLocalError(null);
            }}
          >
            Register
          </button>
        </div>

        {/* Validation Errors */}
        {activeError && (
          <div className="mb-5 bg-rose-950/30 border border-rose-800/40 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-rose-300 animate-shake">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-neonRed" />
            <span>{activeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="choose_username"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-neonCyan rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-neonCyan/25"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="investor@indiastocks.in"
                className="w-full bg-slate-950/60 border border-white/5 focus:border-neonCyan rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-neonCyan/25"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-white/5 focus:border-neonCyan rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-neonCyan/25"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 py-3 rounded-lg text-sm font-bold shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 select-none"
          >
            {authLoading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              'Access Trading Deck'
            ) : (
              'Create Free Account'
            )}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6 text-center select-none">
            <p className="text-[11px] text-textMuted">
              💡 Register to instantly trade ₹1,00,000 in virtual capital.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
