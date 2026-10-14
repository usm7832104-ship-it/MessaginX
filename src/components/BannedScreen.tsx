import React, { useState, useEffect } from 'react';
import { UserBanInfo } from '../types';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { unbanMember } from '../services/chatService';

interface BannedScreenProps {
  banInfo: UserBanInfo;
  userId: string;
}

export const BannedScreen: React.FC<BannedScreenProps> = ({ banInfo, userId }) => {
  const { logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  const isTemporary = banInfo.banType === 'temporary' && banInfo.banExpiresAt;

  useEffect(() => {
    if (!isTemporary || !banInfo.banExpiresAt) return;

    const targetTime = new Date(banInfo.banExpiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isTemporary, banInfo.banExpiresAt]);

  const handleRefresh = async () => {
    if (timeLeft.isExpired) {
      await unbanMember(userId, 'System Auto-Unban');
      window.location.reload();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl select-none">
      <div className="absolute w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-red-500/30 p-6 sm:p-8 text-center shadow-2xl overflow-hidden"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-red-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white mb-1">Account Suspended</h1>
        <p className="text-xs text-slate-400 mb-6">
          Your access to PulseChat has been restricted by an administrator.
        </p>

        {/* Reason Box */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-left mb-6 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Suspension Type:</span>
            <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
              isTemporary ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {banInfo.banType} Ban
            </span>
          </div>

          <div className="text-xs text-slate-300">
            <span className="text-slate-500 block mb-1">Reason:</span>
            <p className="italic bg-black/30 p-2.5 rounded-xl border border-white/5 text-slate-200">
              "{banInfo.banReason || 'Administrative policy violation.'}"
            </p>
          </div>

          {/* Countdown timer for temporary ban */}
          {isTemporary && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Remaining Suspension Time:
              </span>
              {timeLeft.isExpired ? (
                <div className="text-emerald-400 text-xs font-semibold">
                  Suspension time has expired! Click "Restore Access" below.
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 font-mono text-xl font-bold text-amber-300 bg-amber-500/10 py-2 rounded-xl border border-amber-500/20">
                  <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
                  <span>:</span>
                  <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
                  <span>:</span>
                  <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={logout}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          {timeLeft.isExpired && (
            <button
              onClick={handleRefresh}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore Access</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
