import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Volume2, Music, Sun, Moon } from 'lucide-react';
import { cn } from '../utils';

interface SettingsModalProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  handleSoundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customSoundUrl: string | null;
  setCustomSoundUrl: (url: string | null) => void;
  playAlertSound: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isSettingsOpen,
  setIsSettingsOpen,
  handleSoundUpload,
  customSoundUrl,
  setCustomSoundUrl,
  playAlertSound,
}) => {
  return (
    <AnimatePresence>
      {isSettingsOpen && (
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
            className="bg-[#121214] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl"
          >
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white/40" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Settings className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">System Settings</h2>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Configure Sovereign-Resilience Intelligence Network Interface</p>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-white font-bold uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                  <Volume2 className="w-3 h-3" />
                  Alert Audio
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-white/60 mb-3">Custom Alert Sound (.mp3, .wav)</p>
                    <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all">
                      <Music className="w-4 h-4 text-white/40" />
                      <span className="text-xs font-bold text-white/40">Upload Audio File</span>
                      <input type="file" accept="audio/*" onChange={handleSoundUpload} className="hidden" />
                    </label>
                    {customSoundUrl && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-500 font-mono">CUSTOM SOUND LOADED</span>
                        <button onClick={() => setCustomSoundUrl(null)} className="text-[10px] text-red-500 hover:underline">Remove</button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={playAlertSound}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Test Alert Sound
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;