import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';
import Markdown from 'react-markdown';

interface AboutModalProps {
  isAboutOpen: boolean;
  setIsAboutOpen: (isOpen: boolean) => void;
  DEFCON_DESCRIPTIONS: { [key: number]: string };
}

const AboutModal: React.FC<AboutModalProps> = ({
  isAboutOpen,
  setIsAboutOpen,
  DEFCON_DESCRIPTIONS,
}) => {
  return (
    <AnimatePresence>
      {isAboutOpen && (
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
            className="bg-[#121214] border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white/40" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Sentinel Protocol</h2>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Global Emergency Monitoring System</p>
              </div>
            </div>

            <div className="space-y-6 text-white/70 leading-relaxed">
              <section>
                <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">Purpose</h3>
                <p className="text-sm">
                  Sentinel is an advanced monitoring platform designed to aggregate, analyze, and visualize global emergencies in real-time. By leveraging cutting-edge AI and open-source intelligence, it provides a unified dashboard for tracking conflicts, natural disasters, and geopolitical tensions.
                </p>
              </section>

              <section>
                <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">Data Sources</h3>
                <p className="text-sm">
                  Our system utilizes the Gemini Intelligence Network to scan global news feeds, social media reports, and official government broadcasts. It cross-references multiple sources to provide a high-confidence assessment of ongoing events.
                </p>
              </section>

              <section>
                <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">DEFCON Interpretation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {Object.entries(DEFCON_DESCRIPTIONS).map(([level, desc]) => (
                    <div key={level} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-mono font-black text-white/40">LEVEL {level}</span>
                      <p className="text-[11px] mt-1 leading-tight">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-mono text-white/30 uppercase">Version 2.4.0-BETA • OSINT-ENABLED</p>
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="px-6 py-2 bg-white text-black text-xs font-bold rounded-full uppercase tracking-widest hover:bg-white/90 transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AboutModal;