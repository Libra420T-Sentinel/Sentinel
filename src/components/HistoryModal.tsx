import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { cn } from '../utils';
import { format } from 'date-fns';

interface AlertHistoryItem {
  id: string;
  type: 'DEFCON_CHANGE' | 'EMERGENCY_ALERT';
  title: string;
  description: string;
  timestamp: string | number;
  level?: number;
}

interface HistoryModalProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
  alertHistory: AlertHistoryItem[];
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  alertHistory,
}) => {
  return (
    <AnimatePresence>
      {isHistoryOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#121214] border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative shadow-2xl"
          >
            <button 
              onClick={() => setIsHistoryOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white/40" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <History className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Alert History</h2>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Chronological Log of Critical Events</p>
              </div>
            </div>

            <div className="space-y-4">
              {alertHistory.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl">
                  <p className="text-white/20 font-mono text-xs uppercase tracking-widest">No history recorded in this session</p>
                </div>
              ) : (
                alertHistory.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-start">
                    <div className={cn(
                      "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                      item.type === 'DEFCON_CHANGE' ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
                    )}>
                      {item.type === 'DEFCON_CHANGE' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">{item.title}</h4>
                        <span className="text-[10px] font-mono text-white/60">{format(new Date(item.timestamp), 'HH:mm:ss')}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
                      {item.level && (
                        <div className="mt-2 inline-block px-2 py-0.5 rounded bg-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest">
                          DEFCON {item.level}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HistoryModal;