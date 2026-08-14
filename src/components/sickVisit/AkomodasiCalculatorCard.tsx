import React from 'react';
import { 
  Calculator, 
  Car, 
  Coins, 
  Info, 
  ShieldCheck, 
  Clock, 
  Building2, 
  AlertCircle 
} from 'lucide-react';
import { SickVisitAkomodasi } from '../../types';

interface AkomodasiCalculatorCardProps {
  akomodasi?: SickVisitAkomodasi;
  isCompact?: boolean;
}

export const AkomodasiCalculatorCard: React.FC<AkomodasiCalculatorCardProps> = ({
  akomodasi,
  isCompact = false,
}) => {
  if (!akomodasi) {
    return (
      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 italic flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-500 shrink-0" />
        <span>Rincian akomodasi akan dihitung otomatis sesuai data penugasan & SOP 2026-2029.</span>
      </div>
    );
  }

  const {
    jenisTransportasi,
    wilayah,
    jumlahPetugas,
    isLuarJamKerja,
    isLuarRsKerjaSama,
    isDariKlinikPabrik,
    tarifPerOrang,
    tambahanLuarJam,
    totalAkomodasi,
    keteranganPerhitungan,
    statusVerifikasi
  } = akomodasi;

  const isVerified = statusVerifikasi === 'Otomatis Sesuai SOP' || statusVerifikasi === 'Terverifikasi';

  return (
    <div className={`rounded-2xl border ${isVerified ? 'bg-slate-950/80 border-slate-800' : 'bg-amber-950/20 border-amber-800/50'} p-4 space-y-3`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Perhitungan Akomodasi Petugas (SOP PTP)</span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Dihitung berdasarkan {jumlahPetugas} orang petugas pendamping
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          isVerified ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
        }`}>
          {statusVerifikasi}
        </span>
      </div>

      {/* Rincian Komponen Biaya */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Transportasi</span>
          <span className="font-bold text-slate-200 text-[11px] truncate block">{jenisTransportasi}</span>
          <span className="text-[10px] text-slate-500">{isDariKlinikPabrik ? 'Klinik Pabrik' : wilayah}</span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Jumlah Petugas</span>
          <span className="font-bold text-slate-200 text-[11px] block">{jumlahPetugas} Orang</span>
          <span className="text-[10px] text-slate-500">Bukan jlh pasien</span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Tarif / Petugas</span>
          <span className="font-bold text-slate-200 text-[11px] block">
            {tarifPerOrang > 0 ? `Rp ${tarifPerOrang.toLocaleString('id-ID')}` : (isDariKlinikPabrik ? 'Rp 0 (Org)' : 'Nota Riil')}
          </span>
          <span className="text-[10px] text-slate-500">Tarif dasar SOP</span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Tambahan Luar Jam</span>
          <span className="font-bold text-amber-400 text-[11px] block">
            {tambahanLuarJam > 0 ? `+Rp ${(tambahanLuarJam * jumlahPetugas).toLocaleString('id-ID')}` : 'Rp 0'}
          </span>
          <span className="text-[10px] text-slate-500">
            {isLuarJamKerja && isLuarRsKerjaSama ? 'Luar jam & Non-mitra' : 'Tidak berlaku'}
          </span>
        </div>
      </div>

      {/* Keterangan Perhitungan */}
      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60 text-[11px] text-slate-300 leading-relaxed">
        <p className="font-mono text-slate-400 text-[10px] mb-0.5">RUMUS SOP:</p>
        <p>{keteranganPerhitungan}</p>
      </div>

      {/* Total Box */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-800/60">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
            Total Hak Akomodasi Petugas
          </span>
          <span className="text-[10px] text-slate-400">
            {jenisTransportasi === 'Grab' ? 'Reimburse sesuai nota operasional' : 'Diberikan kepada petugas pendamping'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-base sm:text-lg font-black text-emerald-300 font-mono">
            {jenisTransportasi === 'Grab' ? 'Sesuai Nota' : `Rp ${totalAkomodasi.toLocaleString('id-ID')}`}
          </span>
        </div>
      </div>
    </div>
  );
};
