import React, { useState } from 'react';
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
  Globe,
  Sparkles,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight
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
  onOpenNewCase?: () => void;
  onOpenNewSickVisit?: () => void;
  onOpenNewAgenda?: () => void;
  onOpenScan?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  members,
  agendas = [],
  advocacyCases = [],
  sickVisits = [],
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
  const pengurusCount = members.filter(m => m.jabatanOrganisasi && m.jabatanOrganisasi !== 'Anggota').length || 36;
  const totalDanaCos = financeRecords.reduce((sum, rec) => sum + (rec.uangCosMasuk || 0), 0);
  const totalPengeluaran = financeRecords.reduce((sum, rec) => {
    return sum + rec.pengeluaranItems.reduce((acc, item) => acc + item.nominal, 0);
  }, 0);
  const saldoKas = totalDanaCos - totalPengeluaran;

  // Chart Mock Activity Data for Futuristic Visualizer
  const activityData = [
    { month: 'Jan', anggota: 480, kasus: 3, agenda: 5 },
    { month: 'Feb', anggota: 492, kasus: 2, agenda: 7 },
    { month: 'Mar', anggota: 505, kasus: 4, agenda: 6 },
    { month: 'Apr', anggota: 512, kasus: 1, agenda: 8 },
    { month: 'Mei', anggota: 518, kasus: 3, agenda: 9 },
    { month: 'Jun', anggota: activeMembersCount, kasus: advocacyCases.length || 2, agenda: agendas.length || 6 },
  ];

  const quickNavItems = [
    { id: 'members' as ActiveTab, label: 'Data Anggota', subtitle: 'Pusat Database KTA', icon: Users, color: 'from-red-600 to-red-800' },
    { id: 'agendas' as ActiveTab, label: 'Agenda Kegiatan', subtitle: 'Jadwal & Notulensi', icon: CalendarDays, color: 'from-amber-600 to-amber-800' },
    { id: 'pkb' as any, label: 'PKB & Peraturan', subtitle: 'Buku Pedoman Kerja', icon: Scale, color: 'from-rose-600 to-rose-800', isPkb: true },
    ...(isSuperAdmin ? [{ id: 'finance' as ActiveTab, label: 'Kas Organisasi', subtitle: 'Laporan COS & Dana', icon: Wallet, color: 'from-emerald-600 to-emerald-800' }] : []),
    { id: 'vehicles' as ActiveTab, label: 'Kendaraan Operasional', subtitle: 'Log Mobil Avanza & Truck', icon: Car, color: 'from-cyan-600 to-cyan-800' },
    { id: 'sembako' as ActiveTab, label: 'Pembagian Sembako', subtitle: 'Scan QR Kupon Digital', icon: Gift, color: 'from-purple-600 to-purple-800' },
    { id: 'advocacy' as ActiveTab, label: 'Advokasi Industrial', subtitle: 'Pendampingan Hukum', icon: FileText, color: 'from-blue-600 to-blue-800' },
    { id: 'fundraising' as ActiveTab, label: 'Penggalangan Dana', subtitle: 'Santunan duka & musibah', icon: HeartHandshake, color: 'from-red-500 to-rose-700', badge: 'NEW' },
  ];

  return (
    <div className="space-y-6 pb-24 select-none">
      
      {/* 1. HERO GREETING BANNER CARD */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-slate-950 to-slate-900 border border-red-500/30 p-6 sm:p-8 text-white shadow-[0_15px_40px_rgba(220,38,38,0.2)] backdrop-blur-xl"
      >
        {/* Glow & Mesh Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider mb-2 glow-red-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Portal Komando SBN KASBI VCI</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-red-400 font-black drop-shadow">{currentUser?.name ? currentUser.name.split(' ')[0] : (currentUser?.username || 'Pengurus')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Selamat datang di sistem manajemen terpadu Serikat Buruh PT Victory Chingluh Indonesia. Pantau koordinasi, advokasi, dan keanggotaan dalam satu layar.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('structure')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 shadow-lg backdrop-blur-md cursor-pointer transition-all"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Pengurus ({pengurusCount})</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('members')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-400/40 text-white font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all glow-red-sm"
            >
              <Users className="w-4 h-4" />
              <span>Anggota ({activeMembersCount})</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 2. METRIC STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Anggota Aktif */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigate('members')}
          className="glass-card-dark p-5 rounded-3xl space-y-2 border border-white/10 hover:border-red-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anggota Aktif</span>
            <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{activeMembersCount}</span>
            <span className="text-xs font-semibold text-emerald-400 ml-2">Verified</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Database KTA Digital</span>
            <ChevronRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Stat 2: Advokasi & Kasus */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => onNavigate('advocacy')}
          className="glass-card-dark p-5 rounded-3xl space-y-2 border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Advokasi Industrial</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{advocacyCases.length}</span>
            <span className="text-xs font-semibold text-blue-400 ml-2">Kasus Diproses</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Pendampingan Hukum</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Stat 3: Agenda Kegiatan */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigate('agendas')}
          className="glass-card-dark p-5 rounded-3xl space-y-2 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agenda Kegiatan</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{agendas.length}</span>
            <span className="text-xs font-semibold text-amber-400 ml-2">Tercatat</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Jadwal & Notulensi</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Stat 4: Kunjungan Anggota Sakit */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => onNavigate('sick_visits')}
          className="glass-card-dark p-5 rounded-3xl space-y-2 border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anggota Sakit</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{sickVisits.length}</span>
            <span className="text-xs font-semibold text-emerald-400 ml-2">Kunjungan</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Pendampingan Sosial</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

      </div>

      {/* 3. QUICK ACTION MENU GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-400" />
            <span>Pusat Layanan &amp; Modul Organisasi</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-400">Pilih modul navigasi</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {quickNavItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => item.isPkb ? setShowPkbModal(true) : onNavigate(item.id)}
                className="glass-card-dark p-4 rounded-3xl border border-white/10 hover:border-red-500/50 flex flex-col items-start justify-between text-left transition-all cursor-pointer group relative overflow-hidden shadow-lg"
              >
                {item.badge && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse">
                    {item.badge}
                  </span>
                )}
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${item.color} text-white shadow-md mb-3 group-hover:scale-110 transition-transform`}>
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
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4. VISUAL CHART ANALYTICS OVERVIEW */}
      <div className="glass-card-dark p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Aktivitas &amp; Pertumbuhan Keanggotaan</span>
            </h2>
            <p className="text-[11px] text-slate-400">Grafik perkembangan partisipasi anggota &amp; kasus terdaftar 2026</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Anggota
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Agenda
            </span>
          </div>
        </div>

        <div className="h-48 w-full pt-2">
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

      {/* 5. SUPER ADMIN REALTIME FINANCE SUMMARY */}
      {isSuperAdmin && (
        <div className="glass-card-dark p-6 rounded-3xl border border-amber-500/30 space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Ringkasan Keuangan Kas Organisasi</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-extrabold border border-amber-500/30">
                    SUPER ADMIN
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Data otomatis terhubung langsung ke Cloud Database
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('finance')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1"
            >
              <span>Kelola Kas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Total Pemasukan (COS)</p>
              <p className="text-lg font-black text-emerald-400 font-mono">{formatRupiah(totalDanaCos)}</p>
            </div>
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Total Pengeluaran</p>
              <p className="text-lg font-black text-rose-400 font-mono">{formatRupiah(totalPengeluaran)}</p>
            </div>
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">Saldo Kas Organisasi</p>
              <p className="text-lg font-black text-white font-mono">{formatRupiah(saldoKas)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. PENGGALANGAN DANA AKTIF BANNER */}
      {(() => {
        const activeCampaigns = fundraisingCampaigns.filter(c => c.status === 'Sedang Berjalan');
        if (activeCampaigns.length === 0) return null;

        return (
          <div className="glass-card-dark p-6 rounded-3xl border border-red-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-red-600/30 text-red-400 rounded-2xl border border-red-500/40">
                  <HeartHandshake className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Penggalangan Dana Aktif</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px]">
                      {activeCampaigns.length} Program
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Mari bersama peduli &amp; bergotong-royong membantu sesama anggota SBN KASBI VCI.
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('fundraising')}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-md glow-red-sm"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeCampaigns.slice(0, 2).map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => onNavigate('fundraising')}
                  className="p-4 bg-slate-950/80 border border-white/10 hover:border-red-500/50 rounded-2xl space-y-2.5 shadow-md transition-all cursor-pointer group"
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
                    <span className="text-[11px] font-bold text-slate-300">Total Dana Terkumpul:</span>
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

      {/* MODAL: PKB & PERATURAN INTERAKTIF WITH SEARCH */}
      <PkbModal
        isOpen={showPkbModal}
        onClose={() => setShowPkbModal(false)}
        currentUser={currentUser}
      />

    </div>
  );
};

