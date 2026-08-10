import React, { useState } from 'react';
import { 
  Award, 
  FileSpreadsheet, 
  Printer, 
  Save, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { SeveranceCalculationResult } from '../../types/severance';
import { formatRupiah } from '../../utils/currencyFormatter';
import { generateSeverancePdf } from './SeverancePdfGenerator';
import { SeveranceFormulaModal } from './SeveranceFormulaModal';
import { PrimaryButton, SecondaryButton } from '../ui/DesignSystem';

interface SeveranceResultCardProps {
  calc: SeveranceCalculationResult;
  onSaveHistory: (calc: SeveranceCalculationResult) => Promise<void>;
  onReset: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

export const SeveranceResultCard: React.FC<SeveranceResultCardProps> = ({
  calc,
  onSaveHistory,
  onReset,
  isSaving,
  isSaved
}) => {
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden animate-fadeIn">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Result Box */}
      <div className="bg-gradient-to-r from-red-950 via-red-900/90 to-slate-950 border border-red-500/50 rounded-2xl p-5 sm:p-6 text-white text-center space-y-3 relative shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-900/60 border border-red-500/40 rounded-full text-[11px] font-black uppercase tracking-widest text-red-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          TOTAL ESTIMASI HAK PHK ANGGOTA
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {formatRupiah(calc.totalAmount)}
          </h2>
          <p className="text-xs text-red-200/90 mt-1 font-medium">
            Sesuai Acuan Pasal 77 PKB PT Victory Chingluh Indonesia ({calc.pkbVersion})
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10">
            Nama: <strong className="text-white">{calc.employeeName}</strong>
          </span>
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10">
            Masa Kerja: <strong className="text-emerald-400">{calc.formattedServicePeriod}</strong>
          </span>
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10">
            Upah Dasar: <strong className="text-amber-400">{formatRupiah(calc.calculationBase)}</strong>
          </span>
        </div>
      </div>

      {/* Breakdown Grid Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-red-500" />
            RINCIAN KOMPONEN HAK HAK PHK
          </h4>
          <button
            onClick={() => setShowFormulaModal(true)}
            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Lihat Transparansi Formula
          </button>
        </div>

        <div className="bg-slate-950/80 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/10 text-xs">
          {/* Uang Pesangon */}
          <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-white/5 transition-colors">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>Uang Pesangon (UP)</span>
                <span className="px-2 py-0.2 text-[10px] bg-red-950 text-red-300 border border-red-500/30 rounded font-mono">
                  {calc.severanceMonths} Bulan × {calc.severanceMultiplier}x
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {calc.severanceMonths} Bulan × {formatRupiah(calc.calculationBase)} × {calc.severanceMultiplier}x
              </p>
            </div>
            <p className="font-black text-sm text-red-400 font-mono">{formatRupiah(calc.severanceAmount)}</p>
          </div>

          {/* UPMK */}
          <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-white/5 transition-colors">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>Uang Penghargaan Masa Kerja (UPMK)</span>
                <span className="px-2 py-0.2 text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 rounded font-mono">
                  {calc.upmkMonths} Bulan × {calc.upmkMultiplier}x
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {calc.upmkMonths} Bulan × {formatRupiah(calc.calculationBase)} × {calc.upmkMultiplier}x
              </p>
            </div>
            <p className="font-black text-sm text-amber-400 font-mono">{formatRupiah(calc.upmkAmount)}</p>
          </div>

          {/* UPH 15% */}
          <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-white/5 transition-colors">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>UPH - Penggantian Perumahan &amp; Obat (15%)</span>
                <span className={`px-2 py-0.2 text-[10px] rounded font-mono border ${calc.uphEligible15 ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-white/10'}`}>
                  {calc.uphEligible15 ? 'Berhak 15%' : 'Tidak Memenuhi Syarat'}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {calc.uphEligible15 ? `15% × (${formatRupiah(calc.severanceAmount)} + ${formatRupiah(calc.upmkAmount)})` : 'Sesuai alasan PHK'}
              </p>
            </div>
            <p className="font-black text-sm text-emerald-400 font-mono">{formatRupiah(calc.uph15Amount)}</p>
          </div>

          {/* Sisa Cuti & Komponen Lain */}
          <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-white/5 transition-colors">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>UPH - Sisa Cuti Tahunan &amp; Ongkos Pulang</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Cuti: {calc.unusedLeaveDays} Hari ({formatRupiah(calc.unusedLeaveAmount)}) + Transport ({formatRupiah(calc.returnTravelAmount + calc.otherCompensation)})
              </p>
            </div>
            <p className="font-black text-sm text-blue-400 font-mono">
              {formatRupiah(calc.unusedLeaveAmount + calc.returnTravelAmount + calc.otherCompensation)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <PrimaryButton
          onClick={() => generateSeverancePdf(calc)}
          icon={Printer}
          className="w-full sm:w-auto flex-1 py-3"
        >
          CETAK DOKUMEN PDF
        </PrimaryButton>

        <SecondaryButton
          onClick={() => onSaveHistory(calc)}
          disabled={isSaving || isSaved}
          icon={isSaved ? CheckCircle2 : Save}
          className={`w-full sm:w-auto flex-1 py-3 ${isSaved ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : ''}`}
        >
          {isSaved ? 'TERSIMPAN DI HISTORI' : isSaving ? 'MENYIMPAN...' : 'SIMPAN KE HISTORI'}
        </SecondaryButton>

        <SecondaryButton
          onClick={onReset}
          icon={RefreshCw}
          className="w-full sm:w-auto py-3"
        >
          SIMULASI LAIN
        </SecondaryButton>
      </div>

      {/* Formula Modal */}
      <SeveranceFormulaModal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        calc={calc}
      />
    </div>
  );
};
