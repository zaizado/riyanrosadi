import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Menu, 
  Bell, 
  User, 
  ChevronDown, 
  Smartphone, 
  RefreshCw, 
  LogOut,
  Sparkles,
  Users,
  X,
  CheckCircle2,
  ExternalLink,
  Cloud,
  Lock,
  KeyRound,
  LogIn,
  Download,
  Check,
  Wifi,
  WifiOff,
  Clock as ClockIcon
} from 'lucide-react';
import { UserAccount, UserRole, checkIsSuperAdmin } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { AndroidInstallModal } from './AndroidInstallModal';
import { INITIAL_USERS } from '../data/initialData';
import { FsbnLogo } from './FsbnLogo';
import fsbnLogo from '../assets/images/fsbn_logo_emblem_1785338169849.jpg';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';

interface HeaderProps {
  currentUser: UserAccount;
  users?: UserAccount[];
  onSwitchUser: (user: UserAccount) => void;
  onToggleSidebar: () => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users = [],
  onSwitchUser,
  onToggleSidebar,
  isMobilePreview,
  onToggleMobilePreview,
  onOpenNotifications,
  unreadCount,
  onLogout,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Internet Connection State
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Live Clock State
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

  // Login form state
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const availableUsers = users.length > 0 ? users : [currentUser];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const uName = inputUsername.trim().toLowerCase();
    const uPass = inputPassword.trim();

    let targetUser = availableUsers.find(u => 
      (u.username && u.username.trim().toLowerCase() === uName) || 
      (u.name && u.name.trim().toLowerCase() === uName) ||
      (u.email && u.email.trim().toLowerCase() === uName) ||
      (u.nik && u.nik.trim().toLowerCase() === uName)
    );

    if (!targetUser && (uName === 'sbnkasbivci1' || uName === 'superadmin' || uName === 'superadmin@sbn-kasbi-vci.or.id')) {
      targetUser = INITIAL_USERS[0];
    }

    if (!targetUser) {
      setLoginError('Username/NIK tidak ditemukan!');
      return;
    }

    const expectedPass = targetUser.password || (targetUser.username?.toLowerCase() === 'sbnkasbivci1' ? 'superadmin1' : '');
    const isPassValid = expectedPass === uPass || expectedPass.toLowerCase() === uPass.toLowerCase();

    if (!isPassValid) {
      setLoginError('Password tidak sesuai!');
      return;
    }

    // Success login
    onSwitchUser(targetUser);
    setIsLoginModalOpen(false);
    setInputUsername('');
    setInputPassword('');
  };

  return (
    <>
      <header className="shrink-0 w-full z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all pt-[var(--sat)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* Left Side: Logo Emblem + App Title */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-red-400 hover:text-white hover:bg-red-600/20 focus:outline-none transition-all cursor-pointer shrink-0 border border-red-500/30 glow-red-sm"
                title="Menu Navigasi Sidebar"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>

              <div className="flex items-center gap-2.5 min-w-0">
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  className="relative shrink-0"
                >
                  <img 
                    src={fsbnLogo} 
                    alt="FSBN Emblem" 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-slate-950 p-0.5 border border-red-500/60 shadow-lg glow-red-sm shrink-0" 
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                </motion.div>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase truncate leading-tight flex items-center gap-1.5 drop-shadow-[0_2px_8px_rgba(220,38,38,0.5)]">
                    PORTAL KOORDINASI
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse hidden xs:inline-block" />
                  </h1>
                  <span className="text-[9px] sm:text-[10px] font-bold text-red-300/90 tracking-wide uppercase truncate leading-tight">
                    SBN KASBI PT VICTORY CHINGLUH INDONESIA
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Status, Live Clock & Active Profile */}
            <div className="flex items-center space-x-2 shrink-0">

              {/* Live Clock Display */}
              {timeString && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono font-bold text-slate-300 shadow-inner">
                  <ClockIcon className="w-3 h-3 text-red-400 animate-pulse" />
                  <span>{timeString} WIB</span>
                </div>
              )}

              {/* Internet Connection Status Badge */}
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border shadow-md transition-all ${
                  isOnline 
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 glow-emerald' 
                    : 'bg-rose-950/90 text-rose-300 border-rose-500/60 animate-pulse'
                }`}
                title={isOnline ? 'Status Internet: Terhubung (Online)' : 'Status Internet: Terputus (Offline)'}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className="hidden xs:inline tracking-wide">{isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {/* Cloud Realtime Badge */}
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-full shadow-sm" title="Terhubung Real-time ke Cloud Database Firebase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Sync</span>
              </span>

              {/* Current Active User Info */}
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-red-400 font-semibold">{currentUser.role}</span>
              </div>

              {/* Notifications Feed Button with Badge */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-white transition-all cursor-pointer shadow-md"
                title="Notifikasi Aktivitas Terbaru"
              >
                <Bell className="w-5 h-5 text-red-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border border-slate-950 shadow-md animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

            </div>
          </div>
        </div>
      </header>

      {/* CONFIRM LOGOUT MODAL */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Keluar / Logout Aplikasi"
        message={`Apakah Anda yakin ingin keluar dari akun ${currentUser.name} (${currentUser.role})?`}
        confirmText="Ya, Logout Sekarang"
        cancelText="Batal"
        type="danger"
        icon="logout"
        onConfirm={() => {
          setShowLogoutModal(false);
          if (onLogout) onLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* MODAL PETUNJUK INSTALL APLIKASI ANDROID (PWA & APK NATIVE) */}
      <AndroidInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

    </>
  );
};

