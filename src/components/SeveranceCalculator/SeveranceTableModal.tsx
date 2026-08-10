import React from 'react';
import { X, Table, FileText, CheckCircle2 } from 'lucide-react';
import { DEFAULT_SEVERANCE_BRACKETS, DEFAULT_UPMK_BRACKETS } from '../../types/severance';
import { formatRupiah } from '../../utils/currencyFormatter';
import { ModalPortal } from '../ModalPortal';

interface SeveranceTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseSalary?: number;
}

export const SeveranceTableModal: React.FC<SeveranceTableModalProps> = ({
  isOpen,
  onClose,
  baseSalary = 5000000
}) => {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9998] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-3xl w-full p-5 sm:p-6 text-white shadow-2xl relative my-auto space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto scrollbar-thin">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-500/40 flex items-center justify-center text-red-400">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base uppercase tracking-wider text-white">
                  TABEL ACUAN PASAL 77 PKB PT VCI
                </h3>
                <p className="text-xs text-slate-400">
                  Matrix Hak Uang Pesangon (UP) &amp; Uang Penghargaan Masa Kerja (UPMK)
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

          <div className="p-3 bg-slate-950 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center justify-between">
            <span>Simulasi Nilai Rupiah Berdasarkan Upah Dasar: <strong className="text-emerald-400">{formatRupiah(baseSalary)}</strong></span>
            <span className="text-[10px] text-slate-400">PKB PT VCI 2024-2026</span>
          </div>

          {/* Severance Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> 1. TABEL UANG PESANGON (UP)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-300 uppercase font-bold text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Kategori Masa Kerja</th>
                    <th className="p-2.5 text-center">Jumlah Bulan Upah</th>
                    <th className="p-2.5 text-right">Nilai 1x UP (Rp)</th>
                    <th className="p-2.5 text-right">Nilai 2x UP (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {DEFAULT_SEVERANCE_BRACKETS.map((b, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-bold font-sans text-slate-200">{b.label}</td>
                      <td className="p-2.5 text-center font-bold text-red-400">{b.months} Bulan</td>
                      <td className="p-2.5 text-right text-slate-300">{formatRupiah(b.months * baseSalary)}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">{formatRupiah(b.months * baseSalary * 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* UPMK Table */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> 2. TABEL UANG PENGHARGAAN MASA KERJA (UPMK)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-300 uppercase font-bold text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Kategori Masa Kerja</th>
                    <th className="p-2.5 text-center">Jumlah Bulan Upah</th>
                    <th className="p-2.5 text-right">Nilai UPMK (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {DEFAULT_UPMK_BRACKETS.map((b, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-bold font-sans text-slate-200">{b.label}</td>
                      <td className="p-2.5 text-center font-bold text-amber-400">{b.months} Bulan</td>
                      <td className="p-2.5 text-right text-slate-300">{formatRupiah(b.months * baseSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              Tutup Tabel
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
