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
  Wallet
} from 'lucide-react';
import { UserAccount, checkIsSuperAdmin } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { FsbnLogo } from './FsbnLogo';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';

export type ActiveTab = 
  | 'dashboard'
  | 'members'
  | 'advocacy'
  | 'sick_visits'
  | 'agendas'
  | 'sembako'
  | 'vehicles'
  | 'finance'
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
      id: 'members' as ActiveTab,
      label: 'Data Anggota',
      subtitle: 'Pusat Database & Kartu Digital',
      icon: Users,
      badge: 'Utama',
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
      id: 'agendas' as ActiveTab,
      label: 'Agenda Organisasi',
      subtitle: 'Kalender Rapat & Konsolidasi',
      icon: CalendarDays,
      badge: null,
      color: 'text-red-500'
    },
    {
      id: 'sembako' as ActiveTab,
      label: 'Pembagian Sembako',
      subtitle: 'Scan QR & Distribusi Digital',
      icon: Gift,
      badge: 'QR Scanner',
      color: 'text-red-500'
    },
    {
      id: 'vehicles' as ActiveTab,
      label: 'Kendaraan Operasional',
      subtitle: 'Jurnal Mitsubishi & Avanza',
      icon: Car,
      badge: 'Operasional',
      color: 'text-red-500'
    },
    ...(isSuperAdmin ? [
      {
        id: 'finance' as ActiveTab,
        label: 'Divisi Dana & Keuangan',
        subtitle: 'Pencatatan Saldo, COS & Pengeluaran',
        icon: Wallet,
        badge: 'Keuangan SA',
        color: 'text-amber-400'
      },
      {
        id: 'super_admin' as ActiveTab,
        label: 'Menu Super Admin',
        subtitle: 'Kontrol Akses & Password SA',
        icon: KeyRound,
        badge: 'Proteksi SA',
        color: 'text-amber-400'
      },
      {
        id: 'system' as ActiveTab,
        label: 'Pengaturan & Audit System',
        subtitle: 'Kelola User, Backup & Logs',
        icon: ShieldCheck,
        badge: 'Super Admin',
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
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-800 flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Drawer */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <FsbnLogo className="w-10 h-10 rounded-xl shadow-md border border-red-500/30 shrink-0" />
            <div>
              <h2 className="font-bold text-sm tracking-wide text-slate-100">SBN KASBI VCI</h2>
              <p className="text-[11px] text-slate-400">Sistem Koordinasi Digital</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Card */}
        <div className="p-4 bg-slate-800/60 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <img 
              src={currentUser.avatarUrl || cheAvatar} 
              alt={currentUser.name} 
              className="w-11 h-11 rounded-full object-cover ring-2 ring-red-500/60"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-100 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-600/30 text-red-400 border border-red-500/30 rounded-full">
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-slate-400 truncate">{currentUser.department}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Menu Utama Aplikasi
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
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-900/30 font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-800'} ${item.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className={`text-xs ${isActive ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-red-100' : 'text-slate-400'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                      isActive 
                        ? 'bg-white text-red-700' 
                        : 'bg-slate-800 text-red-400 border border-red-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-white' : 'text-slate-600 group-hover:translate-x-0.5'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-2.5">
          {onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-2.5 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>LOGOUT / KELUAR</span>
            </button>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300">SBN KASBI PT VCI</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">v2.4 Android</span>
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
