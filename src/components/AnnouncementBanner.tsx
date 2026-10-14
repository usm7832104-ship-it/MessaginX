import React, { useState, useEffect } from 'react';
import { GlobalAnnouncement } from '../types';
import { Info, AlertTriangle, AlertCircle, X, Shield, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnnouncementBannerProps {
  announcement?: GlobalAnnouncement;
  isAdmin: boolean;
  onOpenAdminPortal: () => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcement,
  isAdmin,
  onOpenAdminPortal
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (announcement?.id) {
      const dismissedId = localStorage.getItem('pulsechat_dismissed_announcement');
      if (dismissedId === announcement.id) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    }
  }, [announcement?.id]);

  if (!announcement || !announcement.active || !announcement.text || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    if (announcement?.id) {
      localStorage.setItem('pulsechat_dismissed_announcement', announcement.id);
    }
    setIsDismissed(true);
  };

  const getSeverityStyles = () => {
    switch (announcement.severity) {
      case 'alert':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-200',
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      default:
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200',
          icon: <Megaphone className="w-4 h-4 text-cyan-400 shrink-0" />,
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`w-full border-b backdrop-blur-xl px-4 py-2 flex items-center justify-between gap-3 text-xs z-30 shrink-0 shadow-sm ${styles.bg}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {styles.icon}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${styles.badge}`}>
            Announcement
          </span>
          <p className="truncate font-medium">{announcement.text}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={onOpenAdminPortal}
              className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium transition-colors flex items-center gap-1"
              title="Manage Announcements"
            >
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>Admin</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
