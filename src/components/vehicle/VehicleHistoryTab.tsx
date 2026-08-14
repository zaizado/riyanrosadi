import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Car, 
  Calendar, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Archive, 
  Trash2,
  Eye,
  ArrowRight
} from 'lucide-react';
import { VehicleLog, UserAccount } from '../../types';
import { getVehicleLogStatusBadge, calculateDistanceKm } from '../../utils/vehicleUtils';
import { exportVehicleLogsToExcel } from '../../lib/excelExport';

interface VehicleHistoryTabProps {
  vehicleLogs: VehicleLog[];
  currentUser: UserAccount;
  onSelectLogDetail: (log: VehicleLog) => void;
  onArchiveLog?: (logId: string) => Promise<void>;
  onDeleteLog?: (logId: string, reason: string) => Promise<void>;
}

export const VehicleHistoryTab: React.FC<VehicleHistoryTabProps> = ({
  vehicleLogs,
  currentUser,
  onSelectLogDetail,
  onArchiveLog,
  onDeleteLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Deletion Modal state for Admin
  const [deleteTargetLog, setDeleteTargetLog] = useState<VehicleLog | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdminOrAdmin = 
    currentUser.role === 'Super Admin' || 
    currentUser.role === 'Admin';

  // Filter finished / historic logs
  const historyLogs = useMemo(() => {
    return vehicleLogs.filter((log) => {
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

      if (filterStatus === 'Selesai') {
        return log.status === 'Selesai' || log.status === 'Sudah Kembali';
      }
      if (filterStatus === 'Ditolak') {
        return log.status === 'Ditolak';
      }
      if (filterStatus === 'Dibatalkan') {
        return log.status === 'Dibatalkan';
      }
      if (filterStatus === 'Arsip') {
        return log.isArchived === true;
      }

      return true;
    }).sort((a, b) => {
      return new Date(b.updatedAt || b.tanggalMulai).getTime() - new Date(a.updatedAt || a.tanggalMulai).getTime();
    });
  }, [vehicleLogs, searchQuery, filterVehicle, filterStatus]);

  // Statistics
  const totalCompleted = vehicleLogs.filter(l => l.status === 'Selesai' || l.status === 'Sudah Kembali').length;
  const totalKmCalculated = vehicleLogs.reduce((acc, l) => {
    return acc + (l.jarakTempuhKm ?? calculateDistanceKm(l.kmAwal, l.kmAkhir));
  }, 0);

  const handleConfirmDelete = async () => {
    if (!deleteTargetLog || !onDeleteLog || !deleteReason.trim()) return;
    setIsDeleting(true);
    try {
      await onDeleteLog(deleteTargetLog.id, deleteReason.trim());
      setDeleteTargetLog(null);
      setDeleteReason('');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Riwayat Penggunaan Kendaraan</h1>
            <p className="text-xs text-slate-400">Arsip seluruh perjalanan, KM tempuh, checklist, dan serah terima</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => exportVehicleLogsToExcel(vehicleLogs)}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Ekspor Laporan Excel (.xlsx)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 block">Total Riwayat Selesai</span>
          <p className="text-2xl font-black text-white font-mono mt-1">{totalCompleted}</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-bold text-indigo-400 block">Akumulasi Jarak Tempuh</span>
          <p className="text-2xl font-black text-indigo-300 font-mono mt-1">
            {totalKmCalculated.toLocaleString('id-ID')} KM
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-bold text-emerald-400 block">Kondisi Aman Terawat</span>
          <p className="text-2xl font-black text-emerald-300 font-mono mt-1">
            {vehicleLogs.filter(l => !l.adaKerusakan && (l.status === 'Selesai' || l.status === 'Sudah Kembali')).length}
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-bold text-red-400 block">Ditolak / Dibatalkan</span>
          <p className="text-2xl font-black text-red-300 font-mono mt-1">
            {vehicleLogs.filter(l => l.status === 'Ditolak' || l.status === 'Dibatalkan').length}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, kegiatan, nomor log..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            <span className="text-[11px] text-slate-500 font-semibold px-1">Filter:</span>
            {[
              { id: 'All', label: 'Semua Riwayat' },
              { id: 'Selesai', label: '✓ Selesai' },
              { id: 'Ditolak', label: '✕ Ditolak' },
              { id: 'Dibatalkan', label: 'Dibatalkan' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                  filterStatus === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scannable History List / Table */}
      {historyLogs.length > 0 ? (
        <div className="space-y-3">
          {historyLogs.map((log) => {
            const badge = getVehicleLogStatusBadge(log.status);
            const km = log.jarakTempuhKm ?? calculateDistanceKm(log.kmAwal, log.kmAkhir);

            return (
              <div
                key={log.id}
                onClick={() => onSelectLogDetail(log)}
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 sm:p-5 rounded-2xl transition-all cursor-pointer shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Car className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-400">{log.nomorLog}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-black text-sm text-white truncate">{log.kendaraan}</span>
                      {log.isUrgent && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-red-950 text-red-300 border border-red-800">
                          🚨 URGENT
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 font-medium truncate">
                      <strong>{log.kegiatan || log.tujuan}</strong> — {log.namaPemakai} ({log.departemenPemakai})
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        {log.tanggalMulai} ({log.jamMulai}–{log.jamSelesai})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {log.tujuan}
                      </span>
                      {km > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                            {km} KM
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${badge.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                    <span>{badge.label}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLogDetail(log);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Lihat Detail Lengkap"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isSuperAdminOrAdmin && onDeleteLog && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetLog(log);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition-all"
                        title="Hapus / Audit (Admin Only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
          <History className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="font-bold text-sm text-slate-300">Tidak ada riwayat ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'All'
              ? 'Coba ubah kata kunci pencarian atau reset filter di atas.'
              : 'Belum ada data riwayat penggunaan kendaraan yang tersimpan.'}
          </p>
        </div>
      )}

      {/* Admin Delete Confirmation Modal with Mandatory Reason */}
      {deleteTargetLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/80 rounded-2xl border border-red-800">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base">Hapus Catatan Penggunaan</h3>
                <p className="text-xs text-slate-400">Tindakan ini memerlukan alasan audit organisasi</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1 text-slate-300">
              <p><span className="text-slate-500">No. Log:</span> <strong>{deleteTargetLog.nomorLog}</strong></p>
              <p><span className="text-slate-500">Kendaraan:</span> <strong>{deleteTargetLog.kendaraan}</strong></p>
              <p><span className="text-slate-500">Pemohon:</span> <strong>{deleteTargetLog.namaPemakai}</strong></p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Alasan Penghapusan (Wajib dicatat di Audit Log) <span className="text-red-400">*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Contoh: Kesalahan input ganda / data duplikat administrasi..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetLog(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!deleteReason.trim() || isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black shadow transition-all cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Konfirmasi Hapus & Catat Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
