import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Scale, 
  HeartPulse, 
  CalendarDays, 
  Gift, 
  ShieldCheck, 
  BookOpen, 
  FileSpreadsheet, 
  Database, 
  X,
  ChevronRight,
  Sparkles,
  Info,
  Car,
  KeyRound,
  LogOut,
  Wallet,
  MessageSquare,
  User,
  UserCheck,
  Newspaper,
  HeartHandshake,
  Calculator
} from 'lucide-react';
import { UserAccount, checkIsSuperAdmin } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { FsbnLogo } from './FsbnLogo';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { ModalPortal } from './ModalPortal';

export type ActiveTab = 
  | 'dashboard'
  | 'members'
  | 'structure'
  | 'advocacy'
  | 'severance'
  | 'sick_visits'
  | 'fundraising'
  | 'agendas'
  | 'sembako'
  | 'vehicles'
  | 'finance'
  | 'chat'
  | 'profile'
  | 'super_admin'
  | 'system';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserAccount;
  onLogout?: () => void;
  onOpenPkb?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  onOpenPkb,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const isSuperAdmin = checkIsSuperAdmin(currentUser);

  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Overview',
      subtitle: 'Ringkasan & Stat Organisasi',
      icon: LayoutDashboard,
      badge: null,
      color: 'text-red-500'
    },
    {
      id: 'structure' as ActiveTab,
      label: 'Struktur Pengurus',
      subtitle: 'Daftar Pengurus & Korlap',
      icon: ShieldCheck,
      badge: '36',
      color: 'text-red-500'
    },
    {
      id: 'members' as ActiveTab,
      label: 'Data Anggota',
      subtitle: 'Pusat Database & Kartu Digital',
      icon: Users,
      badge: null,
      color: 'text-red-500'
    },
    {
      id: 'profile' as ActiveTab,
      label: 'Profil Pengguna',
      subtitle: 'Detail Akun & Ubah Foto',
      icon: User,
      badge: null,
      color: 'text-red-500'
    },
    {
      id: 'advocacy' as ActiveTab,
      label: 'Advokasi',
      subtitle: 'Pendampingan Kasus Industrial',
      icon: Scale,
      badge: null,
      color: 'text-red-500'
    },
    {
      id: 'pkb_modal' as any,
      label: 'PKB & Peraturan',
      subtitle: 'Buku Pedoman Kerja & Peraturan',
      icon: BookOpen,
      badge: 'RESMI',
      color: 'text-amber-400',
      isPkb: true
    },
    {
      id: 'severance' as ActiveTab,
      label: 'Simulasi Pesangon',
      subtitle: 'Kalkulator Hak PHK & Kompensasi',
      icon: Calculator,
      badge: 'BARU',
      color: 'text-amber-400'
    },
    {
      id: 'sick_visits' as ActiveTab,
      label: 'Anggota Sakit',
      subtitle: 'Pendampingan & Kunjungan',
      icon: HeartPulse,
      badge: null,
      color: 'text-red-500'
    },
    {
      id: 'fundraising' as ActiveTab,
      label: 'Penggalangan Dana',
      subtitle: 'Santunan Musibah & RS',
      icon: HeartHandshake,
      badge: 'NEW',
      color: 'text-amber-400'
    },
    {
      id: 'agendas' as ActiveTab,
      label: 'Agenda & Notulensi Kegiatan',
      subtitle: 'Rapat, Risalah Notulen & Action Plan',
      icon: CalendarDays,
      badge: null,
      color: 'text-red-500'
    },
    {
      id: 'sembako' as ActiveTab,
      label: 'Pembagian Sembako',
      subtitle: 'Scan QR & Distribusi Digital',
      icon: Gift,
      badge: null,
      color: 'text-red-500'
    },
    {
      id: 'vehicles' as ActiveTab,
      label: 'Kendaraan Operasional',
      subtitle: 'Jurnal Mitsubishi & Avanza',
      icon: Car,
      badge: null,
      color: 'text-red-500'
    },
    ...(isSuperAdmin ? [
      {
        id: 'finance' as ActiveTab,
        label: 'DIVISI DANA DAN USAHA',
        subtitle: 'Pencatatan Saldo, COS & Pengeluaran',
        icon: Wallet,
        badge: null,
        color: 'text-amber-400'
      },
      {
        id: 'super_admin' as ActiveTab,
        label: 'Menu Super Admin',
        subtitle: 'Kontrol Akses & Password SA',
        icon: KeyRound,
        badge: null,
        color: 'text-amber-400'
      },
      {
        id: 'system' as ActiveTab,
        label: 'Pengaturan & Audit System',
        subtitle: 'Kelola User, Backup & Logs',
        icon: ShieldCheck,
        badge: null,
        color: 'text-red-400'
      }
    ] : [])
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          {/* Overlay backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9998] transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-80 sm:w-84 bg-slate-900/95 text-slate-100 z-[9999] border-r border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl pt-[var(--sat)] pb-[max(1rem,var(--sab))] overflow-hidden"
          >
            {/* Top Header Drawer */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-red-950/90 via-red-900/80 to-slate-900 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.25),transparent_70%)] pointer-events-none" />
              <div className="flex items-center space-x-3 relative z-10">
                <div>
                  <h2 className="font-black text-sm tracking-wider text-white uppercase flex items-center gap-1">
                    SBN KASBI VCI
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </h2>
                  <p className="text-[10px] font-black text-amber-300 tracking-widest uppercase drop-shadow">MUDA BERANI MILITAN</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors relative z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Current User Card */}
            <div className="p-4 bg-slate-950/60 border-b border-white/10 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src={currentUser.avatarUrl || cheAvatar} 
                    alt={currentUser.name} 
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-red-500/80 shadow-lg glow-red-sm"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = cheAvatar;
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-white truncate">
                    {currentUser.name || (currentUser as any).nama || (currentUser as any).displayName || currentUser.username || 'Pengurus SBN'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600/30 text-red-300 border border-red-500/40 rounded-full uppercase tracking-wider">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate">{currentUser.department}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1.5 scrollbar-none">
              <div className="px-3 py-1 text-[10px] font-black tracking-widest text-red-400 uppercase flex items-center justify-between">
                <span>Menu Utama Organisasi</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              </div>

              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if ((item as any).isPkb && onOpenPkb) {
                        onOpenPkb();
                      } else {
                        onSelectTab(item.id);
                      }
                      onClose();
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all group cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg glow-red-sm font-bold border border-red-400/40' 
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2 rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-800/80 border border-white/10 text-red-400 group-hover:border-red-500/50 group-hover:text-red-300'
                      }`}>
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="truncate">
                        <p className={`text-xs ${isActive ? 'font-black text-white' : 'font-bold text-slate-200 group-hover:text-white'}`}>
                          {item.label}
                        </p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-red-100' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full ${
                          isActive 
                            ? 'bg-white text-red-700 shadow-sm' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-200 group-hover:translate-x-0.5'}`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer Info & Logout */}
            <div className="p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-md text-[11px] text-slate-400 space-y-3">
              {onLogout && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-2.5 px-3 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md uppercase tracking-wider glow-red-sm"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>LOGOUT / KELUAR</span>
                </motion.button>
              )}

              <div className="pt-1 border-t border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">SBN KASBI PT VCI</span>
                  <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-600/40 px-2 py-0.5 rounded-full font-mono font-bold">
                    v2.5 Futuristic
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Sistem Informasi &amp; Koordinasi Internal Pengurus Serikat Buruh PT Victory Chingluh Indonesia.
                </p>
              </div>
            </div>

            {/* CONFIRM LOGOUT MODAL IN SIDEBAR */}
            <ConfirmModal
              isOpen={showLogoutConfirm}
              title="Keluar dari Aplikasi"
              message={`Apakah Anda yakin ingin keluar dari akun ${currentUser.name}?`}
              confirmText="Ya, Logout"
              cancelText="Batal"
              type="danger"
              icon="logout"
              onConfirm={() => {
                setShowLogoutConfirm(false);
                if (onLogout) onLogout();
                onClose();
              }}
              onCancel={() => setShowLogoutConfirm(false)}
            />
          </motion.aside>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

