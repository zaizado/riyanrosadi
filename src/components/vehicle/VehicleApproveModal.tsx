import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Car, 
  UserCheck, 
  Phone, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  X,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { VehicleLog, UserAccount, canApproveRequests } from '../../types';

interface VehicleApproveModalProps {
  log: VehicleLog;
  currentUser: UserAccount;
  onApprove: (logId: string, driverNama: string, driverKontak: string, catatan?: string) => Promise<void>;
  onReject: (logId: string, alasanPenolakan: string) => Promise<void>;
  onClose: () => void;
}

export const VehicleApproveModal: React.FC<VehicleApproveModalProps> = ({
  log,
  currentUser,
  onApprove,
  onReject,
  onClose,
}) => {
  const [mode, setMode] = useState<'approve' | 'reject'>('approve');
  const [driverNama, setDriverNama] = useState(log.driverNama || log.namaPemakai || '');
  const [driverKontak, setDriverKontak] = useState(log.driverKontak || log.kontakPemakai || '');
  const [catatan, setCatatan] = useState('');
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasApprovalAuthority = canApproveRequests(currentUser);
  const isSelf = 
    log.namaPemakai === currentUser.name || 
    log.memberId === currentUser.id || 
    (currentUser.memberId && log.memberId === currentUser.memberId);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasApprovalAuthority) {
      setErrorMsg('Anda tidak memiliki kewenangan menyetujui pengajuan (Khusus Superadmin, Ketua, Sekretaris).');
      return;
    }
    if (isSelf) {
      setErrorMsg('Sesuai SOP, Anda tidak dapat menyetujui pengajuan yang Anda buat sendiri. Harus disetujui pengurus berwenang lain.');
      return;
    }
    if (!driverNama.trim()) {
      setErrorMsg('Harap tentukan nama pengemudi/driver penanggung jawab.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    try {
      await onApprove(log.id, driverNama.trim(), driverKontak.trim(), catatan.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses persetujuan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasApprovalAuthority) {
      setErrorMsg('Anda tidak memiliki kewenangan menolak pengajuan (Khusus Superadmin, Ketua, Sekretaris).');
      return;
    }
    if (!alasanPenolakan.trim()) {
      setErrorMsg('Harap isi alasan penolakan penggunaan kendaraan.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    try {
      await onReject(log.id, alasanPenolakan.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menolak pengajuan');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Persetujuan Peminjaman Mobil</h2>
              <p className="text-xs text-slate-400">Kewenangan: Superadmin, Ketua, & Sekretaris</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Self-Approval Warning */}
        {isSelf && (
          <div className="p-3.5 bg-amber-950/70 border border-amber-600/70 rounded-2xl text-amber-200 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Pencegahan Self-Approval (SOP Organisasi)</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Anda adalah pemohon pengajuan ini. Sesuai SOP, persetujuan harus dilakukan oleh pengurus berwenang lain (Superadmin / Ketua / Sekretaris).
              </p>
            </div>
          </div>
        )}

        {/* Log Info Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono">{log.nomorLog}</span>
            <span className="font-bold text-white">{log.kendaraan} ({log.platNomor || '-'})</span>
          </div>
          <p className="text-white font-bold text-sm">
            {log.kegiatan || log.tujuan}
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <p>Pemohon: <strong className="text-slate-200">{log.namaPemakai}</strong></p>
            <p>Dept/Unit: <strong className="text-slate-200">{log.departemenPemakai}</strong></p>
            <p>Tanggal: <strong className="text-slate-200">{log.tanggalMulai}</strong></p>
            <p>Waktu: <strong className="text-slate-200">{log.jamMulai} – {log.jamSelesai}</strong></p>
          </div>
          {log.nomorPendampingan && (
            <div className="p-2 bg-blue-950/60 border border-blue-800/60 rounded-xl text-blue-300 text-[11px] flex items-center gap-1.5">
              <span className="font-bold">Terkait Pendampingan Sakit:</span>
              <span className="font-mono">{log.nomorPendampingan}</span>
            </div>
          )}
          {log.isUrgent && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-[11px] flex items-start gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
              <span>Pengajuan Urgensi: {log.alasanUrgensi || 'Kebutuhan mendesak organisasi'}</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Toggle Mode: Setujui vs Tolak */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('approve')}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'approve'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✓ Setujui Pengajuan
          </button>
          <button
            type="button"
            onClick={() => setMode('reject')}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'reject'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✕ Tolak Pengajuan
          </button>
        </div>

        {mode === 'approve' ? (
          <form onSubmit={handleApproveSubmit} className="space-y-4">
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                Penugasan Pengemudi / Driver
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Nama Driver / Petugas yang Membawa <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={driverNama}
                  onChange={(e) => setDriverNama(e.target.value)}
                  placeholder="Nama pengemudi yang bertanggung jawab"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Nomor HP / WhatsApp Driver
                </label>
                <input
                  type="text"
                  value={driverKontak}
                  onChange={(e) => setDriverKontak(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Catatan Persetujuan (Opsional)
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan dari penanggung jawab kendaraan..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isProcessing || isSelf || !hasApprovalAuthority}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer transition-all"
                title={isSelf ? 'Tidak dapat menyetujui pengajuan sendiri' : 'Setujui Pengajuan'}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses...' : 'SETUJUI & TUGASKAN DRIVER'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div className="space-y-3 bg-red-950/30 p-4 rounded-2xl border border-red-900/60">
              <h4 className="text-xs font-black text-red-300 uppercase tracking-wider">
                Alasan Penolakan Pengajuan
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Alasan Penolakan <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={alasanPenolakan}
                  onChange={(e) => setAlasanPenolakan(e.target.value)}
                  placeholder="Contoh: Ada kegiatan serikat mendesak yang membutuhkan armada ini..."
                  rows={3}
                  className="w-full bg-slate-900 border border-red-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isProcessing || !alasanPenolakan.trim() || !hasApprovalAuthority}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-red-950/50 flex items-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>{isProcessing ? 'Menolak...' : 'KONFIRMASI TOLAK'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
