import React from 'react';
import { X, Calculator, HelpCircle, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { SeveranceCalculationResult } from '../../types/severance';
import { formatRupiah } from '../../utils/currencyFormatter';
import { ModalPortal } from '../ModalPortal';

interface SeveranceFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  calc: SeveranceCalculationResult;
}

export const SeveranceFormulaModal: React.FC<SeveranceFormulaModalProps> = ({
  isOpen,
  onClose,
  calc
}) => {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9998] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-white shadow-2xl relative my-auto space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto scrollbar-thin">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-500/40 flex items-center justify-center text-red-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base uppercase tracking-wider text-white">
                  TRANSPARANSI FORMULA PERHITUNGAN
                </h3>
                <p className="text-xs text-slate-400">
                  Rincian rinci acuan Pasal 77 PKB PT Victory Chingluh Indonesia
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Member Summary Header */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400">Pekerja:</span> <strong className="text-white">{calc.employeeName}</strong> ({calc.nik})
            </div>
            <div>
              <span className="text-slate-400">Masa Kerja:</span> <strong className="text-emerald-400">{calc.formattedServicePeriod}</strong> ({calc.yearsOfService} Thn)
            </div>
            <div>
              <span className="text-slate-400">Upah Dasar:</span> <strong className="text-amber-400">{formatRupiah(calc.calculationBase)}</strong>
            </div>
          </div>

          {/* Step by Step Breakdown Cards */}
          <div className="space-y-4 text-xs">
            {/* Step 1: Uang Pesangon */}
            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center gap-2 text-red-400 font-black">
                  <Award className="w-4 h-4" />
                  1. UANG PESANGON (UP)
                </span>
                <span className="text-sm font-black text-white">{formatRupiah(calc.severanceAmount)}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-mono bg-slate-900/90 p-2.5 rounded-lg border border-white/5">
                • Masa Kerja <strong>{calc.yearsOfService} Tahun</strong> berdasarkan Pasal 77 PKB = <strong>{calc.severanceMonths} Bulan Upah</strong>.<br />
                • Alasan PHK: <em>{calc.terminationType}</em> (Faktor Multiplier = <strong>{calc.severanceMultiplier}x</strong>).<br />
                • <strong>Formula:</strong> {calc.severanceMonths} Bulan × {formatRupiah(calc.calculationBase)} × {calc.severanceMultiplier}x = <strong className="text-red-400">{formatRupiah(calc.severanceAmount)}</strong>
              </p>
            </div>

            {/* Step 2: UPMK */}
            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center gap-2 text-amber-400 font-black">
                  <Award className="w-4 h-4" />
                  2. UANG PENGHARGAAN MASA KERJA (UPMK)
                </span>
                <span className="text-sm font-black text-white">{formatRupiah(calc.upmkAmount)}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-mono bg-slate-900/90 p-2.5 rounded-lg border border-white/5">
                • Masa Kerja <strong>{calc.yearsOfService} Tahun</strong> berdasarkan tabel UPMK = <strong>{calc.upmkMonths} Bulan Upah</strong>.<br />
                • Multiplier UPMK = <strong>{calc.upmkMultiplier}x</strong>.<br />
                • <strong>Formula:</strong> {calc.upmkMonths} Bulan × {formatRupiah(calc.calculationBase)} × {calc.upmkMultiplier}x = <strong className="text-amber-400">{formatRupiah(calc.upmkAmount)}</strong>
              </p>
            </div>

            {/* Step 3: UPH 15% */}
            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center gap-2 text-emerald-400 font-black">
                  <Award className="w-4 h-4" />
                  3. UPH - PERUMAHAN &amp; OBAT (15%)
                </span>
                <span className="text-sm font-black text-white">{formatRupiah(calc.uph15Amount)}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-mono bg-slate-900/90 p-2.5 rounded-lg border border-white/5">
                {calc.uphEligible15 ? (
                  <>
                    • Hak Perumahan &amp; Pengobatan sebesar 15% dari (Total Pesangon + Total UPMK).<br />
                    • <strong>Formula:</strong> 15% × ({formatRupiah(calc.severanceAmount)} + {formatRupiah(calc.upmkAmount)}) = 15% × {formatRupiah(calc.severanceAmount + calc.upmkAmount)} = <strong className="text-emerald-400">{formatRupiah(calc.uph15Amount)}</strong>
                  </>
                ) : (
                  <>• Jenis PHK ini tidak memenuhi syarat untuk penggantian 15% (Nilai: Rp 0).</>
                )}
              </p>
            </div>

            {/* Step 4: Sisa Cuti & Komponen Lain */}
            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center gap-2 text-blue-400 font-black">
                  <Award className="w-4 h-4" />
                  4. SISA CUTI TAHUNAN &amp; KOMPONEN LAIN
                </span>
                <span className="text-sm font-black text-white">{formatRupiah(calc.unusedLeaveAmount + calc.returnTravelAmount + calc.otherCompensation)}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-mono bg-slate-900/90 p-2.5 rounded-lg border border-white/5">
                • Sisa Cuti: <strong>{calc.unusedLeaveDays} Hari</strong> = ({calc.unusedLeaveDays}/21) × {formatRupiah(calc.calculationBase)} = <strong>{formatRupiah(calc.unusedLeaveAmount)}</strong>.<br />
                • Ongkos Pulang &amp; Komponen Khusus = <strong>{formatRupiah(calc.returnTravelAmount + calc.otherCompensation)}</strong>.
              </p>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border border-red-500/50 rounded-xl text-center space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-red-300 font-black">TOTAL HAK PHK KESELURUHAN</p>
              <p className="text-2xl font-black text-white">{formatRupiah(calc.totalAmount)}</p>
              <p className="text-[10px] text-slate-400">
                (Sesuai acuan PKB PT Victory Chingluh Indonesia versi {calc.pkbVersion})
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              Tutup Penjelasan
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
