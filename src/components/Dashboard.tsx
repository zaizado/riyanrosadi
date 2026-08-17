import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
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
  HeartPulse,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Plus,
  HeartHandshake,
  Calculator,
  MapPin,
  Check,
  ShieldCheck,
  UserCheck
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
  checkIsSuperAdmin,
  canApproveRequests
} from '../types';
import { formatRupiah } from '../lib/storage';
import { ActiveTab } from './Sidebar';
import { calculateFinanceSummary } from '../utils/financeUtils';
import { formatLocalDate, getLocalDateISO } from '../utils/dateUtils';
import { DEFAULT_FLEET } from '../utils/vehicleUtils';

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
  onOpenNewCase?: () => void;
  onOpenNewSickVisit?: () => void;
  onOpenNewAgenda?: () => void;
  onOpenScan?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  members = [],
  agendas = [],
  advocacyCases = [],
  sickVisits = [],
  sembakoEvents = [],
  sembakoClaims = [],
  vehicleLogs = [],
  auditLogs = [],
  financeRecords = [],
  fundraisingCampaigns = [],
  currentUser,
  onNavigate,
  onOpenNewSickVisit,
}) => {
  const [showPkbModal, setShowPkbModal] = useState(false);

  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const hasApprovalAuthority = canApproveRequests(currentUser);

  // Today Date formatted in Indonesian
  const todayFormatted = useMemo(() => {
    return formatLocalDate(new Date(), { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }, []);

  // Real Counts with on-demand Firestore count fallback
  const [memberCounts, setMemberCounts] = useState<{ active: number; pengurus: number }>({
    active: members.filter(m => m.statusKeanggotaan === 'Aktif').length,
    pengurus: members.filter(m => m.jabatanOrganisasi && m.jabatanOrganisasi !== 'Anggota').length
  });

  useEffect(() => {
    let isMounted = true;
    const fetchRealCounts = async () => {
      if (members.length > 0) {
        setMemberCounts({
          active: members.filter(m => m.statusKeanggotaan === 'Aktif').length,
          pengurus: members.filter(m => m.jabatanOrganisasi && m.jabatanOrganisasi !== 'Anggota').length
        });
        return;
      }
      try {
        const { getCountFromServer, query, collection, where } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const [activeSnap, pengurusSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'members'), where('statusKeanggotaan', '==', 'Aktif'))),
          getCountFromServer(query(collection(db, 'members'), where('jabatanOrganisasi', '!=', 'Anggota')))
        ]);
        if (isMounted) {
          setMemberCounts({
            active: activeSnap.data().count,
            pengurus: pengurusSnap.data().count
          });
        }
      } catch (err) {
        // Quota exceeded or offline - maintain existing/safe count
      }
    };
    fetchRealCounts();
    return () => { isMounted = false; };
  }, [members]);

  const activeMembersCount = memberCounts.active;
  const pengurusCount = memberCounts.pengurus;

  // SICK VISITS METRICS
  const sickWaitingCount = sickVisits.filter(
    v => v.status === 'Dilaporkan' || v.status === 'Menunggu Koordinasi' || v.status === 'Menunggu Kunjungan'
  ).length;
  const sickActiveCount = sickVisits.filter(
    v => v.status === 'Disetujui' || v.status === 'Ditugaskan' || v.status === 'Dalam Pendampingan' || v.status === 'Sedang Didampingi'
  ).length;
  const sickFinishedCount = sickVisits.filter(v => v.status === 'Selesai').length;
  const sickUrgentCount = sickVisits.filter(v => v.isUrgent && v.status !== 'Selesai').length;

  // VEHICLE METRICS
  const vehiclePendingCount = vehicleLogs.filter(v => v.status === 'Menunggu Persetujuan').length;
  const vehicleInUseCount = vehicleLogs.filter(v => v.status === 'Sedang Digunakan').length;
  const vehicleApprovedCount = vehicleLogs.filter(v => v.status === 'Disetujui' || v.status === 'Siap Digunakan').length;
  const totalFleetCount = DEFAULT_FLEET.length;
  const vehicleAvailableCount = Math.max(0, totalFleetCount - vehicleInUseCount);

  // ACTION ITEMS ("PERLU TINDAKAN")
  const pendingVehicleApprovals = useMemo(() => {
    if (!hasApprovalAuthority) return [];
    // Superadmin/Ketua cannot approve their own requests
    return vehicleLogs.filter(v => v.status === 'Menunggu Persetujuan' && v.namaPemakai !== currentUser.name);
  }, [vehicleLogs, hasApprovalAuthority, currentUser.name]);

  const pendingUrgentSickVisits = useMemo(() => {
    return sickVisits.filter(v => 
      (v.status === 'Dilaporkan' || v.status === 'Menunggu Koordinasi' || v.isUrgent) && 
      v.status !== 'Selesai' && 
      v.status !== 'Ditolak'
    );
  }, [sickVisits]);

  const userActiveVehicleTrips = useMemo(() => {
    return vehicleLogs.filter(v => 
      v.status === 'Sedang Digunakan' && 
      (v.namaPemakai === currentUser.name || v.driverNama === currentUser.name)
    );
  }, [vehicleLogs, currentUser.name]);

  const userAssignedVisits = useMemo(() => {
    return sickVisits.filter(v => 
      (v.petugas1 === currentUser.name || v.petugas2 === currentUser.name || v.pengurusPenanggungJawab === currentUser.name) &&
      (v.status === 'Ditugaskan' || v.status === 'Dalam Pendampingan' || v.status === 'Sedang Didampingi')
    );
  }, [sickVisits, currentUser.name]);

  const hasActionItems = 
    pendingVehicleApprovals.length > 0 || 
    pendingUrgentSickVisits.length > 0 || 
    userActiveVehicleTrips.length > 0 || 
    userAssignedVisits.length > 0;

  // UPCOMING SCHEDULES
  const upcomingSchedules = useMemo(() => {
    const today = getLocalDateISO();
    const list: Array<{
      id: string;
      type: 'vehicle' | 'agenda' | 'sick';
      title: string;
      subtitle: string;
      date: string;
      badge: string;
      badgeColor: string;
    }> = [];

    // Approved vehicle schedules
    vehicleLogs
      .filter(v => (v.status === 'Disetujui' || v.status === 'Siap Digunakan') && (v.tanggalMulai || '') >= today)
      .slice(0, 3)
      .forEach(v => {
        list.push({
          id: `veh-${v.id}`,
          type: 'vehicle',
          title: `Peminjaman Mobil: ${v.kegiatan || 'Operasional'}`,
          subtitle: `${v.mobilNama || 'Mobil Operasional'} (${v.platNomor || '-'}) • Pemakai: ${v.namaPemakai}`,
          date: v.tanggalMulai || today,
          badge: 'Kendaraan Disetujui',
          badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-700/50'
        });
      });

    // Agendas
    agendas
      .filter(a => (a.tanggal || '') >= today && a.status !== 'Selesai')
      .slice(0, 3)
      .forEach(a => {
        list.push({
          id: `age-${a.id}`,
          type: 'agenda',
          title: a.judul,
          subtitle: `${a.lokasi || 'Mabes'} • Waktu: ${a.waktu || 'Fleksibel'}`,
          date: a.tanggal,
          badge: a.kategori || 'Agenda',
          badgeColor: 'bg-amber-950 text-amber-300 border-amber-700/50'
        });
      });

    return list.slice(0, 4);
  }, [vehicleLogs, agendas]);

  // RECENT SICK VISITS (Latest 3)
  const recentSickVisits = useMemo(() => {
    return [...sickVisits]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3);
  }, [sickVisits]);

  // RECENT AUDIT LOGS (Latest 4)
  const recentLogs = useMemo(() => {
    return auditLogs.slice(0, 4);
  }, [auditLogs]);

  // FINANCE SUMMARY
  const financeSummary = calculateFinanceSummary(financeRecords);
  const totalDanaCos = financeSummary.totalPemasukanCos;
  const totalPengeluaran = financeSummary.totalPengeluaran;
  const saldoKas = financeSummary.saldoAkhir;

  // ACTIVITY CHART DATA
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const activityData = monthsList.slice(0, currentMonthIdx + 1).map((mName, mIdx) => {
    const monthStr = String(mIdx + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${monthStr}`;

    const anggotaInMonth = members.filter(m => (m.tanggalBergabung || '').startsWith(monthPrefix)).length;
    const kasusInMonth = advocacyCases.filter(c => (c.tanggalLapor || '').startsWith(monthPrefix)).length;
    const agendaInMonth = agendas.filter(a => (a.tanggal || '').startsWith(monthPrefix)).length;

    return {
      month: mName,
      anggota: anggotaInMonth,
      kasus: kasusInMonth,
      agenda: agendaInMonth
    };
  });

  // ALL ORGANIZATION MODULES
  const organizationModules = [
    { id: 'members' as ActiveTab, label: 'Data Anggota', subtitle: 'Pusat Database KTA & Registrasi', icon: Users, color: 'from-red-600 to-rose-700' },
    { id: 'sick_visits' as ActiveTab, label: 'Pendampingan Sakit', subtitle: 'SOP Rawat Inap & Rujukan RS', icon: HeartPulse, color: 'from-rose-600 to-red-800' },
    { id: 'vehicles' as ActiveTab, label: 'Kendaraan Operasional', subtitle: 'Peminjaman & Kesiapan Armada', icon: Car, color: 'from-amber-600 to-amber-800' },
    { id: 'advocacy' as ActiveTab, label: 'Advokasi Industrial', subtitle: 'Pendampingan Hukum & Kasus', icon: FileText, color: 'from-blue-600 to-indigo-700' },
    { id: 'agendas' as ActiveTab, label: 'Agenda Kegiatan', subtitle: 'Jadwal Rapat, Aksi & Notulensi', icon: CalendarDays, color: 'from-orange-600 to-amber-700' },
    { id: 'pkb' as any, label: 'PKB & Peraturan', subtitle: 'Buku Pedoman Kerja Bersama', icon: Scale, color: 'from-slate-700 to-slate-800', isPkb: true },
    { id: 'sembako' as ActiveTab, label: 'Pembagian Sembako', subtitle: 'Scan QR Kupon Digital', icon: Gift, color: 'from-purple-600 to-indigo-800' },
    { id: 'structure' as ActiveTab, label: 'Struktur Pengurus', subtitle: 'Bagan Kepengurusan & Korlap', icon: Shield, color: 'from-emerald-600 to-teal-800' },
    { id: 'severance' as ActiveTab, label: 'Simulasi Pesangon', subtitle: 'Kalkulator UU & PP 35', icon: Calculator, color: 'from-cyan-600 to-blue-700' },
    { id: 'fundraising' as ActiveTab, label: 'Penggalangan Dana', subtitle: 'Solidaritas & Santunan Duka', icon: HeartHandshake, color: 'from-pink-600 to-rose-700' },
    ...(isSuperAdmin ? [{ id: 'finance' as ActiveTab, label: 'Kas Organisasi', subtitle: 'Laporan COS & Arus Kas', icon: Wallet, color: 'from-emerald-700 to-green-900', badge: 'ADMIN' }] : []),
  ];

  return (
    <div className="space-y-6 pb-24 text-white">
      
      {/* 1. HEADER UTAMA: GREETING & DATE (Clean, High Contrast, Non-cluttered) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-red-950 text-red-300 border border-red-800/60 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>PORTAL KOMANDO SBN KASBI</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {todayFormatted}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Selamat Datang,{' '}
              <span className="text-amber-300">
                {currentUser?.name || currentUser?.username || 'Pengurus'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400">
              Peran: <strong className="text-slate-200">{currentUser?.role || 'Pengurus'}</strong> ({currentUser?.jabatanOrganisasi || 'Pengurus SBN KASBI PT VCI'})
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => onNavigate('sick_visits')}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Pendampingan</span>
            </button>

            <button
              onClick={() => onNavigate('vehicles')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>Armada Kendaraan</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. PRIORITAS 1: PERLU TINDAKAN (ACTION REQUIRED CARDS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Perlu Tindakan &amp; Status Mendasar</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-400">Prioritas Tugas</span>
        </div>

        {hasActionItems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Urgent / Pending Sick Visits */}
            {pendingUrgentSickVisits.length > 0 && (
              <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-red-600 text-white">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-200 text-xs sm:text-sm">
                        {pendingUrgentSickVisits.length} Pendampingan Membutuhkan Koordinasi
                      </h3>
                      <p className="text-[11px] text-red-300/80">
                        Laporan anggota sakit perlu verifikasi &amp; penugasan petugas
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                    MENDESAK
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {pendingUrgentSickVisits.slice(0, 2).map((sv) => (
                    <div 
                      key={sv.id}
                      onClick={() => onNavigate('sick_visits')}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-red-900/40 flex items-center justify-between text-xs hover:border-red-500 cursor-pointer transition-all"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-white block truncate">{sv.namaPasien || sv.namaAnggota}</span>
                        <span className="text-[10px] text-slate-400 truncate block">Tujuan: {sv.rumahSakitTujuan || 'RS Rujukan'}</span>
                      </div>
                      <span className="text-red-400 font-bold text-[11px] shrink-0 flex items-center gap-1">
                        Buka &rarr;
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => onNavigate('sick_visits')}
                    className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Koordinasikan Pendampingan Sakit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Pending Vehicle Approvals (For Superadmin/Ketua/Sekretaris) */}
            {hasApprovalAuthority && pendingVehicleApprovals.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-600 text-white">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-200 text-xs sm:text-sm">
                        {pendingVehicleApprovals.length} Permohonan Kendaraan Menunggu Persetujuan
                      </h3>
                      <p className="text-[11px] text-amber-300/80">
                        Otoritas Ketua / Sekretaris / Superadmin
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white">
                    PERSETUJUAN
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {pendingVehicleApprovals.slice(0, 2).map((vl) => (
                    <div 
                      key={vl.id}
                      onClick={() => onNavigate('vehicles')}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-900/40 flex items-center justify-between text-xs hover:border-amber-500 cursor-pointer transition-all"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-white block truncate">{vl.kegiatan || 'Operasional'}</span>
                        <span className="text-[10px] text-slate-400 truncate block">Pemohon: {vl.namaPemakai} ({vl.tujuan || 'Lokasi'})</span>
                      </div>
                      <span className="text-amber-400 font-bold text-[11px] shrink-0 flex items-center gap-1">
                        Tinjau &rarr;
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => onNavigate('vehicles')}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Tinjau &amp; Setujui Kendaraan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Active Trips / In Use */}
            {userActiveVehicleTrips.length > 0 && (
              <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-200 text-xs sm:text-sm">
                        Anda Sedang Menggunakan Kendaraan Operasional
                      </h3>
                      <p className="text-[11px] text-indigo-300/80">
                        Pastikan melakukan pengembalian &amp; checklist setelah selesai
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                    AKTIF
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => onNavigate('vehicles')}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Buka Form Pengembalian Mobil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3.5 text-xs text-slate-300">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/50 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Semua Tugas &amp; Pengajuan Terkoordinasi</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Tidak ada permohonan kendaraan mendesak atau laporan pendampingan yang tertunda saat ini.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. DUA PILAR UTAMA: PENDAMPINGAN ANGGOTA SAKIT & KENDARAAN OPERASIONAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD A: PENDAMPINGAN ANGGOTA SAKIT */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header Modul */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-600 text-white shadow-md shadow-red-950/50">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Pendampingan Anggota Sakit</h3>
                  <p className="text-xs text-slate-400">SOP Pelaporan, RS Rujukan &amp; Akomodasi</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                SOP 2026
              </span>
            </div>

            {/* Metric Status Counts */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">Menunggu</span>
                <span className="text-xl font-black text-white font-mono">{sickWaitingCount}</span>
                <span className="text-[9px] text-slate-500 block">Koordinasi</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-blue-400 block uppercase">Didampingi</span>
                <span className="text-xl font-black text-white font-mono">{sickActiveCount}</span>
                <span className="text-[9px] text-slate-500 block">Sedang Proses</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 block uppercase">Selesai</span>
                <span className="text-xl font-black text-white font-mono">{sickFinishedCount}</span>
                <span className="text-[9px] text-slate-500 block">Riwayat SOP</span>
              </div>
            </div>

            {/* List 2-3 Pendampingan Terbaru */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-0.5">
                <span>Laporan Pendampingan Terbaru</span>
                <span className="text-[10px]">{sickVisits.length} Total Kasus</span>
              </div>

              {recentSickVisits.length > 0 ? (
                <div className="space-y-2">
                  {recentSickVisits.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => onNavigate('sick_visits')}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-red-500/60 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate">
                            {v.namaPasien || v.namaAnggota}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({v.hubunganPasien || 'Anggota'})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {v.rumahSakitTujuan || 'RS Rujukan'} {v.departemen ? `• ${v.departemen}` : ''}
                        </p>
                      </div>

                      <span className={`shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                        v.status === 'Selesai'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : v.status === 'Sedang Didampingi' || v.status === 'Dalam Pendampingan'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-center text-xs text-slate-500">
                  Belum ada laporan pendampingan anggota sakit.
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons for Pendampingan */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                if (onOpenNewSickVisit) {
                  onOpenNewSickVisit();
                } else {
                  onNavigate('sick_visits');
                }
              }}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Lapor Pendampingan</span>
            </button>

            <button
              onClick={() => onNavigate('sick_visits')}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
            >
              <span>Lihat Semua Kasus</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* CARD B: KENDARAAN OPERASIONAL */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header Modul */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-600 text-slate-950 shadow-md shadow-amber-950/50">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Kendaraan Operasional</h3>
                  <p className="text-xs text-slate-400">Peminjaman Armada &amp; Pengawalan Sakit</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                2 Unit Mobil
              </span>
            </div>

            {/* Metric Status Counts */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 block uppercase">Tersedia</span>
                <span className="text-xl font-black text-white font-mono">{vehicleAvailableCount} Unit</span>
                <span className="text-[9px] text-slate-500 block">Siap Jalan</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-indigo-400 block uppercase">Dipakai</span>
                <span className="text-xl font-black text-white font-mono">{vehicleInUseCount} Unit</span>
                <span className="text-[9px] text-slate-500 block">Dalam Tugas</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">Pengajuan</span>
                <span className="text-xl font-black text-white font-mono">{vehiclePendingCount}</span>
                <span className="text-[9px] text-slate-500 block">Menunggu</span>
              </div>
            </div>

            {/* Status Kesiapan Armada SBN KASBI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-0.5">
                <span>Kesiapan Armada Organisasi</span>
                <span className="text-[10px] text-amber-400">PTP SBN KASBI</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_FLEET.map((armada) => {
                  const isInUse = vehicleLogs.some(
                    v => v.status === 'Sedang Digunakan' && (v.mobilNama === armada.name || v.platNomor === armada.platNomor || v.kendaraan === armada.name)
                  );
                  return (
                    <div 
                      key={armada.name}
                      onClick={() => onNavigate('vehicles')}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="truncate pr-1">
                        <span className="font-bold text-white text-xs block truncate">{armada.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{armada.platNomor} • {armada.defaultLokasi}</span>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                        isInUse 
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-800' 
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        {isInUse ? 'Dipakai' : 'Tersedia'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Action Buttons for Kendaraan */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => onNavigate('vehicles')}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajukan Kendaraan</span>
            </button>

            <button
              onClick={() => onNavigate('vehicles')}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
            >
              <span>Jadwal &amp; Penggunaan</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. JADWAL TERDEKAT & AKTIVITAS TERBARU (SIDE BY SIDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Jadwal Terdekat */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Jadwal &amp; Agenda Terdekat</h3>
                <p className="text-[11px] text-slate-400">Peminjaman mobil, agenda rapat &amp; aksi</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('agendas')}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              Lihat Agenda &rarr;
            </button>
          </div>

          {upcomingSchedules.length > 0 ? (
            <div className="space-y-2">
              {upcomingSchedules.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => onNavigate(sc.type === 'vehicle' ? 'vehicles' : 'agendas')}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs truncate">{sc.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{sc.subtitle}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{sc.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-center text-xs text-slate-500">
              Tidak ada jadwal atau peminjaman kendaraan yang akan datang.
            </div>
          )}
        </div>

        {/* Aktivitas Terbaru (Audit Trail) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Aktivitas &amp; Jejak Terakhir</h3>
                <p className="text-[11px] text-slate-400">Pembaruan data otomatis organisasi</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500">LOG HISTORI</span>
          </div>

          {recentLogs.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 mt-0.5 shrink-0">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-medium text-slate-200 truncate">
                      <strong className="text-white">{log.actorName || 'Pengurus'}:</strong> {log.action || log.details || 'Memperbarui data'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {formatLocalDate(log.timestamp || new Date(), { hour: '2-digit', minute: '2-digit' })} • {log.targetName || 'Sistem'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-center text-xs text-slate-500">
              Belum ada riwayat aktivitas terbaru.
            </div>
          )}
        </div>

      </div>

      {/* 5. PUSAT LAYANAN & MODUL LENGKAP ORGANISASI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-400" />
            <span>Pusat Layanan &amp; Modul Organisasi Lengkap</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-400">Akses Cepat 1-Klik</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {organizationModules.map((item) => {
            const IconComp = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => item.isPkb ? setShowPkbModal(true) : onNavigate(item.id)}
                className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800 hover:border-red-500/50 flex flex-col items-start justify-between text-left transition-all cursor-pointer group relative overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {item.badge && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${item.color} text-white shadow-md mb-3 group-hover:scale-105 transition-transform`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white group-hover:text-red-400 transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. SUPER ADMIN KAS & KEUANGAN SUMMARY (If Superadmin) */}
      {isSuperAdmin && (
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-amber-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Ringkasan Kas Organisasi</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-extrabold border border-amber-500/30">
                    SUPER ADMIN
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Data kas langsung terintegrasi dengan laporan keuangan
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('finance')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1"
            >
              <span>Kelola Kas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Total Pemasukan (COS)</p>
              <p className="text-lg font-black text-emerald-400 font-mono">{formatRupiah(totalDanaCos)}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Total Pengeluaran</p>
              <p className="text-lg font-black text-rose-400 font-mono">{formatRupiah(totalPengeluaran)}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Saldo Kas SBN KASBI</p>
              <p className="text-lg font-black text-white font-mono">{formatRupiah(saldoKas)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 7. PENGGALANGAN DANA AKTIF BANNER (If any active) */}
      {(() => {
        const activeCampaigns = fundraisingCampaigns.filter(c => c.status === 'Sedang Berjalan');
        if (activeCampaigns.length === 0) return null;

        return (
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-red-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-red-600/30 text-red-400 rounded-2xl border border-red-500/40">
                  <HeartHandshake className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Penggalangan Dana Solidaritas</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px]">
                      {activeCampaigns.length} Program
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Bantuan gotong-royong musibah &amp; duka anggota SBN KASBI VCI.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('fundraising')}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-md"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeCampaigns.slice(0, 2).map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => onNavigate('fundraising')}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-red-500/50 rounded-2xl space-y-2.5 shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-white group-hover:text-red-400 transition-colors">
                      {campaign.namaAnggota} ({campaign.departemen})
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      campaign.kondisi === 'Meninggal' 
                        ? 'bg-rose-950 text-rose-300 border border-rose-600/40' 
                        : 'bg-amber-950 text-amber-300 border border-amber-600/40'
                    }`}>
                      {campaign.hubungan} {campaign.kondisi}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-red-950/40 border border-red-500/20 p-2.5 rounded-xl text-xs">
                    <span className="text-[11px] font-bold text-slate-300">Total Donasi Terkumpul:</span>
                    <span className="font-black text-red-400 font-mono text-sm">
                      {formatRupiah(campaign.jumlahTerkumpul || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>PIC: <strong className="text-slate-200">{campaign.picNama}</strong></span>
                    <span className="text-red-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Detail Program &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 8. CHART PERTUMBUHAN & AKTIVITAS */}
      <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Grafik Aktivitas Organisasi 2026</span>
            </h2>
            <p className="text-[11px] text-slate-400">Pertumbuhan anggota baru &amp; agenda organisasi</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Anggota Baru
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Agenda
            </span>
          </div>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAnggota" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAgenda" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="anggota" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAnggota)" />
              <Area type="monotone" dataKey="agenda" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorAgenda)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODAL: PKB & PERATURAN INTERAKTIF */}
      <PkbModal
        isOpen={showPkbModal}
        onClose={() => setShowPkbModal(false)}
        currentUser={currentUser}
      />

    </div>
  );
};
