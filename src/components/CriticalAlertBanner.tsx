import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface CriticalAlertBannerProps {
  showBanner: boolean;
  status: { defcon_level: number } | null;
  setIsBannerDismissed: (dismissed: boolean) => void;
}

const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({
  showBanner,
  status,
  setIsBannerDismissed,
}) => {
  return (
    <AnimatePresence>
      {showBanner && status && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-red-600 text-white overflow-hidden relative z-[60]"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider leading-tight">
                  Critical System Alert: {status.defcon_level <= 2 ? `DEFCON ${status.defcon_level} ACTIVE` : 'CRITICAL EMERGENCY DETECTED'}
                </p>
                <p className="text-[10px] font-medium opacity-90 uppercase tracking-widest">
                  Immediate attention required. Monitor all active feeds.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CriticalAlertBanner;