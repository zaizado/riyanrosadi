import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Scale, 
  HeartPulse, 
  CalendarDays, 
  Gift, 
  ShieldCheck, 
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
  HeartHandshake
} from 'lucide-react';
import { UserAccount, checkIsSuperAdmin } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { FsbnLogo } from './FsbnLogo';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';

export type ActiveTab = 
  | 'dashboard'
  | 'members'
  | 'structure'
  | 'advocacy'
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
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
      label: 'Pusat Informasi Agenda',
      subtitle: 'Kegiatan, Sembako & Operasional',
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
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 bg-white text-slate-800 z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-200 flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Drawer */}
        <div className="p-4 border-b border-red-800 flex items-center justify-between bg-gradient-to-r from-red-700 to-red-800 text-white">
          <div className="flex items-center space-x-3">
            <FsbnLogo className="w-10 h-10 rounded-xl shadow-md border border-white/30 shrink-0" />
            <div>
              <h2 className="font-black text-sm tracking-wide text-white uppercase">SBN KASBI VCI</h2>
              <p className="text-[11px] font-black text-yellow-300 tracking-wider uppercase drop-shadow">MUDA BERANI MILITAN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <img 
              src={currentUser.avatarUrl || cheAvatar} 
              alt={currentUser.name} 
              className="w-11 h-11 rounded-full object-cover ring-2 ring-red-600 shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = cheAvatar;
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-slate-900 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 rounded-full uppercase">
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate">{currentUser.department}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <div className="px-3 py-1 text-[10px] font-black tracking-widest text-red-600 uppercase">
            Menu Utama Organisasi
          </div>

          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all group ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md font-bold' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-red-50 border border-red-100'} ${isActive ? 'text-white' : 'text-red-600'}`}>
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-red-600'}`} />
                  </div>
                  <div className="truncate">
                    <p className={`text-xs ${isActive ? 'font-black text-white' : 'font-bold text-slate-800'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-red-100' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                      isActive 
                        ? 'bg-white text-red-700' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:translate-x-0.5'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-2.5">
          {onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm uppercase tracking-wider"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>LOGOUT / KELUAR</span>
            </button>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-800">SBN KASBI PT VCI</span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">v2.4 Android</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Sistem Informasi & Koordinasi Internal Pengurus Serikat Buruh PT Victory Chingluh Indonesia.
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
      </aside>
    </>
  );
};
