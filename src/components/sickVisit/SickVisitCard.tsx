import React from 'react';
import { 
  HeartPulse, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  ChevronRight, 
  Activity, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Car, 
  Coins, 
  AlertCircle,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { SickVisit, SickVisitStatus } from '../../types';

interface SickVisitCardProps {
  visit: SickVisit;
  onClick: () => void;
}

export const SickVisitCard: React.FC<SickVisitCardProps> = ({ visit, onClick }) => {
  // Status Badge Helper
  const getStatusBadge = (status: SickVisitStatus) => {
    switch (status) {
      case 'Dilaporkan':
      case 'Menunggu Kunjungan':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
          label: 'Dilaporkan'
        };
      case 'Menunggu Koordinasi':
        return {
          bg: 'bg-blue-950/80 text-blue-300 border-blue-800/60',
          label: 'Menunggu Koordinasi'
        };
      case 'Disetujui':
        return {
          bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
          label: 'Disetujui'
        };
      case 'Ditugaskan':
        return {
          bg: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
          label: 'Ditugaskan'
        };
      case 'Dalam Pendampingan':
      case 'Sedang Didampingi':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800/60 animate-pulse',
          label: 'Dalam Pendampingan'
        };
      case 'Selesai':
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
          label: 'Selesai'
        };
      case 'Ditolak':
        return {
          bg: 'bg-red-950/80 text-red-300 border-red-800/60',
          label: 'Ditolak'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          label: status
        };
    }
  };

  const statusBadge = getStatusBadge(visit.status);
  const isUrgent = visit.isUrgent === true;
  const isKeluarga = visit.jenisPasien === 'Keluarga';
  const namaPasien = isKeluarga && visit.namaPasien ? visit.namaPasien : visit.namaAnggota;
  const totalPetugas = [visit.petugas1, visit.petugas2].filter(Boolean).length;

  return (
    <div 
      onClick={onClick}
      className="bg-slate-900/90 hover:bg-slate-850 p-5 rounded-2xl border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer shadow-md space-y-3 group relative overflow-hidden"
    >
      {/* Top Banner Accent */}
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950/70 px-2.5 py-0.5 rounded-lg border border-rose-800/40">
            {visit.nomorPendampingan}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950 text-red-400 border border-red-800/60 text-[10px] font-black uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              URGENT RS
            </span>
          )}
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Patient & Member Info */}
      <div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="font-black text-base text-white group-hover:text-rose-300 transition-colors">
            {namaPasien}
          </h3>
          {isKeluarga && (
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/40">
              Keluarga: {visit.hubunganPasien || 'Keluarga'}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-0.5">
          Anggota: <strong className="text-slate-300">{visit.namaAnggota}</strong> ({visit.nikAnggota}) • {visit.departemen}
        </p>

        {/* Kondisi / Kebutuhan */}
        {(visit.deskripsiKondisi || visit.diagnosaSingkat || visit.catatanAwal) && (
          <p className="text-xs text-rose-400/90 font-medium mt-1 flex items-center gap-1.5 line-clamp-1">
            <Activity className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span className="truncate">
              {visit.deskripsiKondisi || visit.diagnosaSingkat || visit.catatanAwal}
            </span>
          </p>
        )}
      </div>

      {/* RS & Location Detail */}
      <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-slate-200 truncate font-semibold">
            <Building2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{visit.rumahSakitTujuan || visit.lokasi}</span>
          </p>
          {visit.isRsKerjaSama && (
            <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              RS Mitra
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span>Asal: {visit.lokasiAwal || visit.jenisLokasi || 'Tempat tinggal'}</span>
          </span>
          {visit.transportasi && (
            <span className="flex items-center gap-1 text-slate-300">
              <Car className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{visit.transportasi}</span>
            </span>
          )}
        </div>
      </div>

      {/* Petugas & Akomodasi Brief */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-1.5 text-[11px]">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate max-w-[150px]">
            {totalPetugas > 0 
              ? [visit.petugas1, visit.petugas2].filter(Boolean).join(', ') 
              : `PJ: ${visit.pengurusPenanggungJawab || '-'}`}
          </span>
        </div>

        {visit.akomodasi && visit.akomodasi.totalAkomodasi > 0 && (
          <span className="font-mono text-[11px] font-bold text-emerald-400">
            Akomodasi: Rp {visit.akomodasi.totalAkomodasi.toLocaleString('id-ID')}
          </span>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-500">
        <span>Tgl: {visit.tanggalKunjunganAwal}</span>
        
        {visit.hasilPendampingan && (
          <span className={`font-bold px-2 py-0.5 rounded ${
            visit.hasilPendampingan === 'RAWAT INAP' ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
          }`}>
            Hasil: {visit.hasilPendampingan}
          </span>
        )}

        <div className="flex items-center gap-1 text-rose-400 font-bold text-[11px] group-hover:translate-x-1 transition-transform">
          <span>Detail SOP</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
