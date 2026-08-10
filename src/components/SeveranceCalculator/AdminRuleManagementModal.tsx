import React, { useState } from 'react';
import { X, ShieldCheck, Edit3, Save, CheckCircle2, AlertTriangle, Table } from 'lucide-react';
import { PkbRuleConfig, DEFAULT_PKB_RULE } from '../../types/severance';
import { ModalPortal } from '../ModalPortal';
import { SeveranceService } from '../../services/severanceService';
import { UserAccount } from '../../types';

interface AdminRuleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRule: PkbRuleConfig;
  onRuleUpdated: (rule: PkbRuleConfig) => void;
  currentUser: UserAccount;
}

export const AdminRuleManagementModal: React.FC<AdminRuleManagementModalProps> = ({
  isOpen,
  onClose,
  activeRule,
  onRuleUpdated,
  currentUser
}) => {
  const [versionName, setVersionName] = useState(activeRule.versionName || 'PKB PT VCI 2024-2026');
  const [effectiveFrom, setEffectiveFrom] = useState(activeRule.effectiveFrom || '2024-01-01');
  const [effectiveUntil, setEffectiveUntil] = useState(activeRule.effectiveUntil || '2026-12-31');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedRule: PkbRuleConfig = {
        ...activeRule,
        versionName,
        effectiveFrom,
        effectiveUntil,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name
      };

      await SeveranceService.savePkbRule(updatedRule, currentUser);
      onRuleUpdated(updatedRule);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save PKB rule', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9998] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-xl w-full p-5 sm:p-6 text-white shadow-2xl relative my-auto space-y-5 animate-scaleUp">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base uppercase tracking-wider text-white">
                  PENGATURAN &amp; VERSI ATURAN PKB
                </h3>
                <p className="text-xs text-slate-400">
                  Pengelolaan versi PKB &amp; matriks perhitungan Pasal 77 (Super Admin)
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

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200 uppercase tracking-wider">
                Nama Versi PKB Diberlakukan
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 uppercase tracking-wider">
                  Berlaku Efektif Sejak
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 uppercase tracking-wider">
                  Berlaku Sampai
                </label>
                <input
                  type="date"
                  value={effectiveUntil}
                  onChange={(e) => setEffectiveUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-1">
              <p className="font-bold text-slate-300 flex items-center gap-1.5">
                <Table className="w-4 h-4 text-amber-400" /> Matriks Pasal 77 PKB PT Victory Chingluh Indonesia:
              </p>
              <p className="text-[11px] text-slate-400">
                • Tabel Pesangon: 1-9 bulan upah (Maks 8+ thn)<br />
                • Tabel UPMK: 2-10 bulan upah (Maks 24+ thn)<br />
                • UPH 15%: Berlaku untuk alasan Efisiensi, Pensiun, Meninggal, Pailit, Sakit
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Konfigurasi aturan PKB berhasil diperbarui dan dicatat di audit log.
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
