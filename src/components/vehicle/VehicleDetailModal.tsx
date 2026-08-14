import React from 'react';
import { 
  X, 
  Car, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Gauge, 
  Printer, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { VehicleLog, UserAccount } from '../../types';
import { getVehicleLogStatusBadge, calculateDistanceKm } from '../../utils/vehicleUtils';

interface VehicleDetailModalProps {
  log: VehicleLog;
  currentUser: UserAccount;
  onClose: () => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  log,
  currentUser,
  onClose,
}) => {
  const badge = getVehicleLogStatusBadge(log.status);
  const jarak = log.jarakTempuhKm ?? calculateDistanceKm(log.kmAwal, log.kmAkhir);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400 font-bold">{log.nomorLog}</span>
                {log.isUrgent && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-red-300 border border-red-800">
                    🚨 URGENT
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-white">{log.kendaraan}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Cetak Bukti"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Header for Physical Document */}
        <div className="hidden print:block border-b pb-4 text-center">
          <h1 className="text-xl font-bold">PTP SBN KASBI PT VICTORY CHINGLUH INDONESIA</h1>
          <p className="text-xs">Formulir Log Penggunaan Kendaraan Operasional Organisasi</p>
          <p className="text-xs font-mono font-bold mt-1">No. Log: {log.nomorLog}</p>
        </div>

        {/* Status Badge banner */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Status Penggunaan</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${badge.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
                <span>{badge.label}</span>
              </span>
            </div>
          </div>

          {jarak > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Jarak Tempuh</span>
              <span className="text-base font-black font-mono text-indigo-300">{jarak} KM</span>
            </div>
          )}
        </div>

        {/* Section 1: Informasi Pemohon & Kegiatan */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <h3 className="font-black text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Kegiatan & Pemohon</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[11px]">Nama Kegiatan:</span>
              <strong className="text-white text-xs">{log.kegiatan || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Tujuan / Lokasi:</span>
              <strong className="text-white text-xs">{log.tujuan}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Nama Pemohon:</span>
              <span className="font-semibold text-slate-200">{log.namaPemakai} ({log.departemenPemakai})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Kontak Pemohon:</span>
              <span className="font-mono text-slate-200">{log.kontakPemakai || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Jadwal Berangkat:</span>
              <span className="font-mono text-slate-200">{log.tanggalMulai} • {log.jamMulai} WIB</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Jadwal Kembali:</span>
              <span className="font-mono text-slate-200">{log.tanggalSelesai || log.tanggalMulai} • {log.jamSelesai} WIB</span>
            </div>
          </div>

          {log.keteranganSingkat && (
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-500">Keterangan:</span> {log.keteranganSingkat}
            </div>
          )}

          {log.isUrgent && log.alasanUrgensi && (
            <div className="p-3 bg-red-950/60 border border-red-900/60 rounded-xl text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold">Penggunaan Kategori Urgensi / Darurat</p>
                <p className="mt-0.5">{log.alasanUrgensi}</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Penugasan Driver & Persetujuan */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <h3 className="font-black text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Persetujuan & Driver</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[11px]">Driver / Petugas:</span>
              <strong className="text-white text-xs">{log.driverNama || log.namaPemakai}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Kontak Driver:</span>
              <span className="font-mono text-slate-200">{log.driverKontak || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Disetujui Oleh:</span>
              <span className="font-semibold text-slate-200">{log.disetujuiOleh || log.petugasSerahTerima || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Waktu Persetujuan:</span>
              <span className="font-mono text-slate-200">{log.tanggalDisetujui || log.updatedAt}</span>
            </div>
          </div>

          {log.alasanPenolakan && (
            <div className="p-3 bg-red-950/60 border border-red-900 rounded-xl text-red-300 text-xs">
              <strong>Alasan Penolakan:</strong> {log.alasanPenolakan}
            </div>
          )}
        </div>

        {/* Section 3: Odometer & Hasil Pemeriksaan */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <h3 className="font-black text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            <span>Catatan Odometer & Kondisi Fisik</span>
          </h3>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-bold">KM AWAL</span>
              <span className="font-mono font-bold text-white text-sm">
                {log.kmAwal ? `${log.kmAwal.toLocaleString('id-ID')} KM` : '-'}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-bold">KM AKHIR</span>
              <span className="font-mono font-bold text-white text-sm">
                {log.kmAkhir ? `${log.kmAkhir.toLocaleString('id-ID')} KM` : '-'}
              </span>
            </div>

            <div className="bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-800">
              <span className="text-[10px] text-indigo-400 block font-bold">JARAK TEMPUH</span>
              <span className="font-mono font-bold text-indigo-200 text-sm">
                {jarak > 0 ? `${jarak} KM` : '-'}
              </span>
            </div>
          </div>

          {/* Damage report check */}
          {log.adaKerusakan && (
            <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold">Laporan Kendala / Kerusakan Saat Kembali:</p>
                <p className="mt-0.5">{log.penjelasanKerusakan}</p>
              </div>
            </div>
          )}

          {/* Serah Terima Kembali */}
          {(log.diserahkanOleh || log.diterimaOleh) && (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <p>Diserahkan: <strong className="text-slate-200">{log.diserahkanOleh || '-'}</strong></p>
              <p>Diterima: <strong className="text-slate-200">{log.diterimaOleh || '-'}</strong></p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
