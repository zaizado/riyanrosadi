import React from 'react';
import { motion } from 'motion/react';
import { QrCode, User, Home, Users, Calculator, Sparkles } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface FloatingBottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onNavigate,
}) => {
  return (
    <nav className="shrink-0 w-full bg-slate-950/95 border-t border-white/10 backdrop-blur-xl z-30 pt-1.5 pb-[max(0.5rem,var(--sab))] px-2 flex justify-center items-center shadow-[0_-10px_30px_rgba(0,0,0,0.8)] select-none">
      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-2xl flex items-center justify-around shadow-lg">
        
        {/* 1. Home */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('dashboard')}
          className={`relative flex flex-col items-center transition-all cursor-pointer py-1 px-2.5 rounded-xl ${
            activeTab === 'dashboard' 
              ? 'text-red-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'dashboard' && (
            <motion.div 
              layoutId="activeTabGlow"
              className="absolute inset-0 bg-red-600/20 rounded-xl border border-red-500/40 glow-red-sm" 
            />
          )}
          <Home className="w-5 h-5 relative z-10" />
          <span className="text-[9px] font-black tracking-wider uppercase mt-0.5 relative z-10">Home</span>
        </motion.button>

        {/* 2. Anggota */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('members')}
          className={`relative flex flex-col items-center transition-all cursor-pointer py-1 px-2.5 rounded-xl ${
            activeTab === 'members' 
              ? 'text-red-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'members' && (
            <motion.div 
              layoutId="activeTabGlow"
              className="absolute inset-0 bg-red-600/20 rounded-xl border border-red-500/40 glow-red-sm" 
            />
          )}
          <Users className="w-5 h-5 relative z-10" />
          <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5 relative z-10">Anggota</span>
        </motion.button>

        {/* 3. CENTER PROMINENT SCAN BUTTON (Scan Sembako) */}
        <motion.button 
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onNavigate('sembako')}
          className="flex flex-col items-center -mt-4 cursor-pointer group"
          title="Scan Sembako Digital"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-red-600 to-amber-500 rounded-full blur-md opacity-80 group-hover:opacity-100 transition-opacity animate-pulse" />
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-red-500 border-2 border-white/80 flex items-center justify-center text-white shadow-xl">
              <QrCode className="w-5 h-5 text-white drop-shadow-md" />
            </div>
          </div>
          <span className="text-[9px] font-black tracking-wider uppercase text-red-400 mt-0.5 drop-shadow flex items-center gap-0.5">
            Scan <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          </span>
        </motion.button>

        {/* 4. PKB */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('severance')}
          className={`relative flex flex-col items-center transition-all cursor-pointer py-1 px-2.5 rounded-xl ${
            activeTab === 'severance' 
              ? 'text-red-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'severance' && (
            <motion.div 
              layoutId="activeTabGlow"
              className="absolute inset-0 bg-red-600/20 rounded-xl border border-red-500/40 glow-red-sm" 
            />
          )}
          <Calculator className="w-5 h-5 relative z-10" />
          <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5 relative z-10">PKB</span>
        </motion.button>

        {/* 5. Profil */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('profile')}
          className={`relative flex flex-col items-center transition-all cursor-pointer py-1 px-2.5 rounded-xl ${
            activeTab === 'profile' 
              ? 'text-red-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'profile' && (
            <motion.div 
              layoutId="activeTabGlow"
              className="absolute inset-0 bg-red-600/20 rounded-xl border border-red-500/40 glow-red-sm" 
            />
          )}
          <User className="w-5 h-5 relative z-10" />
          <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5 relative z-10">Profil</span>
        </motion.button>

      </div>
    </nav>
  );
};

