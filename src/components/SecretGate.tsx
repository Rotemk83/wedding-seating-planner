import React, { useState } from 'react';
import { Lock, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { setSecretGateUnlocked } from '../lib/storage';

interface SecretGateProps {
  onUnlock: () => void;
}

export const SecretGate: React.FC<SecretGateProps> = ({ onUnlock }) => {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      if (secret.trim().toLowerCase() === 'kingabso') {
        setSecretGateUnlocked(true);
        onUnlock();
      } else {
        setError(true);
        setLoading(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Private Event Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Wedding Seating Planner</h1>
          <p className="text-sm text-slate-400 mt-1">Smart Event Seating Planner  סידור הושבה חכם</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 text-left">
              Please enter the secret
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value);
                  if (error) setError(false);
                }}
                placeholder=""
                autoFocus
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/60 border rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all ${
                  error
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 animate-shake'
                    : 'border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-2 text-left">Incorrect secret. Please check and try again.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !secret.trim()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-150 active:scale-[0.98]"
          >
            <span>{loading ? 'Verifying...' : 'Enter Planner'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
          <p className="text-xs text-slate-500">
            Authorized session is remembered locally on this device.
          </p>
        </div>
      </div>
    </div>
  );
};
