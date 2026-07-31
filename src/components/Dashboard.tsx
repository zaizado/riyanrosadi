import React from 'react';
import { 
  Users, 
  Scale, 
  HeartPulse, 
  CalendarDays, 
  Gift, 
  QrCode, 
  PlusCircle, 
  FileSpreadsheet, 
  ArrowRight, 
  Clock, 
  Activity,
  MapPin,
  Sparkles,
  Car,
  CheckCircle2,
  AlertCircle
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
  VehicleLog 
} from '../types';
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
  currentUser: UserAccount;
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewCase: () => void;
  onOpenNewSickVisit: () => void;
  onOpenNewAgenda: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  members,
  advocacyCases,
  sickVisits,
  agendas,
  sembakoEvents,
  sembakoClaims,
  vehicleLogs = [],
  auditLogs,
  currentUser,
  onNavigate,
  onOpenNewCase,
  onOpenNewSickVisit,
  onOpenNewAgenda,
}) => {
  // Calculations
  const activeMembersCount = members.filter(m => m.statusKeanggotaan === 'Aktif').length;
  const runningAdvocacy = advocacyCases.filter(c => c.status !== 'Selesai' && c.status !== 'Ditutup');
  const activeSickVisits = sickVisits.filter(s => s.status !== 'Selesai');
  const upcomingAgendas = agendas
    .filter(a => a.status === 'Akan Datang' || a.status === 'Berjalan')
    .sort((a, b) => new Date(a.tanggalWaktu).getTime() - new Date(b.tanggalWaktu).getTime());

  const activeSembakoEvent = sembakoEvents.find(e => e.status === 'Aktif') || sembakoEvents[0];
  
  const currentEventClaims = activeSembakoEvent 
    ? sembakoClaims.filter(c => c.eventId === activeSembakoEvent.id)
    : [];
  
  const totalEligible = currentEventClaims.length || activeSembakoEvent?.totalPenerima || 0;
  const totalClaimed = currentEventClaims.filter(c => c.status === 'Sudah Ambil').length;
  const claimPercentage = totalEligible > 0 ? Math.round((totalClaimed / totalEligible) * 100) : 0;

  // Vehicle Stats
  const activeVehicleLogs = vehicleLogs.filter(v => v.status === 'Sedang Digunakan');
  const xpanderActive = activeVehicleLogs.find(v => v.kendaraan === 'Mitsubishi Xpander');
  const avanzaActive = activeVehicleLogs.find(v => v.kendaraan === 'Toyota Avanza');

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900 via-slate-900 to-slate-950 p-5 sm:p-6 text-white border border-red-800/40 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                SBN KASBI PT VCI
              </span>
              <span className="text-xs text-slate-300">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Selamat Datang, <span className="text-red-400">{currentUser.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Sistem Pusat Koordinasi Pengurus Serikat Buruh Nasional KASBI – PT Victory Chingluh Indonesia. Hak Akses: <strong className="text-white">{currentUser.role}</strong>.
            </p>
          </div>

          {/* Top Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('sembako')}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-900/40 flex items-center gap-2 transition-all"
            >
              <QrCode className="w-4 h-4" />
              Scan QR Sembako
            </button>
            <button
              onClick={() => onNavigate('vehicles')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-2 transition-all"
            >
              <Car className="w-4 h-4 text-amber-400" />
              Kendaraan Operasional
            </button>
            <button
              onClick={() => onNavigate('members')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Users className="w-4 h-4 text-blue-400" />
              Data Anggota
            </button>
          </div>
        </div>
      </div>

      {/* 6 Metric Cards Sorted by Frequency of Use */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Metric 1: Data Anggota (Top Frequent) */}
        <div 
          onClick={() => onNavigate('members')}
          className="bg-slate-900 hover:bg-slate-850 p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md cursor-pointer transition-all hover:border-blue-500/50 group"
        >
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/40">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              Aktif
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{activeMembersCount}</p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">Data Anggota</p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Lihat Database</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 2: Sembako Distribution */}
        <div 
          onClick={() => onNavigate('sembako')}
          className="bg-slate-900 hover:bg-slate-850 p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md cursor-pointer transition-all hover:border-red-500/50 group"
        >
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="p-2 rounded-lg bg-red-950/60 border border-red-800/40">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[10px] font-semibold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded-full border border-red-800/50">
              {claimPercentage}%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{totalClaimed} / {totalEligible}</p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">Sembako Ambil</p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-red-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>QR Scanner</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3: Kendaraan Operasional */}
        <div 
          onClick={() => onNavigate('vehicles')}
          className="bg-slate-900 hover:bg-slate-850 p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md cursor-pointer transition-all hover:border-amber-500/50 group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/40">
              <Car className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-full border border-amber-800/50">
              {activeVehicleLogs.length > 0 ? `${activeVehicleLogs.length} Jalur` : 'Tersedia'}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{activeVehicleLogs.length} Unit</p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">Kendaraan Dipakai</p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Log Kendaraan</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 4: Kasus Advokasi Running */}
        <div 
          onClick={() => onNavigate('advocacy')}
          className="bg-slate-900 hover:bg-slate-850 p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md cursor-pointer transition-all hover:border-purple-500/50 group"
        >
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/40">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded-full border border-purple-800/50">
              Aktif
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{runningAdvocacy.length}</p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">Advokasi Buruh</p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Pendampingan</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 5: Pendampingan Sakit */}
        <div 
          onClick={() => onNavigate('sick_visits')}
          className="bg-slate-900 hover:bg-slate-850 p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md cursor-pointer transition-all hover:border-rose-500/50 group"
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/40">
              <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded-full border border-rose-800/50">
              Visite
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{activeSickVisits.length}</p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">Anggota Sakit</p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Pantau Visite</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 6: Agenda Terdekat */}
        <div 
          onClick={() => onNavigate('agendas')}
          className="bg-slate-900 hover:bg-slate-850 p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md cursor-pointer transition-all hover:border-emerald-500/50 group"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-800/50">
              Jadwal
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{upcomingAgendas.length}</p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">Agenda Organisasi</p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Kalender Rapat</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* Feature Section 1: Live Kendaraan Operasional Status Card */}
      <div className="bg-slate-900 rounded-2xl border border-amber-900/40 p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded uppercase tracking-wider">
                  KENDARAAN OPERASIONAL SBN KASBI VCI
                </span>
                <span className="text-xs text-slate-400">Garasi Operasional SBN KASBI</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">Status Kendaraan Operasional Organisasi</h3>
            </div>
          </div>

          <button
            onClick={() => onNavigate('vehicles')}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center justify-center gap-2 transition-all self-start lg:self-auto"
          >
            <Car className="w-4 h-4" />
            Buka Jurnal & Pinjam Kendaraan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vehicle Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Unit 1: Mitsubishi Xpander */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Mitsubishi Xpander</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                    B 1928 SBN
                  </span>
                </div>
                {xpanderActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Sedang Digunakan
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Tersedia di Pool
                  </span>
                )}
              </div>
              {xpanderActive ? (
                <div className="text-xs space-y-1 text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 mt-2">
                  <p><span className="text-slate-400">Pemakai:</span> <strong className="text-white">{xpanderActive.namaPemakai}</strong> ({xpanderActive.departemenPemakai})</p>
                  <p><span className="text-slate-400">Tujuan:</span> {xpanderActive.tujuan}</p>
                  <p><span className="text-slate-400">Estimasi Kembali:</span> {xpanderActive.tanggalSelesai} {xpanderActive.jamSelesai}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Mobil operasional siap digunakan untuk konsolidasi, advokasi, atau tugas organisasi.</p>
              )}
            </div>
          </div>

          {/* Unit 2: Toyota Avanza */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Toyota Avanza</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                    B 1405 SBN
                  </span>
                </div>
                {avanzaActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Sedang Digunakan
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Tersedia di Pool
                  </span>
                )}
              </div>
              {avanzaActive ? (
                <div className="text-xs space-y-1 text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 mt-2">
                  <p><span className="text-slate-400">Pemakai:</span> <strong className="text-white">{avanzaActive.namaPemakai}</strong> ({avanzaActive.departemenPemakai})</p>
                  <p><span className="text-slate-400">Tujuan:</span> {avanzaActive.tujuan}</p>
                  <p><span className="text-slate-400">Estimasi Kembali:</span> {avanzaActive.tanggalSelesai} {avanzaActive.jamSelesai}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Mobil operasional siap digunakan untuk keperluan anggota sakit, advokasi, atau aksi buruh.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Feature Section 2: Active Event Sembako Live Campaign Card */}
      {activeSembakoEvent && (
        <div className="bg-slate-900 rounded-2xl border border-red-900/40 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-extrabold bg-red-600 text-white rounded-md uppercase tracking-wider flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  EVENT SEMBAKO BERJALAN
                </span>
                <span className="text-xs text-slate-400">{activeSembakoEvent.tanggal} • {activeSembakoEvent.lokasi}</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">{activeSembakoEvent.namaEvent}</h3>
              <p className="text-xs text-slate-300">{activeSembakoEvent.jenisPaket}</p>
              
              {/* Progress bar */}
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Progres Distribusi Sembako</span>
                  <span className="text-red-400">{totalClaimed} dari {totalEligible} Penerima ({claimPercentage}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${claimPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch lg:items-center">
              <button
                onClick={() => onNavigate('sembako')}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4" />
                Pemindaian Scan QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Agenda & Advokasi Highlight + Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Agenda Terdekat & Kasus Advokasi Terkini */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Agendas Panel */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Agenda Organisasi Terdekat</h3>
                  <p className="text-xs text-slate-400">Jadwal konsolidasi, rapat & kegiatan SBN KASBI</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('agendas')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Lihat Semua ({agendas.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingAgendas.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Belum ada agenda terdekat.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAgendas.slice(0, 3).map((agd) => (
                  <div key={agd.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/40 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded">
                          {agd.jenis}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(agd.tanggalWaktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-100">{agd.judul}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {agd.lokasi} • PJ: <strong className="text-slate-300">{agd.penanggungJawab}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advokasi Cases Highlight */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/40">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Kasus Advokasi Aktif</h3>
                  <p className="text-xs text-slate-400">Pendampingan hak buruh dan perselisihan industrial</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('advocacy')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Kelola Advokasi ({advocacyCases.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {runningAdvocacy.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Tidak ada kasus advokasi yang sedang berjalan.</p>
            ) : (
              <div className="space-y-3">
                {runningAdvocacy.map((cas) => (
                  <div key={cas.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 hover:border-amber-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-400">{cas.nomorKasus} • {cas.kategori}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                        {cas.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">{cas.judulKasus}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Anggota: <strong className="text-slate-200">{cas.namaAnggota}</strong> ({cas.departemen})</span>
                      <span>Pendamping: <strong className="text-slate-200">{cas.pendampingUtama}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1 Col): Quick Action Shortcuts & Audit Log Feed */}
        <div className="space-y-6">
          
          {/* Quick Action Shortcuts Panel */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md">
            <h3 className="font-bold text-base text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              Aksi Cepat Pengurus
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              
              {/* Shortcut 1: Scan QR Sembako */}
              <button
                onClick={() => onNavigate('sembako')}
                className="p-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-red-400" />
                  Scan QR Sembako
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Shortcut 2: Kendaraan Operasional (NEWLY ADDED) */}
              <button
                onClick={() => onNavigate('vehicles')}
                className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  Kendaraan Operasional
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold">
                  Pinjam / Log
                  <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {/* Shortcut 3: Buat Kasus Advokasi */}
              <button
                onClick={onOpenNewCase}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" />
                  Buat Kasus Advokasi
                </span>
                <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Shortcut 4: Catat Anggota Sakit */}
              <button
                onClick={onOpenNewSickVisit}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  Catat Anggota Sakit
                </span>
                <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Shortcut 5: Tambah Agenda Baru */}
              <button
                onClick={onOpenNewAgenda}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  Tambah Agenda Baru
                </span>
                <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Shortcut 6: Data Anggota & Excel */}
              <button
                onClick={() => onNavigate('members')}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  Import / Export Member Excel
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Audit Logs / Activity Stream */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Aktivitas & Log Sistem
              </h3>
              <span className="text-[10px] text-slate-500">Real-time</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">{log.userNama} ({log.userRole})</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="font-bold text-slate-200 text-xs">{log.aksi}</p>
                  <p className="text-slate-400 text-[11px] leading-tight">{log.detail}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
