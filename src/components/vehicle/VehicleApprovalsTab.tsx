import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  MapPin, 
  Car, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  User, 
  Phone,
  Search,
  Filter,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { VehicleLog, UserAccount, canApproveRequests } from '../../types';
import { checkVehicleAvailability } from '../../utils/vehicleUtils';

interface VehicleApprovalsTabProps {
  vehicleLogs: VehicleLog[];
  currentUser: UserAccount;
  onOpenApproveModal: (log: VehicleLog) => void;
  onSelectLogDetail: (log: VehicleLog) => void;
}

export const VehicleApprovalsTab: React.FC<VehicleApprovalsTabProps> = ({
  vehicleLogs,
  currentUser,
  onOpenApproveModal,
  onSelectLogDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const hasAuthority = canApproveRequests(currentUser);

  // Filter pending requests
  const pendingLogs = useMemo(() => {
    return vehicleLogs.filter((log) => {
      if (log.isArchived) return false;
      if (log.status !== 'Menunggu Persetujuan') return false;

      const q = searchQuery.toLowerCase();
      const match = 
        !q ||
        (log.nomorLog && log.nomorLog.toLowerCase().includes(q)) ||
        (log.namaPemakai && log.namaPemakai.toLowerCase().includes(q)) ||
        (log.kegiatan && log.kegiatan.toLowerCase().includes(q)) ||
        (log.tujuan && log.tujuan.toLowerCase().includes(q)) ||
        (log.kendaraan && log.kendaraan.toLowerCase().includes(q));

      return match;
    }).sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(a.createdAt || a.tanggalMulai).getTime() - new Date(b.createdAt || b.tanggalMulai).getTime();
    });
  }, [vehicleLogs, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in text-white pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-950/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Persetujuan Peminjaman Mobil</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                {pendingLogs.length} Menunggu
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kewenangan Pengesahan: Superadmin, Ketua, & Sekretaris PTP SBN KASBI
            </p>
          </div>
        </div>
      </div>

      {/* Authority Guard Notice */}
      {!hasAuthority && (
        <div className="p-4 bg-red-950/70 border border-red-600/70 rounded-2xl text-red-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <p className="font-bold">Akses Terbatas</p>
            <p className="text-red-300/80 text-[11px]">
              Menu persetujuan hanya dapat diakses oleh akun Superadmin, Ketua, atau Sekretaris.
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari pengajuan yang menunggu persetujuan berdasarkan pemohon, tujuan, atau no. log..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none shadow-md"
        />
      </div>

      {/* Pending List */}
      {pendingLogs.length > 0 ? (
        <div className="space-y-4">
          {pendingLogs.map((log) => {
            const isSelf = 
              log.namaPemakai === currentUser.name ||
              log.memberId === currentUser.id ||
              (currentUser.memberId && log.memberId === currentUser.memberId);

            // Check availability conflict
            const availability = checkVehicleAvailability(
              log.kendaraan,
              log.tanggalMulai,
              log.jamMulai,
              log.tanggalSelesai || log.tanggalMulai,
              log.jamSelesai,
              vehicleLogs,
              log.id
            );

            return (
              <div 
                key={log.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-all"
              >
                {/* Top status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {log.nomorLog}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Menunggu Persetujuan</span>
                    </span>
                    {log.isUrgent && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>URGENSI ORGANISASI</span>
                      </span>
                    )}
                    {log.nomorPendampingan && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                        Pendampingan: {log.nomorPendampingan}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Jadwal: <strong>{log.tanggalMulai} ({log.jamMulai}–{log.jamSelesai})</strong></span>
                  </span>
                </div>

                {/* Conflict Alert if any */}
                {!availability.isAvailable && (
                  <div className="p-3 bg-red-950/70 border border-red-800 rounded-2xl text-red-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Potensi Bentrok Jadwal Armada!</p>
                      <p className="text-[11px] text-red-300/80 mt-0.5">{availability.reason}</p>
                    </div>
                  </div>
                )}

                {/* Self-approval Warning */}
                {isSelf && (
                  <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-2xl text-amber-200 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Pencegahan Self-Approval:</strong> Anda adalah pemohon pengajuan ini. Sesuai SOP, persetujuan harus diproses oleh Ketua, Sekretaris, atau Superadmin lain.
                    </span>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5 md:col-span-2">
                    <p className="text-slate-500">Kegiatan & Keperluan:</p>
                    <p className="text-sm font-bold text-white">
                      {log.kegiatan || 'Penggunaan Mobil Operasional Organisasi'}
                    </p>
                    <p className="text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Tujuan: <strong>{log.tujuan}</strong></span>
                    </p>
                    {log.keteranganSingkat && (
                      <p className="text-slate-400 italic">"{log.keteranganSingkat}"</p>
                    )}
                  </div>

                  <div className="space-y-1 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                    <p className="text-slate-500">Pemohon:</p>
                    <p className="font-bold text-white">{log.namaPemakai}</p>
                    <p className="text-slate-400 text-[11px]">Dept: {log.departemenPemakai || '-'}</p>
                    {log.kontakPemakai && (
                      <p className="text-slate-400 text-[11px] flex items-center gap-1 pt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{log.kontakPemakai}</span>
                      </p>
                    )}
                    <div className="pt-1.5 border-t border-slate-800 mt-1">
                      <span className="text-slate-500 block text-[10px]">Armada yang Dipilih:</span>
                      <span className="font-bold text-indigo-300">{log.kendaraan}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onSelectLogDetail(log)}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lihat Detail Permohonan</span>
                  </button>

                  <button
                    type="button"
                    disabled={!hasAuthority || isSelf}
                    onClick={() => onOpenApproveModal(log)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-indigo-950/50 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>TINJAU & PROSES PERSETUJUAN</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-300 text-sm">Tidak ada antrean persetujuan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Semua pengajuan peminjaman mobil telah diproses atau belum ada permohonan baru.
          </p>
        </div>
      )}
    </div>
  );
};
