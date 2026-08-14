import React, { useState } from 'react';
import { 
  Car, 
  PlusCircle, 
  Calendar, 
  History, 
  SlidersHorizontal, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { 
  VehicleLog, 
  Member, 
  UserAccount, 
  VehicleConditionStatus,
  VehicleChecklistItems,
  VehicleReturnChecklist
} from '../types';
import { calculateDistanceKm } from '../utils/vehicleUtils';
import { VehicleDashboardTab } from './vehicle/VehicleDashboardTab';
import { VehicleRequestFormTab } from './vehicle/VehicleRequestFormTab';
import { VehicleScheduleTab } from './vehicle/VehicleScheduleTab';
import { VehicleHistoryTab } from './vehicle/VehicleHistoryTab';
import { VehicleChecklistModal } from './vehicle/VehicleChecklistModal';
import { VehicleReturnModal } from './vehicle/VehicleReturnModal';
import { VehicleApproveModal } from './vehicle/VehicleApproveModal';
import { VehicleDetailModal } from './vehicle/VehicleDetailModal';
import { VehicleManageFleetModal } from './vehicle/VehicleManageFleetModal';

interface VehicleManagerProps {
  vehicleLogs: VehicleLog[];
  members: Member[];
  users: UserAccount[];
  currentUser: UserAccount;
  onAddLog: (log: VehicleLog) => Promise<void>;
  onUpdateLog: (log: VehicleLog) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({
  vehicleLogs,
  members,
  users,
  currentUser,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
}) => {
  // 4 Primary Menu Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'request' | 'schedule' | 'history'>('dashboard');

  // Interactive Modals State
  const [selectedDetailLog, setSelectedDetailLog] = useState<VehicleLog | null>(null);
  const [checklistModalLog, setChecklistModalLog] = useState<VehicleLog | null>(null);
  const [returnModalLog, setReturnModalLog] = useState<VehicleLog | null>(null);
  const [approveModalLog, setApproveModalLog] = useState<VehicleLog | null>(null);
  const [isManageFleetOpen, setIsManageFleetOpen] = useState(false);

  // Quick notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Workflow Action 1: Submit Request (AJUKAN -> Menunggu Persetujuan)
  const handleSubmitRequest = async (newLog: VehicleLog) => {
    await onAddLog(newLog);
    showToast(`Pengajuan kendaraan nomor ${newLog.nomorLog} berhasil dibuat.`);
  };

  // Workflow Action 2: Approve & Assign Driver (DISETUJUI)
  const handleApproveLog = async (
    logId: string, 
    driverNama: string, 
    driverKontak: string, 
    catatan?: string
  ) => {
    const target = vehicleLogs.find(v => v.id === logId);
    if (!target) return;

    const updated: VehicleLog = {
      ...target,
      status: 'Disetujui',
      driverNama,
      driverKontak,
      disetujuiOleh: currentUser.name || 'Pengurus Kendaraan',
      tanggalDisetujui: new Date().toISOString(),
      catatan: catatan ? `${target.catatan ? target.catatan + ' | ' : ''}${catatan}` : target.catatan,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateLog(updated);
    showToast(`Pengajuan ${target.nomorLog} telah disetujui. Driver: ${driverNama}`);
  };

  // Workflow Action 2b: Reject (Ditolak)
  const handleRejectLog = async (logId: string, alasanPenolakan: string) => {
    const target = vehicleLogs.find(v => v.id === logId);
    if (!target) return;

    const updated: VehicleLog = {
      ...target,
      status: 'Ditolak',
      alasanPenolakan,
      ditolakOleh: currentUser.name || 'Pengurus',
      tanggalDitolak: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onUpdateLog(updated);
    showToast(`Pengajuan ${target.nomorLog} telah ditolak.`);
  };

  // Workflow Action 3: Pre-Trip Inspection & Start (PAKAI -> Sedang Digunakan)
  const handleStartTrip = async (
    logId: string, 
    checklist: VehicleChecklistItems, 
    kmAwal: number, 
    fotoAwalUrl?: string
  ) => {
    const target = vehicleLogs.find(v => v.id === logId);
    if (!target) return;

    const updated: VehicleLog = {
      ...target,
      status: 'Sedang Digunakan',
      checklistAwal: checklist,
      kmAwal,
      fotoAwalUrl,
      waktuMulaiPerjalanan: new Date().toISOString(),
      kondisiAwal: `KM: ${kmAwal} • BBM: ${checklist.bbm} • Fisik: ${checklist.kondisiFisik}`,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateLog(updated);
    showToast(`Pemeriksaan selesai. Kendaraan ${target.kendaraan} sekarang berstatus "Sedang Digunakan".`);
  };

  // Workflow Action 4: Return & Complete (KEMBALI -> Selesai / Sudah Kembali)
  const handleCompleteTrip = async (
    logId: string, 
    returnData: VehicleReturnChecklist, 
    diserahkanOleh: string, 
    diterimaOleh: string
  ) => {
    const target = vehicleLogs.find(v => v.id === logId);
    if (!target) return;

    const kmAwal = target.kmAwal || 0;
    const jarakTempuhKm = calculateDistanceKm(kmAwal, returnData.kmAkhir);

    const updated: VehicleLog = {
      ...target,
      status: returnData.adaKerusakan ? 'Perlu Diperiksa' : 'Selesai',
      checklistAkhir: returnData,
      kmAkhir: returnData.kmAkhir,
      jarakTempuhKm,
      adaKerusakan: returnData.adaKerusakan,
      penjelasanKerusakan: returnData.penjelasanKerusakan,
      fotoAkhirUrl: returnData.fotoKerusakanUrl,
      kondisiKembali: `KM Akhir: ${returnData.kmAkhir} (${jarakTempuhKm} KM) • BBM: ${returnData.bbm}${returnData.adaKerusakan ? ' • ⚠️ Ada Kerusakan' : ' • Kondisi Baik'}`,
      waktuKembali: new Date().toISOString(),
      diserahkanOleh,
      diterimaOleh,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateLog(updated);
    showToast(`Pengembalian selesai. Jarak tempuh: ${jarakTempuhKm} KM.`);
  };

  // Maintenance & Fleet Update (Super Admin / Pengurus)
  const handleUpdateVehicleMaintenance = async (
    vehicleName: string, 
    conditionStatus: VehicleConditionStatus, 
    catatan?: string
  ) => {
    // If setting to 'Tersedia', resolve any existing 'Perlu Diperiksa' logs for this vehicle
    if (conditionStatus === 'Tersedia') {
      const activeIssueLog = vehicleLogs.find(
        l => l.kendaraan === vehicleName && (l.status === 'Perlu Diperiksa' || l.adaKerusakan) && !l.isArchived
      );
      if (activeIssueLog) {
        const resolved: VehicleLog = {
          ...activeIssueLog,
          status: 'Selesai',
          adaKerusakan: false,
          catatan: `${activeIssueLog.catatan ? activeIssueLog.catatan + ' | ' : ''}Perbaikan selesai: ${catatan || 'Armada siap beroperasi kembali.'}`,
          updatedAt: new Date().toISOString(),
        };
        await onUpdateLog(resolved);
      }
    }
  };

  // Delete / Archive handler with audit
  const handleDeleteWithAudit = async (id: string, reason: string) => {
    await onDeleteLog(id);
    showToast('Catatan berhasil dihapus dari sistem.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-2xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 4 Main Tabs Navigation Bar */}
      <div className="bg-slate-900/90 p-2 sm:p-2.5 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md sticky top-16 z-30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {/* Tab 1: Kendaraan */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Car className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>🚗 Kendaraan</span>
          </button>

          {/* Tab 2: Ajukan Kendaraan */}
          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'request'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-950/60 ring-1 ring-red-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>📝 Ajukan Kendaraan</span>
          </button>

          {/* Tab 3: Jadwal */}
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>📅 Jadwal</span>
            {vehicleLogs.filter(l => l.status === 'Menunggu Persetujuan' && !l.isArchived).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-2 right-2" />
            )}
          </button>

          {/* Tab 4: Riwayat */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>📋 Riwayat</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Kendaraan (Dashboard) */}
      {activeTab === 'dashboard' && (
        <VehicleDashboardTab
          vehicleLogs={vehicleLogs}
          currentUser={currentUser}
          onNavigateTab={(t) => setActiveTab(t)}
          onOpenChecklistModal={(log) => setChecklistModalLog(log)}
          onOpenReturnModal={(log) => setReturnModalLog(log)}
          onOpenApproveModal={(log) => setApproveModalLog(log)}
          onOpenManageFleet={() => setIsManageFleetOpen(true)}
          onSelectLogDetail={(log) => setSelectedDetailLog(log)}
        />
      )}

      {/* Tab 2: Ajukan Kendaraan (Request Form) */}
      {activeTab === 'request' && (
        <VehicleRequestFormTab
          vehicleLogs={vehicleLogs}
          members={members}
          currentUser={currentUser}
          onSubmitRequest={handleSubmitRequest}
          onCancel={() => setActiveTab('dashboard')}
        />
      )}

      {/* Tab 3: Jadwal (Schedule & Approvals) */}
      {activeTab === 'schedule' && (
        <VehicleScheduleTab
          vehicleLogs={vehicleLogs}
          currentUser={currentUser}
          onOpenChecklistModal={(log) => setChecklistModalLog(log)}
          onOpenReturnModal={(log) => setReturnModalLog(log)}
          onOpenApproveModal={(log) => setApproveModalLog(log)}
          onSelectLogDetail={(log) => setSelectedDetailLog(log)}
          onNavigateToRequest={() => setActiveTab('request')}
        />
      )}

      {/* Tab 4: Riwayat (History & Excel Export) */}
      {activeTab === 'history' && (
        <VehicleHistoryTab
          vehicleLogs={vehicleLogs}
          currentUser={currentUser}
          onSelectLogDetail={(log) => setSelectedDetailLog(log)}
          onDeleteLog={handleDeleteWithAudit}
        />
      )}

      {/* MODAL 1: Detail Modal */}
      {selectedDetailLog && (
        <VehicleDetailModal
          log={selectedDetailLog}
          currentUser={currentUser}
          onClose={() => setSelectedDetailLog(null)}
        />
      )}

      {/* MODAL 2: Pre-Trip Inspection Checklist Modal (PAKAI) */}
      {checklistModalLog && (
        <VehicleChecklistModal
          log={checklistModalLog}
          currentUser={currentUser}
          onStartTrip={handleStartTrip}
          onClose={() => setChecklistModalLog(null)}
        />
      )}

      {/* MODAL 3: Return & Serah Terima Modal (KEMBALI) */}
      {returnModalLog && (
        <VehicleReturnModal
          log={returnModalLog}
          currentUser={currentUser}
          onCompleteTrip={handleCompleteTrip}
          onClose={() => setReturnModalLog(null)}
        />
      )}

      {/* MODAL 4: Approval & Driver Assignment Modal (SETUJUI / TOLAK) */}
      {approveModalLog && (
        <VehicleApproveModal
          log={approveModalLog}
          currentUser={currentUser}
          onApprove={handleApproveLog}
          onReject={handleRejectLog}
          onClose={() => setApproveModalLog(null)}
        />
      )}

      {/* MODAL 5: Fleet Maintenance Management Modal */}
      {isManageFleetOpen && (
        <VehicleManageFleetModal
          vehicleLogs={vehicleLogs}
          currentUser={currentUser}
          onUpdateVehicleMaintenance={handleUpdateVehicleMaintenance}
          onClose={() => setIsManageFleetOpen(false)}
        />
      )}

    </div>
  );
};
