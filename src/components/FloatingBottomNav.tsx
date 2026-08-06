import React from 'react';
import { QrCode, User, Home } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 backdrop-blur-xl px-4 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] max-w-7xl mx-auto select-none text-slate-600">
      
      {/* 1. Home */}
      <button 
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center transition-colors cursor-pointer ${
          activeTab === 'dashboard' ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className="p-1">
          <Home className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black tracking-wider uppercase">Home</span>
      </button>

      {/* 2. CENTER PROMINENT SCAN BUTTON (Scan Sembako) */}
      <button 
        onClick={() => onNavigate('sembako')}
        className="flex flex-col items-center -mt-6 cursor-pointer group"
        title="Scan Sembako Digital"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-red-500 border-4 border-white flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
          <QrCode className="w-7 h-7 text-white" />
        </div>
        <span className="text-[10px] font-black tracking-wider uppercase text-red-600 mt-0.5">Scan</span>
      </button>

      {/* 3. Profil */}
      <button 
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center transition-colors cursor-pointer ${
          activeTab === 'profile' ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className="p-1">
          <User className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase">Profil</span>
      </button>

    </div>
  );
};
