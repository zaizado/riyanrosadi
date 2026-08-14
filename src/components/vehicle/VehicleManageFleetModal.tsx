import React, { useState } from 'react';
import { 
  X, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  SlidersHorizontal,
  MapPin,
  Activity,
  Gauge
} from 'lucide-react';
import { VehicleLog, UserAccount, VehicleConditionStatus } from '../../types';
import { DEFAULT_FLEET, getVehicleFleetStatus } from '../../utils/vehicleUtils';

interface VehicleManageFleetModalProps {
  vehicleLogs: VehicleLog[];
  currentUser: UserAccount;
  onUpdateVehicleMaintenance?: (vehicleName: string, status: VehicleConditionStatus, catatan?: string) => Promise<void>;
  onClose: () => void;
}

export const VehicleManageFleetModal: React.FC<VehicleManageFleetModalProps> = ({
  vehicleLogs,
  currentUser,
  onUpdateVehicleMaintenance,
  onClose,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Mitsubishi Xpander');
  const [maintenanceStatus, setMaintenanceStatus] = useState<VehicleConditionStatus>('Tersedia');
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateVehicleMaintenance) {
      onClose();
      return;
    }

    setIsProcessing(true);
    setSuccessMsg('');
    try {
      await onUpdateVehicleMaintenance(selectedVehicle, maintenanceStatus, catatanPerbaikan.trim());
      setSuccessMsg(`Status armada ${selectedVehicle} berhasil diperbarui.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Kelola Armada & Servis Kendaraan</h2>
              <p className="text-xs text-slate-400">Pengaturan kesiapan operasional dan pencatatan perbaikan</p>
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

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Fleet Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEFAULT_FLEET.map((fleet) => {
            const statusInfo = getVehicleFleetStatus(fleet.name, vehicleLogs);
            const isSelected = selectedVehicle === fleet.name;

            return (
              <div
                key={fleet.name}
                onClick={() => {
                  setSelectedVehicle(fleet.name);
                  setMaintenanceStatus(statusInfo.conditionStatus);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-400">{fleet.platNomor}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    statusInfo.conditionStatus === 'Sedang Digunakan'
                      ? 'bg-blue-950 text-blue-300 border-blue-700'
                      : statusInfo.conditionStatus === 'Perlu Diperiksa'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  }`}>
                    {statusInfo.statusLabel}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-white">{fleet.label}</h4>
                <p className="text-[11px] text-slate-400">Pos: {statusInfo.currentLocation} • Odometer: {statusInfo.kmTerakhir.toLocaleString('id-ID')} KM</p>
              </div>
            );
          })}
        </div>

        {/* Maintenance Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">
            Perbarui Kesiapan Armada ({selectedVehicle})
          </h4>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Status Kesiapan Kendaraan</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Tersedia', label: '🟢 Siap / Tersedia', color: 'emerald' },
                { id: 'Perlu Diperiksa', label: '🟠 Perlu Diperiksa', color: 'amber' },
                { id: 'Dalam Perbaikan', label: '🔴 Masuk Bengkel', color: 'red' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setMaintenanceStatus(s.id as any)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                    maintenanceStatus === s.id
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Catatan Kondisi / Riwayat Servis (Opsional)
            </label>
            <textarea
              value={catatanPerbaikan}
              onChange={(e) => setCatatanPerbaikan(e.target.value)}
              placeholder="Contoh: Sudah selesai ganti oli dan balancing ban di bengkel rekanan..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
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
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-lg cursor-pointer"
            >
              {isProcessing ? 'Menyimpan...' : 'Simpan Status Armada'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
