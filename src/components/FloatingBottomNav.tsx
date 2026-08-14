import React from 'react';
import { motion } from 'motion/react';
import { User, Home, BookOpen } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface FloatingBottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenPkb?: () => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onNavigate,
  onOpenPkb,
}) => {
  return (
    <nav className="shrink-0 w-full bg-slate-950/95 border-t border-white/10 backdrop-blur-xl z-30 pt-1.5 pb-[max(0.5rem,var(--sab))] px-2 flex justify-center items-center shadow-[0_-10px_30px_rgba(0,0,0,0.8)] select-none">
      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-2xl flex items-center justify-around shadow-lg">
        
        {/* 1. Beranda */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('dashboard')}
          className={`relative flex flex-col items-center transition-all cursor-pointer py-1.5 px-4 rounded-xl ${
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
          <span className="text-[10px] font-black tracking-wider uppercase mt-1 relative z-10">Beranda</span>
        </motion.button>

        {/* 2. PKB & Peraturan */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (onOpenPkb) {
              onOpenPkb();
            } else {
              onNavigate('severance');
            }
          }}
          className={`relative flex flex-col items-center transition-all cursor-pointer py-1.5 px-4 rounded-xl text-slate-400 hover:text-slate-200`}
        >
          <BookOpen className="w-5 h-5 relative z-10 hover:text-amber-400" />
          <span className="text-[10px] font-bold tracking-wider uppercase mt-1 relative z-10">PKB</span>
        </motion.button>

        {/* 3. Profil */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('profile')}
          className={`relative flex flex-col items-center transition-all cursor-pointer py-1.5 px-4 rounded-xl ${
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
          <span className="text-[10px] font-bold tracking-wider uppercase mt-1 relative z-10">Profil</span>
        </motion.button>

      </div>
    </nav>
  );
};

