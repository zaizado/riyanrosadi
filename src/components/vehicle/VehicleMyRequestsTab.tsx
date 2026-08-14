import React, { useMemo, useState } from 'react';
import { 
  Car, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  RotateCcw,
  Search,
  PlusCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { VehicleLog, UserAccount } from '../../types';
import { getVehicleLogStatusBadge } from '../../utils/vehicleUtils';

interface VehicleMyRequestsTabProps {
  vehicleLogs: VehicleLog[];
  currentUser: UserAccount;
  onOpenChecklistModal: (log: VehicleLog) => void;
  onOpenReturnModal: (log: VehicleLog) => void;
  onSelectLogDetail: (log: VehicleLog) => void;
  onNavigateToRequest: () => void;
}

export const VehicleMyRequestsTab: React.FC<VehicleMyRequestsTabProps> = ({
  vehicleLogs,
  currentUser,
  onOpenChecklistModal,
  onOpenReturnModal,
  onSelectLogDetail,
  onNavigateToRequest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Filter logs where currentUser is requester or assigned driver
  const myLogs = useMemo(() => {
    return vehicleLogs.filter((log) => {
      if (log.isArchived) return false;
      const isMyRequest = 
        log.namaPemakai === currentUser.name ||
        log.memberId === currentUser.id ||
        (currentUser.memberId && log.memberId === currentUser.memberId) ||
        log.driverNama === currentUser.name;

      if (!isMyRequest) return false;

      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !q ||
        (log.nomorLog && log.nomorLog.toLowerCase().includes(q)) ||
        (log.kegiatan && log.kegiatan.toLowerCase().includes(q)) ||
        (log.tujuan && log.tujuan.toLowerCase().includes(q)) ||
        (log.kendaraan && log.kendaraan.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterStatus === 'All') return true;
      if (filterStatus === 'Aktif') {
        return log.status === 'Disetujui' || log.status === 'Siap Digunakan' || log.status === 'Sedang Digunakan';
      }
      if (filterStatus === 'Menunggu') return log.status === 'Menunggu Persetujuan';
      if (filterStatus === 'Selesai') return log.status === 'Selesai';
      return log.status === filterStatus;
    }).sort((a, b) => new Date(b.createdAt || b.tanggalMulai).getTime() - new Date(a.createdAt || a.tanggalMulai).getTime());
  }, [vehicleLogs, currentUser, searchQuery, filterStatus]);

  const waitingCount = myLogs.filter(l => l.status === 'Menunggu Persetujuan').length;
  const activeCount = myLogs.filter(l => l.status === 'Disetujui' || l.status === 'Sedang Digunakan' || l.status === 'Siap Digunakan').length;
  const finishedCount = myLogs.filter(l => l.status === 'Selesai').length;

  return (
    <div className="space-y-6 animate-fade-in text-white pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Pengajuan Saya</h1>
            <p className="text-xs text-slate-400">
              Daftar penggunaan mobil operasional yang diajukan atas nama akun <strong>{currentUser.name}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToRequest}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black shadow-lg shadow-red-950/50 flex items-center gap-2 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ajukan Kendaraan Baru</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setFilterStatus('Menunggu')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'Menunggu'
              ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-amber-400 font-bold block">Menunggu Persetujuan</span>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">{waitingCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Aktif')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'Aktif'
              ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-indigo-400 font-bold block">Disetujui & Digunakan</span>
          <p className="text-2xl font-black text-indigo-300 font-mono mt-1">{activeCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Selesai')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'Selesai'
              ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-emerald-400 font-bold block">Riwayat Selesai</span>
          <p className="text-2xl font-black text-emerald-300 font-mono mt-1">{finishedCount}</p>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengajuan saya berdasarkan tujuan, nomor log, atau kegiatan..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['All', 'Aktif', 'Menunggu', 'Selesai'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {st === 'All' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* List of Requests */}
      {myLogs.length > 0 ? (
        <div className="space-y-3.5">
          {myLogs.map((log) => {
            const badge = getVehicleLogStatusBadge(log.status);
            const isApproved = log.status === 'Disetujui' || log.status === 'Siap Digunakan';
            const isInUse = log.status === 'Sedang Digunakan';
            const isPending = log.status === 'Menunggu Persetujuan';
            const isRejected = log.status === 'Ditolak';

            return (
              <div 
                key={log.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all space-y-4"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {log.nomorLog}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                    {log.isUrgent && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>URGENSI</span>
                      </span>
                    )}
                    {log.nomorPendampingan && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                        Pendampingan: {log.nomorPendampingan}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{log.tanggalMulai} ({log.jamMulai}–{log.jamSelesai})</span>
                  </div>
                </div>

                {/* Content Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs text-slate-400">Kegiatan & Keperluan:</p>
                    <p className="text-sm font-bold text-white">
                      {log.kegiatan || 'Penggunaan Mobil Organisasi'}
                    </p>
                    <p className="text-slate-300 flex items-center gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Tujuan: <strong>{log.tujuan}</strong></span>
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                    <p className="text-slate-500">Armada:</p>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-indigo-400" />
                      <span>{log.kendaraan}</span>
                      <span className="text-[11px] text-slate-400 font-normal">({log.platNomor || '-'})</span>
                    </p>
                    {log.driverNama && (
                      <p className="text-slate-400 text-[11px] pt-1">
                        Driver: <strong className="text-slate-200">{log.driverNama}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Rejection Alert */}
                {isRejected && log.alasanPenolakan && (
                  <div className="p-3 bg-red-950/60 border border-red-800 rounded-2xl text-red-300 text-xs">
                    <strong>Alasan Penolakan:</strong> {log.alasanPenolakan}
                  </div>
                )}

                {/* Pending info */}
                {isPending && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-amber-300 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Pengajuan ini sedang menunggu peninjauan dan persetujuan dari penanggung jawab kendaraan organisasi.</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/60 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onSelectLogDetail(log)}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lihat Detail Lengkap</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => onOpenChecklistModal(log)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>CEK & MULAI PERJALANAN</span>
                      </button>
                    )}

                    {isInUse && (
                      <button
                        type="button"
                        onClick={() => onOpenReturnModal(log)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>KENDARAAN SUDAH KEMBALI</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-300 text-sm">Belum ada pengajuan kendaraan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Anda belum memiliki pengajuan peminjaman mobil operasional. Klik tombol di bawah untuk membuat pengajuan baru.
          </p>
          <button
            type="button"
            onClick={onNavigateToRequest}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Pengajuan Sekarang</span>
          </button>
        </div>
      )}
    </div>
  );
};
