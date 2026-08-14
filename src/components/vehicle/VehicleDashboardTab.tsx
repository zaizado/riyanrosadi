import React from 'react';
import { 
  Car, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  ArrowRight, 
  Key, 
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { VehicleLog, UserAccount, Member } from '../../types';
import { DEFAULT_FLEET, getVehicleFleetStatus, calculateDistanceKm } from '../../utils/vehicleUtils';
import { exportVehicleLogsToExcel } from '../../lib/excelExport';

interface VehicleDashboardTabProps {
  vehicleLogs: VehicleLog[];
  currentUser: UserAccount;
  onNavigateTab: (tab: 'dashboard' | 'request' | 'schedule' | 'history') => void;
  onOpenChecklistModal: (log: VehicleLog) => void;
  onOpenReturnModal: (log: VehicleLog) => void;
  onOpenApproveModal: (log: VehicleLog) => void;
  onOpenManageFleet: () => void;
  onSelectLogDetail: (log: VehicleLog) => void;
}

export const VehicleDashboardTab: React.FC<VehicleDashboardTabProps> = ({
  vehicleLogs,
  currentUser,
  onNavigateTab,
  onOpenChecklistModal,
  onOpenReturnModal,
  onOpenApproveModal,
  onOpenManageFleet,
  onSelectLogDetail,
}) => {
  const isSuperAdminOrPengurus = 
    currentUser.role === 'Super Admin' || 
    currentUser.role === 'Pengurus' ||
    currentUser.role === 'Admin';

  // Ongoing active trips (Sedang Digunakan / Siap Digunakan)
  const activeTrips = vehicleLogs.filter(
    l => l.status === 'Sedang Digunakan' || l.status === 'Siap Digunakan'
  );

  // Pending approval requests
  const pendingApprovals = vehicleLogs.filter(l => l.status === 'Menunggu Persetujuan');

  // Upcoming approved trips
  const upcomingTrips = vehicleLogs.filter(l => l.status === 'Disetujui');

  return (
    <div className="space-y-6 animate-fade-in text-white">
      
      {/* SOP Status Bar & Quick Actions */}
      <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200">
              Alur SOP: Ajukan → Disetujui → Pakai → Kembali → Selesai
            </span>
            <p className="text-[11px] text-slate-400">
              Khusus operasional organisasi, koordinasi advokasi, dan pengawalan anggota sakit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {isSuperAdminOrPengurus && (
            <button
              type="button"
              onClick={onOpenManageFleet}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Kelola Armada</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => exportVehicleLogsToExcel(vehicleLogs)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Ekspor Seluruh Riwayat ke Format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Kondisi Kendaraan Sekarang (Mobil 1 & Mobil 2) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Kondisi Kendaraan Sekarang</span>
            </h2>
            <p className="text-xs text-slate-400">Status ketersediaan langsung armada operasional serikat</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_FLEET.map((fleetItem, index) => {
            const statusInfo = getVehicleFleetStatus(fleetItem.name, vehicleLogs);

            return (
              <div 
                key={fleetItem.name}
                className={`p-5 rounded-3xl border transition-all relative overflow-hidden shadow-lg ${
                  statusInfo.conditionStatus === 'Sedang Digunakan'
                    ? 'bg-slate-900/90 border-blue-600/70 shadow-blue-950/40'
                    : statusInfo.conditionStatus === 'Perlu Diperiksa'
                    ? 'bg-slate-900/90 border-amber-500/70 shadow-amber-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-white">{fleetItem.label}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 font-bold">
                          {fleetItem.platNomor}
                        </span>
                        <span>•</span>
                        <span>{fleetItem.kapasitas}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="text-right">
                    <span 
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${
                        statusInfo.conditionStatus === 'Sedang Digunakan'
                          ? 'bg-blue-950 text-blue-300 border-blue-700'
                          : statusInfo.conditionStatus === 'Perlu Diperiksa'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      }`}
                    >
                      {statusInfo.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Status Detail Body */}
                <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      Lokasi Parkir:
                    </span>
                    <span className="font-bold text-slate-200">
                      Pos {statusInfo.currentLocation}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      Odometer Terakhir:
                    </span>
                    <span className="font-bold font-mono text-slate-200">
                      {statusInfo.kmTerakhir.toLocaleString('id-ID')} KM
                    </span>
                  </div>

                  {statusInfo.conditionStatus === 'Sedang Digunakan' && statusInfo.activeLog && (
                    <div className="pt-2 border-t border-slate-800/80 mt-2">
                      <p className="text-[11px] text-blue-300 font-semibold mb-1">
                        Sedang digunakan oleh: <strong>{statusInfo.activeLog.namaPemakai}</strong> ({statusInfo.activeLog.departemenPemakai})
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Tujuan: {statusInfo.activeLog.tujuan} • Driver: {statusInfo.activeLog.driverNama || '-'}
                      </p>
                    </div>
                  )}

                  {statusInfo.conditionStatus === 'Perlu Diperiksa' && (
                    <div className="pt-2 border-t border-slate-800/80 mt-2 flex items-start gap-2 text-amber-300 text-[11px]">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>{statusInfo.kerusakanCatatan}</span>
                    </div>
                  )}
                </div>

                {/* Action footer per vehicle */}
                <div className="mt-4 flex items-center justify-between gap-2 pt-1">
                  {statusInfo.conditionStatus === 'Sedang Digunakan' && statusInfo.activeLog ? (
                    <button
                      type="button"
                      onClick={() => onOpenReturnModal(statusInfo.activeLog!)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>KENDARAAN SUDAH KEMBALI</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('request')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Ajukan Penggunaan Mobil Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Approvals Quick Alert (for PIC & Pengurus) */}
      {isSuperAdminOrPengurus && pendingApprovals.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-700/60 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h3 className="font-black text-sm">Menunggu Persetujuan ({pendingApprovals.length} Pengajuan)</h3>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs text-amber-400 hover:text-amber-200 font-bold underline"
            >
              Lihat di Tab Jadwal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingApprovals.slice(0, 3).map((req) => (
              <div 
                key={req.id}
                className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[150px]">{req.namaPemakai}</span>
                  {req.isUrgent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-red-300 border border-red-800">
                      🚨 URGENT
                    </span>
                  )}
                </div>
                <p className="text-slate-400 truncate">Kegiatan: {req.kegiatan || req.tujuan}</p>
                <p className="text-slate-500 font-mono text-[11px]">
                  {req.tanggalMulai} • {req.jamMulai}–{req.jamSelesai}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenApproveModal(req)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
                >
                  Proses Persetujuan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Ongoing Trips */}
      {activeTrips.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
          <h3 className="font-black text-sm text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span>Perjalanan Yang Sedang Berlangsung ({activeTrips.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeTrips.map((trip) => (
              <div 
                key={trip.id}
                className="bg-slate-950 border border-blue-900/50 p-4 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-300 text-sm">{trip.kendaraan}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Sedang Digunakan
                  </span>
                </div>
                <p className="text-white font-semibold">
                  {trip.namaPemakai} ({trip.departemenPemakai})
                </p>
                <p className="text-slate-400">
                  Tujuan: <strong>{trip.tujuan}</strong>
                </p>
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px] pt-1">
                  <span>Driver: {trip.driverNama || trip.namaPemakai}</span>
                  <span>KM Awal: {trip.kmAwal?.toLocaleString('id-ID') || '-'}</span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenReturnModal(trip)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all"
                  >
                    Kendaraan Sudah Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectLogDetail(trip)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Approved Trips Preview */}
      {upcomingTrips.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Jadwal Penggunaan Mendatang ({upcomingTrips.length})</span>
            </h3>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs text-indigo-400 hover:text-indigo-200 font-bold"
            >
              Lihat Seluruh Jadwal →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingTrips.slice(0, 3).map((up) => (
              <div 
                key={up.id}
                className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{up.kendaraan}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Disetujui
                  </span>
                </div>
                <p className="text-slate-300 font-medium truncate">{up.namaPemakai} - {up.kegiatan || up.tujuan}</p>
                <p className="text-slate-500 font-mono text-[11px]">
                  📅 {up.tanggalMulai} • ⏰ {up.jamMulai}–{up.jamSelesai}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenChecklistModal(up)}
                  className="w-full mt-1.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Cek Kendaraan & Berangkat</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guide SOP 5 Langkah */}
      <div className="bg-slate-900/50 border border-slate-800/70 p-5 rounded-3xl space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          5 Langkah Alur Penggunaan Kendaraan SBN KASBI
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-indigo-300 font-black text-xs inline-flex items-center justify-center">1</span>
            <p className="font-black text-xs text-white">AJUKAN</p>
            <p className="text-[10px] text-slate-400">Isi kegiatan, tujuan, & jam</p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 font-black text-xs inline-flex items-center justify-center">2</span>
            <p className="font-black text-xs text-white">TUNGGU</p>
            <p className="text-[10px] text-slate-400">Persetujuan & driver PIC</p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-300 font-black text-xs inline-flex items-center justify-center">3</span>
            <p className="font-black text-xs text-white">PAKAI</p>
            <p className="text-[10px] text-slate-400">Cek kondisi & mulai jalan</p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-300 font-black text-xs inline-flex items-center justify-center">4</span>
            <p className="font-black text-xs text-white">KEMBALI</p>
            <p className="text-[10px] text-slate-400">Cek KM & serahkan kunci</p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-300 font-black text-xs inline-flex items-center justify-center">5</span>
            <p className="font-black text-xs text-white">SELESAI</p>
            <p className="text-[10px] text-slate-400">Otomatis masuk riwayat</p>
          </div>
        </div>
      </div>

    </div>
  );
};
