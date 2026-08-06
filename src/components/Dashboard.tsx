import React, { useState } from 'react';
import { PkbModal } from './PkbModal';
import { 
  Users, 
  Scale, 
  CalendarDays,
  Gift, 
  Car, 
  Wallet,
  Shield,
  FileText,
  Flame,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  User,
  Tag,
  Share2,
  X,
  HeartHandshake,
  ExternalLink,
  Globe
} from 'lucide-react';
import { 
  Member, 
  AdvocacyCase, 
  SickVisit, 
  OrganizationAgenda, 
  SembakoEvent, 
  SembakoClaim, 
  AuditLog, 
  UserAccount,
  VehicleLog,
  FinanceDailyRecord,
  FundraisingCampaign,
  checkIsSuperAdmin
} from '../types';
import { formatRupiah } from '../lib/storage';
import { ActiveTab } from './Sidebar';

interface DashboardProps {
  members: Member[];
  advocacyCases: AdvocacyCase[];
  sickVisits: SickVisit[];
  agendas: OrganizationAgenda[];
  sembakoEvents: SembakoEvent[];
  sembakoClaims: SembakoClaim[];
  vehicleLogs?: VehicleLog[];
  auditLogs: AuditLog[];
  financeRecords?: FinanceDailyRecord[];
  fundraisingCampaigns?: FundraisingCampaign[];
  currentUser: UserAccount;
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewCase: () => void;
  onOpenNewSickVisit: () => void;
  onOpenNewAgenda: () => void;
  onOpenScan: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  members,
  agendas,
  financeRecords = [],
  fundraisingCampaigns = [],
  currentUser,
  onNavigate,
  onOpenScan,
}) => {
  // Modal State for PKB
  const [showPkbModal, setShowPkbModal] = useState(false);

  const isSuperAdmin = checkIsSuperAdmin(currentUser);

  // Calculations
  const activeMembersCount = members.filter(m => m.statusKeanggotaan === 'Aktif').length || 524;
  const pengurusCount = members.filter(m => m.jabatanOrganisasi && m.jabatanOrganisasi !== 'Anggota').length || 28;
  const totalDanaCos = financeRecords.reduce((sum, rec) => sum + (rec.uangCosMasuk || 0), 0);
  const totalPengeluaran = financeRecords.reduce((sum, rec) => {
    return sum + rec.pengeluaranItems.reduce((acc, item) => acc + item.nominal, 0);
  }, 0);
  const saldoKas = totalDanaCos - totalPengeluaran;

  return (
    <div className="space-y-6 pb-20 select-none">
      
      {/* 1. HERO GREETING BANNER CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-800 via-red-900 to-slate-900 border border-red-700/50 p-5 sm:p-6 text-white shadow-md">
        
        {/* Background Graphic: Fist & Crowd Silhouette Overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none mix-blend-screen hidden sm:block">
          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path d="M 280 200 L 260 120 Q 255 100 270 90 L 285 100 L 290 80 Q 295 70 310 80 L 315 105 L 320 85 Q 325 75 340 85 L 340 120 L 350 200 Z" fill="#ff2222" />
            <path d="M 200 200 L 220 140 L 320 120 L 240 160 Z" fill="#990000" />
            <circle cx="300" cy="80" r="30" fill="#ff0000" opacity="0.3" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Halo, <span className="text-yellow-300 font-black drop-shadow">{currentUser?.name ? currentUser.name.split(' ')[0] : (currentUser?.username || 'Pengurus')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-red-100 mt-1">
              Selamat datang di Portal Digital SBN KASBI PT Victory Chingluh Indonesia
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-black uppercase">
            <Shield className="w-4 h-4 text-yellow-300" />
            <span>SBN KASBI VCI</span>
          </div>
        </div>
      </div>

      {/* 2. GRID NAVIGATION MENU BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        
        {/* Menu 1: Data Anggota */}
        <button
          onClick={() => onNavigate('members')}
          className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
            Data Anggota
          </span>
        </button>

        {/* Menu 2: Agenda Kegiatan */}
        <button
          onClick={() => onNavigate('agendas')}
          className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600 group-hover:scale-110 transition-transform">
            <CalendarDays className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
            Agenda Kegiatan
          </span>
        </button>

        {/* Menu 3: PKB & Peraturan */}
        <button
          onClick={() => setShowPkbModal(true)}
          className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600 group-hover:scale-110 transition-transform">
            <Scale className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
            PKB & Peraturan
          </span>
        </button>

        {/* Menu 4: Kas Organisasi */}
        {isSuperAdmin && (
          <button
            onClick={() => onNavigate('finance')}
            className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
              Kas Organisasi
            </span>
          </button>
        )}

        {/* Menu 5: Kendaraan Operasional */}
        <button
          onClick={() => onNavigate('vehicles')}
          className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600 group-hover:scale-110 transition-transform">
            <Car className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
            Kendaraan Operasional
          </span>
        </button>

        {/* Menu 6: Pembagian Sembako */}
        <button
          onClick={() => onNavigate('sembako')}
          className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600 group-hover:scale-110 transition-transform">
            <Gift className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
            Pembagian Sembako
          </span>
        </button>

        {/* Menu 7: Advokasi Industrial */}
        <button
          onClick={() => onNavigate('advocacy')}
          className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
            Advokasi Industrial
          </span>
        </button>

        {/* Menu 9: Penggalangan Dana */}
        <button
          onClick={() => onNavigate('fundraising')}
          className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
            NEW
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600 group-hover:scale-110 transition-transform">
            <HeartHandshake className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
            Penggalangan Dana
          </span>
        </button>

      </div>

      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-600 text-white rounded-xl shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>Ringkasan Keuangan Real-Time</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Data otomatis diperbarui saat kas organisasi berubah
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Total Pemasukan (COS)</p>
              <p className="text-lg font-black text-emerald-400 font-mono">{formatRupiah(totalDanaCos)}</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Total Pengeluaran</p>
              <p className="text-lg font-black text-rose-400 font-mono">{formatRupiah(totalPengeluaran)}</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Saldo Kas Organisasi</p>
              <p className="text-lg font-black text-white font-mono">{formatRupiah(saldoKas)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2.5. PENGGALANGAN DANA AKTIF BANNER (INTEGRATION TO ALL USERS) */}
      {(() => {
        const activeCampaigns = fundraisingCampaigns.filter(c => c.status === 'Sedang Berjalan');
        if (activeCampaigns.length === 0) return null;

        return (
          <div className="bg-gradient-to-r from-red-50 via-rose-50 to-white border border-red-200 rounded-2xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-red-200/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-sm">
                  <HeartHandshake className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <span>Penggalangan Dana Aktif Organisasi</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px]">
                      {activeCampaigns.length} Program
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    Mari bersama peduli & bergotong-royong membantu sesama anggota SBN KASBI VCI.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('fundraising')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeCampaigns.slice(0, 2).map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => onNavigate('fundraising')}
                  className="p-3.5 bg-white border border-red-200 hover:border-red-400 rounded-xl space-y-2 shadow-sm transition-all cursor-pointer group hover:shadow-md"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-slate-900 group-hover:text-red-700 transition-colors">
                      {campaign.namaAnggota} ({campaign.departemen})
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      campaign.kondisi === 'Meninggal' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {campaign.hubungan} {campaign.kondisi}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-red-50/60 p-2 rounded-lg text-xs">
                    <span className="text-[11px] font-bold text-slate-600">Total Dana Terkumpul:</span>
                    <span className="font-black text-red-700 font-mono text-sm">
                      {formatRupiah(campaign.jumlahTerkumpul || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>PIC: <strong className="text-slate-800">{campaign.picNama}</strong></span>
                    <span className="text-red-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Detail Program &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* MODAL: PKB & PERATURAN INTERAKTIF WITH SEARCH */}
      <PkbModal
        isOpen={showPkbModal}
        onClose={() => setShowPkbModal(false)}
        currentUser={currentUser}
      />

    </div>
  );
};
