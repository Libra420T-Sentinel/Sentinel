import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertOctagon, ShieldAlert, ExternalLink, Skull } from 'lucide-react';
import { cn } from '../utils';

interface DefconOneOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  cause?: {
    title: string;
    summary: string;
    source_url?: string;
  };
}

const DefconOneOverlay: React.FC<DefconOneOverlayProps> = ({ isOpen, onClose, cause }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-red-950/90 backdrop-blur-xl overflow-hidden"
        >
          {/* Background Glitch Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            <motion.div 
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.1, repeat: Infinity }}
              className="absolute inset-0 bg-red-600/10"
            />
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="relative w-full max-w-2xl bg-black border-4 border-red-600 shadow-[0_0_100px_rgba(220,38,38,0.8)] rounded-none overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black rounded-none">
                  <Skull className="w-10 h-10 text-red-600 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
                    DEFCON 1
                  </h1>
                  <p className="text-black font-mono text-xs font-bold uppercase tracking-widest mt-1">
                    Maximum Readiness Reached
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/10 transition-colors text-black"
              >
                <AlertOctagon className="w-8 h-8" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-sm font-black uppercase tracking-[0.3em]">Status Meaning</span>
                </div>
                <p className="text-2xl font-bold text-white leading-tight italic">
                  "Maximum readiness. All forces ready for immediate action. Nuclear war is imminent or has already commenced."
                </p>
              </div>

              {cause && (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-6 bg-red-600/10 border border-red-600/30 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">Primary Trigger Event</span>
                    <span className="px-2 py-0.5 bg-red-600 text-black text-[8px] font-black uppercase">Critical</span>
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    {cause.title}
                  </h2>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {cause.summary}
                  </p>
                  
                  {cause.source_url && (
                    <a 
                      href={cause.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-black font-black uppercase tracking-widest text-xs hover:bg-red-500 transition-all"
                    >
                      Official Intelligence Report
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </motion.div>
              )}

              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  <span className="text-[10px] font-mono text-red-500 uppercase font-bold">System Lockdown Active</span>
                </div>
                <p className="text-[10px] font-mono text-white/30 uppercase">
                  Sovereign-Resilience v4.0.2 // Auth: Level 5
                </p>
              </div>
            </div>

            {/* Scanning Line Effect */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-px bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10 pointer-events-none"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DefconOneOverlay;
