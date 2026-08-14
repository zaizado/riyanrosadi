import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Car, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  User, 
  Phone, 
  Key, 
  Filter, 
  Search, 
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { VehicleLog, UserAccount, Member } from '../../types';
import { getVehicleLogStatusBadge, calculateDistanceKm } from '../../utils/vehicleUtils';
import { exportVehicleLogsToExcel } from '../../lib/excelExport';

interface VehicleScheduleTabProps {
  vehicleLogs: VehicleLog[];
  currentUser: UserAccount;
  onOpenChecklistModal: (log: VehicleLog) => void;
  onOpenReturnModal: (log: VehicleLog) => void;
  onOpenApproveModal: (log: VehicleLog) => void;
  onSelectLogDetail: (log: VehicleLog) => void;
  onNavigateToRequest: () => void;
}

export const VehicleScheduleTab: React.FC<VehicleScheduleTabProps> = ({
  vehicleLogs,
  currentUser,
  onOpenChecklistModal,
  onOpenReturnModal,
  onOpenApproveModal,
  onSelectLogDetail,
  onNavigateToRequest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Menunggu' | 'Disetujui' | 'SedangDigunakan'>('All');
  const [filterVehicle, setFilterVehicle] = useState<string>('All');

  const isSuperAdminOrPengurus = 
    currentUser.role === 'Super Admin' || 
    currentUser.role === 'Pengurus' ||
    currentUser.role === 'Admin';

  // Filter Active and Scheduled Logs (exclude archived and finished)
  const scheduleLogs = useMemo(() => {
    return vehicleLogs.filter((log) => {
      if (log.isArchived) return false;

      // Filter statuses relevant to schedule
      const isScheduleStatus = 
        log.status === 'Menunggu Persetujuan' ||
        log.status === 'Disetujui' ||
        log.status === 'Siap Digunakan' ||
        log.status === 'Sedang Digunakan';

      if (!isScheduleStatus) return false;

      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !q ||
        (log.nomorLog && log.nomorLog.toLowerCase().includes(q)) ||
        (log.namaPemakai && log.namaPemakai.toLowerCase().includes(q)) ||
        (log.kegiatan && log.kegiatan.toLowerCase().includes(q)) ||
        (log.tujuan && log.tujuan.toLowerCase().includes(q)) ||
        (log.kendaraan && log.kendaraan.toLowerCase().includes(q)) ||
        (log.driverNama && log.driverNama.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterVehicle !== 'All' && log.kendaraan !== filterVehicle) return false;

      if (filterStatus === 'Menunggu') return log.status === 'Menunggu Persetujuan';
      if (filterStatus === 'Disetujui') return log.status === 'Disetujui' || log.status === 'Siap Digunakan';
      if (filterStatus === 'SedangDigunakan') return log.status === 'Sedang Digunakan';

      return true;
    }).sort((a, b) => {
      // Urgent first, then date
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime();
    });
  }, [vehicleLogs, searchQuery, filterStatus, filterVehicle]);

  const pendingCount = vehicleLogs.filter(l => l.status === 'Menunggu Persetujuan' && !l.isArchived).length;
  const approvedCount = vehicleLogs.filter(l => (l.status === 'Disetujui' || l.status === 'Siap Digunakan') && !l.isArchived).length;
  const inUseCount = vehicleLogs.filter(l => l.status === 'Sedang Digunakan' && !l.isArchived).length;

  return (
    <div className="space-y-6 animate-fade-in text-white pb-12">
      
      {/* Header & Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Jadwal & Penugasan Kendaraan</h1>
            <p className="text-xs text-slate-400">Daftar peminjaman mobil yang disetujui dan siap beroperasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => exportVehicleLogsToExcel(vehicleLogs)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToRequest}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white text-xs font-black shadow flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>+ Ajukan Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Status Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setFilterStatus('All')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'All'
              ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-slate-400 font-bold block">Semua Jadwal Aktif</span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {pendingCount + approvedCount + inUseCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Menunggu')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'Menunggu'
              ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold">Menunggu Persetujuan</span>
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">{pendingCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Disetujui')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'Disetujui'
              ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-blue-400 font-bold block">Telah Disetujui</span>
          <p className="text-2xl font-black text-blue-300 font-mono mt-1">{approvedCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('SedangDigunakan')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'SedangDigunakan'
              ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-indigo-400 font-bold block">Sedang Di Jalan</span>
          <p className="text-2xl font-black text-indigo-300 font-mono mt-1">{inUseCount}</p>
        </button>
      </div>

      {/* Search & Filter Options */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pemohon, kegiatan, tujuan, driver..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Kendaraan:</span>
          {['All', 'Mitsubishi Xpander', 'Daihatsu Xenia'].map((v) => (
            <button
              key={v}
              onClick={() => setFilterVehicle(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                filterVehicle === v
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {v === 'All' ? 'Semua Armada' : v.includes('Xpander') ? 'Mobil 1 (Xpander)' : 'Mobil 2 (Xenia)'}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Cards Grid */}
      {scheduleLogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scheduleLogs.map((log) => {
            const badge = getVehicleLogStatusBadge(log.status);

            return (
              <div 
                key={log.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 space-y-3.5 shadow-lg flex flex-col justify-between transition-all ${
                  log.isUrgent
                    ? 'border-red-600/70 shadow-red-950/30'
                    : log.status === 'Sedang Digunakan'
                    ? 'border-indigo-500/70 shadow-indigo-950/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badge Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-mono font-bold text-slate-400 block">
                        {log.nomorLog}
                      </span>
                      <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{log.kendaraan}</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {log.isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-red-300 border border-red-800">
                          🚨 URGENT
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${badge.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                        <span>{badge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Purpose & Schedule Details */}
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Kegiatan & Tujuan:</span>
                      <p className="font-bold text-white text-xs mt-0.5">{log.kegiatan || 'Penggunaan Operasional'}</p>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{log.tujuan}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Jadwal Tanggal:</span>
                        <span className="font-mono text-slate-300 font-semibold">{log.tanggalMulai}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Waktu:</span>
                        <span className="font-mono text-slate-300 font-semibold">{log.jamMulai} – {log.jamSelesai}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Pemohon:</span>
                        <span className="font-semibold text-slate-200">{log.namaPemakai} ({log.departemenPemakai})</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Driver / Petugas:</span>
                        <span className="font-semibold text-indigo-300">{log.driverNama || 'Belum Ditentukan'}</span>
                      </div>
                    </div>

                    {log.isUrgent && log.alasanUrgensi && (
                      <div className="pt-2 border-t border-red-900/50 text-[11px] text-red-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                        <span>Alasan: {log.alasanUrgensi}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="pt-2 space-y-2">
                  {/* Approval State */}
                  {log.status === 'Menunggu Persetujuan' && (
                    <div className="flex items-center gap-2">
                      {isSuperAdminOrPengurus ? (
                        <button
                          type="button"
                          onClick={() => onOpenApproveModal(log)}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Persetujuan & Driver</span>
                        </button>
                      ) : (
                        <div className="flex-1 p-2 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-center text-xs font-semibold">
                          Menunggu Review Penanggung Jawab
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectLogDetail(log)}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                      >
                        Detail
                      </button>
                    </div>
                  )}

                  {/* Approved -> Ready to Inspect & Start */}
                  {(log.status === 'Disetujui' || log.status === 'Siap Digunakan') && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenChecklistModal(log)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Key className="w-4 h-4" />
                        <span>Cek Kendaraan & Berangkat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectLogDetail(log)}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                      >
                        Detail
                      </button>
                    </div>
                  )}

                  {/* In Use -> Complete & Return */}
                  {log.status === 'Sedang Digunakan' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenReturnModal(log)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>KENDARAAN SUDAH KEMBALI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectLogDetail(log)}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                      >
                        Detail
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
          <Calendar className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="font-bold text-sm text-slate-300">Tidak ada jadwal kendaraan aktif</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'All'
              ? 'Tidak ada data yang sesuai dengan kata kunci pencarian atau filter status.'
              : 'Belum ada jadwal perjalanan yang sedang berjalan atau menunggu persetujuan.'}
          </p>
          <button
            type="button"
            onClick={onNavigateToRequest}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all cursor-pointer inline-block"
          >
            + Ajukan Peminjaman Kendaraan
          </button>
        </div>
      )}

    </div>
  );
};
