import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  X, 
  Activity, 
  Gauge, 
  Car, 
  Fuel,
  Sparkles,
  UserCheck 
} from 'lucide-react';
import { VehicleLog, VehicleReturnChecklist, UserAccount } from '../../types';
import { getDefaultReturnChecklist, calculateDistanceKm } from '../../utils/vehicleUtils';

interface VehicleReturnModalProps {
  log: VehicleLog;
  currentUser: UserAccount;
  onCompleteTrip: (logId: string, returnData: VehicleReturnChecklist, diserahkanOleh: string, diterimaOleh: string) => Promise<void>;
  onClose: () => void;
}

export const VehicleReturnModal: React.FC<VehicleReturnModalProps> = ({
  log,
  currentUser,
  onCompleteTrip,
  onClose,
}) => {
  const kmAwal = log.kmAwal || (log.kendaraan.includes('Xpander') ? 28450 : 34120);

  const [kmAkhir, setKmAkhir] = useState<number>(() => {
    return log.kmAkhir || (kmAwal + 35);
  });

  const [kondisiKendaraan, setKondisiKendaraan] = useState<'Baik' | 'Bermasalah'>('Baik');
  const [kebersihan, setKebersihan] = useState<'Bersih' | 'Perlu Dicuci'>('Bersih');
  const [bbm, setBbm] = useState<string>('3/4 Tank');
  const [adaKerusakan, setAdaKerusakan] = useState<boolean>(false);
  const [penjelasanKerusakan, setPenjelasanKerusakan] = useState('');
  const [fotoKerusakanUrl, setFotoKerusakanUrl] = useState('');
  const [catatan, setCatatan] = useState('');

  // Serah Terima
  const [diserahkanOleh, setDiserahkanOleh] = useState(log.driverNama || log.namaPemakai || '');
  const [diterimaOleh, setDiterimaOleh] = useState(currentUser.name || 'Pengurus Pos Piket');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto distance calculation
  const jarakKm = useMemo(() => {
    return calculateDistanceKm(kmAwal, kmAkhir);
  }, [kmAwal, kmAkhir]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoKerusakanUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmAkhir || kmAkhir < kmAwal) {
      setErrorMsg(`Angka KM Akhir (${kmAkhir}) tidak boleh lebih kecil dari KM Awal (${kmAwal}).`);
      return;
    }

    if (adaKerusakan && !penjelasanKerusakan.trim()) {
      setErrorMsg('Harap jelaskan rincian kendala/kerusakan pada kendaraan.');
      return;
    }

    if (!diterimaOleh.trim()) {
      setErrorMsg('Harap tentukan nama penerima serah terima.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    try {
      const returnChecklist: VehicleReturnChecklist = {
        kondisiKendaraan: adaKerusakan ? 'Bermasalah' : kondisiKendaraan,
        kebersihan,
        bbm,
        adaKerusakan,
        penjelasanKerusakan: adaKerusakan ? penjelasanKerusakan.trim() : undefined,
        fotoKerusakanUrl: fotoKerusakanUrl || undefined,
        kmAkhir: Number(kmAkhir),
        catatan: catatan.trim(),
      };

      await onCompleteTrip(log.id, returnChecklist, diserahkanOleh.trim(), diterimaOleh.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses pengembalian kendaraan');
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
            <div className="p-3 rounded-2xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Pengembalian Kendaraan & Serah Terima</h2>
              <p className="text-xs text-slate-400">Pencatatan KM akhir, kondisi fisik, dan serah terima kunci</p>
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

        {/* Info Banner */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono text-slate-500">{log.nomorLog}</span>
            <h4 className="font-bold text-white text-sm">{log.kendaraan}</h4>
            <p className="text-slate-400 mt-0.5">Kegiatan: <strong>{log.kegiatan || log.tujuan}</strong></p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">KM Awal:</span>
            <span className="font-mono font-bold text-slate-200 text-sm">{kmAwal.toLocaleString('id-ID')} KM</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* KM Akhir & Auto Distance Calculation Card */}
          <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  <span>KM Akhir Saat Kembali <span className="text-red-400">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={kmAkhir}
                    onChange={(e) => setKmAkhir(Number(e.target.value))}
                    min={kmAwal}
                    className="w-full bg-slate-900 border border-indigo-900/60 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    KM
                  </span>
                </div>
              </div>

              {/* Automatic Distance Display */}
              <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase font-black tracking-wider block">
                    Jarak Tempuh Otomatis
                  </span>
                  <p className="text-xl font-black text-indigo-200 font-mono mt-0.5">
                    {jarakKm} KM
                  </p>
                </div>
                <div className="p-2.5 bg-indigo-900/50 rounded-xl text-indigo-300">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Kondisi, Kebersihan & BBM */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Kondisi Kendaraan Saat Kembali
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Posisi BBM</label>
                <select
                  value={bbm}
                  onChange={(e) => setBbm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Full Tank">Full Tank</option>
                  <option value="3/4 Tank">3/4 Tank</option>
                  <option value="1/2 Tank">1/2 Tank</option>
                  <option value="1/4 Tank">1/4 Tank</option>
                  <option value="Perlu Diisi">⚠️ Perlu Diisi Segera</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Kebersihan Mobil</label>
                <select
                  value={kebersihan}
                  onChange={(e) => setKebersihan(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Bersih">✓ Bersih</option>
                  <option value="Perlu Dicuci">⚠️ Perlu Dicuci</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Ada Kerusakan/Kendala?</label>
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAdaKerusakan(false)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      !adaKerusakan
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    Tidak
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdaKerusakan(true)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      adaKerusakan
                        ? 'bg-red-950 text-red-300 border-red-600'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    Ada ⚠️
                  </button>
                </div>
              </div>
            </div>

            {/* Kerusakan Detail If Any */}
            {adaKerusakan && (
              <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-2xl space-y-3 animate-fade-in mt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Jelaskan Kerusakan / Kendala Kendaraan <span className="text-red-400">*</span></span>
                  </label>
                  <textarea
                    value={penjelasanKerusakan}
                    onChange={(e) => setPenjelasanKerusakan(e.target.value)}
                    placeholder="Contoh: Ban belakang kanan tertusuk paku / baret sisi kiri saat parkir..."
                    rows={2}
                    className="w-full bg-slate-900 border border-red-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-red-400/80">
                    Sistem otomatis menandai armada ini sebagai <strong>"Perlu Diperiksa"</strong> agar diperbaiki sebelum dipakai peminjam berikutnya.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-red-400" />
                    <span>Foto Bukti Kerusakan (Opsional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 cursor-pointer"
                  />
                  {fotoKerusakanUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-red-900/60 max-h-28">
                      <img src={fotoKerusakanUrl} alt="Foto Kerusakan" className="w-full h-28 object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Serah Terima Kunci */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Serah Terima Kunci & Kendaraan</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Diserahkan Oleh</label>
                <input
                  type="text"
                  value={diserahkanOleh}
                  onChange={(e) => setDiserahkanOleh(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Diterima Oleh (Petugas / Pengurus)</label>
                <input
                  type="text"
                  value={diterimaOleh}
                  onChange={(e) => setDiterimaOleh(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-300">Catatan Perjalanan (Opsional)</label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan tambahan saat selesai perjalanan..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
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
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Menyimpan...' : 'SERAH TERIMA & SELESAI'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
