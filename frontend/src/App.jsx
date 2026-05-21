import React from 'react';
import { useSocket } from './context/SocketContext';
import TickerTape from './components/TickerTape';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';

export default function App() {
  const { isAuthenticated, authLoading } = useSocket();

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-start relative select-none">
      {/* Dynamic Grid Background layer */}
      <div className="absolute inset-0 grid-bg opacity-45 -z-20 pointer-events-none" />

      {/* 1. Global High Frequency Ticker Tape */}
      <TickerTape />

      {/* 2. Central Routing Viewport */}
      {authLoading ? (
        <div className="flex-1 flex flex-col justify-center items-center gap-4 bg-background">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-neonCyan rounded-full animate-spin shadow-cyan-glow" />
            <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-neonGreen rounded-full animate-spin absolute" style={{ animationDirection: 'reverse' }} />
          </div>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-300 animate-pulse">Syncing exchange feed...</p>
            <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mt-1">Connecting to NSE/BSE WebSockets</p>
          </div>
        </div>
      ) : isAuthenticated ? (
        <main className="flex-1 w-full relative z-10">
          <Dashboard />
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center relative z-10 w-full">
          <AuthForm />
        </main>
      )}
    </div>
  );
}
