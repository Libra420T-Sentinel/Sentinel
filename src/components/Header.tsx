import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Settings, 
  History, 
  Info, 
  Play, 
  Pause, 
  Globe, 
  Sun, 
  Moon, 
  Zap, 
  Activity, 
  X,
  Bell,
  BellOff,
  RefreshCw,
  Search
} from 'lucide-react';
import { cn } from '../utils';

interface HeaderProps {
  showHeader: boolean;
  defconLevel: number;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isPanicMode: boolean;
  togglePanicMode: () => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setIsHistoryOpen: (isOpen: boolean) => void;
  setIsAboutOpen: (isOpen: boolean) => void;
  isInitialScan: boolean;
  startInitialScan: () => void;
  isLoading: boolean;
  setIsDefconInfoOpen: (isOpen: boolean) => void;
  setSearchLocation: (location: string) => void;
  setActiveLocation: (location: string) => void;
  fetchStatus: (location?: string) => Promise<void>;
  searchLocation: string;
  clearSearch: () => void;
  handleSearch: (e: React.FormEvent) => void;
  toggleNotifications: () => void;
  notificationsEnabled: boolean;
  isAutoScanning: boolean;
  setIsAutoScanning: (isScanning: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  showHeader,
  defconLevel,
  theme,
  setTheme,
  isPanicMode,
  togglePanicMode,
  setIsSettingsOpen,
  setIsHistoryOpen,
  setIsAboutOpen,
  isInitialScan,
  startInitialScan,
  isLoading,
  setIsDefconInfoOpen,
  setSearchLocation,
  setActiveLocation,
  fetchStatus,
  searchLocation,
  clearSearch,
  handleSearch,
  toggleNotifications,
  notificationsEnabled,
  isAutoScanning,
  setIsAutoScanning
}) => {
  return (
    <motion.header className={cn(
      "border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50 transition-transform duration-300",
      showHeader ? "translate-y-0" : "-translate-y-full"
    )}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* Logo & Search & Gemini Group */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-sm font-bold tracking-tight uppercase leading-none">Sentinel</h1>
              <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest leading-none mt-0.5">Global Emergency Monitor</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-white/20 group-focus-within:text-red-500 transition-colors" />
            </div>
            <input 
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Search region..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-9 text-xs focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
            />
            {searchLocation && (
              <button 
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-3 flex items-center text-white/20 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <a 
            href="https://gemini.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#4285F4] to-[#9B72CB] hover:opacity-90 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(66,133,244,0.2)] transition-all active:scale-95 shrink-0"
          >
            <Zap className="w-3 h-3 fill-white" />
            <span className="hidden sm:inline">Ask Gemini</span>
          </a>

          <button 
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_10px_rgba(255,255,255,0.05)] shrink-0"
          >
            <Info className="w-3 h-3" />
            <span className="hidden sm:inline">About Sentinel</span>
          </button>
        </div>

        {/* Controls Group */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              title="Alert History"
            >
              <History className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {!isInitialScan ? (
              <button 
                onClick={startInitialScan}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md text-[9px] font-bold hover:bg-red-700 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>START SCAN</span>
              </button>
            ) : (
              <>
                <button 
                  onClick={toggleNotifications}
                  className={cn(
                    "p-1.5 rounded-full transition-all duration-200",
                    notificationsEnabled ? "text-red-500 bg-red-500/10" : "text-white/40 hover:text-white/60"
                  )}
                >
                  {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>
                
                <button 
                  onClick={() => setIsAutoScanning(!isAutoScanning)}
                  className={cn(
                    "hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold transition-all",
                    isAutoScanning ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                  )}
                >
                  <Activity className={cn("w-3 h-3", isAutoScanning && "animate-pulse")} />
                  {isAutoScanning ? "AUTO" : "SCAN"}
                </button>

                <button 
                  onClick={() => fetchStatus()}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-md text-[9px] font-bold hover:bg-white/90 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                  <span>{isLoading ? "..." : "REFRESH"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;