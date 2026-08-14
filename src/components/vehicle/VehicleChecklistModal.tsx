import React, { useState } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  X, 
  Activity, 
  Gauge, 
  ClipboardCheck, 
  Car, 
  Fuel 
} from 'lucide-react';
import { VehicleLog, VehicleChecklistItems, UserAccount } from '../../types';
import { getDefaultPreChecklist } from '../../utils/vehicleUtils';

interface VehicleChecklistModalProps {
  log: VehicleLog;
  currentUser: UserAccount;
  onStartTrip: (logId: string, checklist: VehicleChecklistItems, kmAwal: number, fotoAwalUrl?: string) => Promise<void>;
  onClose: () => void;
}

export const VehicleChecklistModal: React.FC<VehicleChecklistModalProps> = ({
  log,
  currentUser,
  onStartTrip,
  onClose,
}) => {
  const [checklist, setChecklist] = useState<VehicleChecklistItems>(() => {
    return log.checklistAwal || getDefaultPreChecklist();
  });

  const [kmAwal, setKmAwal] = useState<number>(() => {
    return log.kmAwal || (log.kendaraan.includes('Xpander') ? 28450 : 34120);
  });

  const [fotoAwalUrl, setFotoAwalUrl] = useState<string>(log.fotoAwalUrl || '');
  const [catatan, setCatatan] = useState<string>(checklist.catatan || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoAwalUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmAwal || kmAwal <= 0) {
      setErrorMsg('Harap masukkan angka odometer (KM Awal) saat ini.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    try {
      const finalChecklist: VehicleChecklistItems = {
        ...checklist,
        catatan: catatan.trim(),
      };
      await onStartTrip(log.id, finalChecklist, Number(kmAwal), fotoAwalUrl);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memulai perjalanan');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Pemeriksaan Kendaraan Sebelum Berangkat</h2>
              <p className="text-xs text-slate-400">SOP Standar Keamanan & Kelayakan Armada</p>
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

        {/* Vehicle summary banner */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono text-slate-500">{log.nomorLog}</span>
            <h4 className="font-bold text-white text-sm">{log.kendaraan} ({log.platNomor || 'Inventaris SBN'})</h4>
            <p className="text-slate-400 mt-0.5">Tujuan: <strong>{log.tujuan}</strong> • Driver: <strong>{log.driverNama || log.namaPemakai}</strong></p>
          </div>
          <span className="px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full font-bold">
            Tahap Siap Berangkat
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          
          {/* KM Awal Input */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-black text-indigo-300 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span>Odometer / KM Awal Saat Berangkat <span className="text-red-400">*</span></span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={kmAwal}
                onChange={(e) => setKmAwal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-indigo-900/60 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:border-indigo-500 focus:outline-none"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                KM
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Catat angka kilometer yang tertera pada speedometer sebelum mobil dijalankan.
            </p>
          </div>

          {/* 10 Checklist Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              10 Poin Pemeriksaan Fisik & Keamanan SOP
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Ban */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">1. Tekanan & Kondisi Ban</span>
                <select
                  value={checklist.ban}
                  onChange={(e) => setChecklist({ ...checklist, ban: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Baik">✓ Baik</option>
                  <option value="Bermasalah">⚠️ Bermasalah</option>
                </select>
              </div>

              {/* Rem */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">2. Fungsi Pengereman</span>
                <select
                  value={checklist.rem}
                  onChange={(e) => setChecklist({ ...checklist, rem: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Baik">✓ Baik</option>
                  <option value="Bermasalah">⚠️ Bermasalah</option>
                </select>
              </div>

              {/* Lampu */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">3. Lampu Utama & Sein</span>
                <select
                  value={checklist.lampu}
                  onChange={(e) => setChecklist({ ...checklist, lampu: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Baik">✓ Baik</option>
                  <option value="Bermasalah">⚠️ Bermasalah</option>
                </select>
              </div>

              {/* Oli */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">4. Oli Mesin</span>
                <select
                  value={checklist.oli}
                  onChange={(e) => setChecklist({ ...checklist, oli: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Baik">✓ Baik</option>
                  <option value="Bermasalah">⚠️ Bermasalah</option>
                </select>
              </div>

              {/* Air Radiator */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">5. Air Radiator & Wiper</span>
                <select
                  value={checklist.airRadiator}
                  onChange={(e) => setChecklist({ ...checklist, airRadiator: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Baik">✓ Baik</option>
                  <option value="Bermasalah">⚠️ Bermasalah</option>
                </select>
              </div>

              {/* BBM */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">6. Posisi BBM</span>
                <select
                  value={checklist.bbm}
                  onChange={(e) => setChecklist({ ...checklist, bbm: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Full Tank">Full Tank</option>
                  <option value="3/4 Tank">3/4 Tank</option>
                  <option value="1/2 Tank">1/2 Tank</option>
                  <option value="1/4 Tank">1/4 Tank</option>
                </select>
              </div>

              {/* Kebersihan */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">7. Kebersihan Kabin</span>
                <select
                  value={checklist.kebersihan}
                  onChange={(e) => setChecklist({ ...checklist, kebersihan: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Bersih">✓ Bersih</option>
                  <option value="Perlu Dicuci">Perlu Dicuci</option>
                </select>
              </div>

              {/* Perlengkapan */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">8. Dongkrak & Serep</span>
                <select
                  value={checklist.perlengkapan}
                  onChange={(e) => setChecklist({ ...checklist, perlengkapan: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Lengkap">✓ Lengkap</option>
                  <option value="Kurang">Kurang</option>
                </select>
              </div>

              {/* Dokumen */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">9. Dokumen / STNK</span>
                <select
                  value={checklist.dokumen}
                  onChange={(e) => setChecklist({ ...checklist, dokumen: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Lengkap (STNK Ada)">✓ Ada di Laci</option>
                  <option value="Bermasalah">⚠️ Bermasalah</option>
                </select>
              </div>

              {/* Fisik Bodi */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">10. Bodi Luar</span>
                <select
                  value={checklist.kondisiFisik}
                  onChange={(e) => setChecklist({ ...checklist, kondisiFisik: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="Baik">✓ Baik</option>
                  <option value="Ada Baret/Penyok">Ada Baret/Penyok</option>
                </select>
              </div>
            </div>
          </div>

          {/* Foto & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Foto Kondisi Kendaraan (Opsional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              {fotoAwalUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 max-h-28">
                  <img src={fotoAwalUrl} alt="Kondisi Awal" className="w-full h-28 object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Catatan Kondisi Awal
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan tambahan kondisi kendaraan sebelum berangkat..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
            >
              <Key className="w-4 h-4" />
              <span>{isProcessing ? 'Menyimpan...' : 'MULAI PERJALANAN'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
