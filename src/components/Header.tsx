import React, { useState, useEffect } from 'react';
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
  WifiOff
} from 'lucide-react';
import { UserAccount, UserRole, checkIsSuperAdmin } from '../types';
import { ConfirmModal } from './ConfirmModal';
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
    const targetUser = availableUsers.find(u => 
      u.username?.toLowerCase() === uName || 
      u.name.toLowerCase() === uName ||
      u.email.toLowerCase() === uName
    );

    if (!targetUser) {
      setLoginError('Username tidak ditemukan!');
      return;
    }

    if (targetUser.password && targetUser.password !== inputPassword) {
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
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#5a0000] via-[#3d0000] to-[#120000] border-b border-red-900/60 text-white shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* Left Side: Logo Emblem + App Title */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-red-900/50 focus:outline-none transition-colors cursor-pointer shrink-0 border border-red-800/40"
                title="Menu Navigasi Sidebar"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </button>

              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={fsbnLogo} 
                  alt="FSBN Emblem" 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-contain bg-black p-0.5 border border-red-600 shadow-md shrink-0" 
                />
                <div className="flex flex-col min-w-0">
                  <h1 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase truncate leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    PORTAL KOORDINASI
                  </h1>
                  <span className="text-[9px] sm:text-[10px] font-bold text-red-300 tracking-wide uppercase truncate leading-tight opacity-90">
                    SBN KASBI PT VICTORY CHINGLUH INDONESIA
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Notifications & Active Profile */}
            <div className="flex items-center space-x-2 shrink-0">

              {/* Internet Connection Status Badge */}
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border shadow-md transition-all ${
                  isOnline 
                    ? 'bg-emerald-950/90 text-emerald-400 border-emerald-600/80 shadow-emerald-950/50' 
                    : 'bg-rose-950/90 text-rose-300 border-rose-600/80 shadow-rose-950/50 animate-pulse'
                }`}
                title={isOnline ? 'Status Internet: Terhubung (Online / Always On)' : 'Status Internet: Terputus (Offline)'}
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
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 rounded-full shadow-sm" title="Terhubung Real-time ke Cloud Database Firebase">
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
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-red-900/60 text-white transition-colors cursor-pointer"
                title="Notifikasi Aktivitas Terbaru"
              >
                <Bell className="w-5 h-5 text-red-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border border-black shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>



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

      {/* MODAL PETUNJUK INSTALL APLIKASI INDEPENDEN (PWA / HOMESCREEN) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-left text-slate-900">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 text-red-600 border border-red-200">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Install Aplikasi SBN KASBI</h3>
                <p className="text-xs text-slate-500">Pikatsu Aplikasi Standalone / PWA di HP Android & Laptop</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Cara Pasang di HP Android (Chrome / Edge):
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1">
                <li>Buka link aplikasi di browser Chrome HP Anda.</li>
                <li>Tekan tombol menu titik tiga (<b>⋮</b>) di pojok kanan atas browser.</li>
                <li>Pilih <b>"Tambahkan ke Layar Utama"</b> (<i>Add to Home Screen</i>) atau <b>"Install Aplikasi"</b>.</li>
                <li>Aplikasi SBN KASBI akan terpasang langsung di layar utama HP seperti aplikasi APK native tanpa bilah browser.</li>
              </ol>

              <div className="pt-2 border-t border-slate-200">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Keunggulan Aplikasi Standalone:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 mt-1">
                  <li>Layar penuh (Fullscreen) mandiri & ringan.</li>
                  <li>Akses kamera scan QR Code sembako lebih responsif.</li>
                  <li>Terhubung langsung ke Cloud Database Firebase.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

