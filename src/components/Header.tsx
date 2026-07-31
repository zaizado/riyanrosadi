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
  Check
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
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* Left Side: Cloud Realtime Badge & Mobile Menu Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors cursor-pointer shrink-0"
                title="Menu Navigasi"
              >
                <Menu className="w-6 h-6" />
              </button>

              <span className="px-2 py-1 text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60 rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm" title="Terhubung Real-time ke Cloud Database Firebase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Cloud Realtime</span>
              </span>
            </div>

            {/* Right Side: Notifications & Active Profile */}
            <div className="flex items-center space-x-2 shrink-0">

              {/* Current Active User Info & Avatar */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-red-400 font-medium">{currentUser.role}</span>
              </div>

              {/* Notifications Feed Button */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Notifikasi Aktivitas Terbaru"
              >
                <Bell className="w-5 h-5 text-red-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Current Active User Avatar & Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <img 
                  src={currentUser.avatarUrl || cheAvatar} 
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-red-600 shadow-md bg-red-950" 
                  referrerPolicy="no-referrer"
                />
                
                {onLogout && (
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/80 border border-rose-800/40 transition-colors flex items-center gap-1.5 cursor-pointer bg-rose-950/40"
                    title="Keluar / Logout Aplikasi"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold hidden sm:inline">Logout</span>
                  </button>
                )}
              </div>

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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-left">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Install Aplikasi SBN KASBI</h3>
                <p className="text-xs text-slate-400">Pikatsu Aplikasi Standalone / PWA di HP Android & Laptop</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Cara Pasang di HP Android (Chrome / Edge):
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                <li>Buka link aplikasi di browser Chrome HP Anda.</li>
                <li>Tekan tombol menu titik tiga (<b>⋮</b>) di pojok kanan atas browser.</li>
                <li>Pilih <b>"Tambahkan ke Layar Utama"</b> (<i>Add to Home Screen</i>) atau <b>"Install Aplikasi"</b>.</li>
                <li>Aplikasi SBN KASBI akan terpasang langsung di layar utama HP seperti aplikasi APK native tanpa bilah browser.</li>
              </ol>

              <div className="pt-2 border-t border-slate-800">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Keunggulan Aplikasi Standalone:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 mt-1">
                  <li>Layar penuh (Fullscreen) mandiri & ringan.</li>
                  <li>Akses kamera scan QR Code sembako lebih responsif.</li>
                  <li>Terhubung langsung ke Cloud Database Firebase.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/30 cursor-pointer"
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

