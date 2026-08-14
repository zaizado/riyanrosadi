import React, { useState, useEffect } from 'react';
import { 
  Car, 
  PlusCircle, 
  Calendar, 
  History, 
  SlidersHorizontal, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { 
  VehicleLog, 
  Member, 
  UserAccount, 
  VehicleConditionStatus,
  VehicleChecklistItems,
  VehicleReturnChecklist,
  canApproveRequests
} from '../types';
import { calculateDistanceKm } from '../utils/vehicleUtils';
import { VehicleDashboardTab } from './vehicle/VehicleDashboardTab';
import { VehicleRequestFormTab } from './vehicle/VehicleRequestFormTab';
import { VehicleMyRequestsTab } from './vehicle/VehicleMyRequestsTab';
import { VehicleScheduleTab } from './vehicle/VehicleScheduleTab';
import { VehicleApprovalsTab } from './vehicle/VehicleApprovalsTab';
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
  draftRequest?: Partial<VehicleLog> | null;
  onClearDraftRequest?: () => void;
  onAddLog: (log: VehicleLog) => Promise<void>;
  onUpdateLog: (log: VehicleLog) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

export type VehicleTabType = 'dashboard' | 'request' | 'my_requests' | 'schedule' | 'approvals' | 'history';

export const VehicleManager: React.FC<VehicleManagerProps> = ({
  vehicleLogs,
  members,
  users,
  currentUser,
  draftRequest,
  onClearDraftRequest,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
}) => {
  const hasApprovalAuthority = canApproveRequests(currentUser);

  // Active Tab
  const [activeTab, setActiveTab] = useState<VehicleTabType>('dashboard');

  // If a draft request arrives from SickVisit, auto navigate to 'request' tab
  useEffect(() => {
    if (draftRequest) {
      setActiveTab('request');
    }
  }, [draftRequest]);

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
    if (onClearDraftRequest) onClearDraftRequest();
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

  const pendingApprovalsCount = vehicleLogs.filter(l => l.status === 'Menunggu Persetujuan' && !l.isArchived).length;
  const myActiveRequestsCount = vehicleLogs.filter(l => 
    !l.isArchived && 
    (l.namaPemakai === currentUser.name || l.memberId === currentUser.id || (currentUser.memberId && l.memberId === currentUser.memberId)) &&
    (l.status === 'Menunggu Persetujuan' || l.status === 'Disetujui' || l.status === 'Sedang Digunakan')
  ).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-2 sm:px-4 text-white pb-12">
      
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
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 1. HEADER UTAMA: JUDUL & DESKRIPSI (Normal Document Flow) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-lg shadow-amber-950/50 shrink-0">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Kendaraan Operasional
                </h1>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 font-mono">
                  Armada SBN KASBI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Peminjaman Armada &amp; Pengawalan Pasien SBN KASBI PT Victory Chingluh Indonesia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Ajukan Kendaraan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGASI MODULE DALAM NORMAL FLOW (NO STICKY / NO FIXED / NO FLOATING) */}
      <div className="bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-md">
        <div className={`grid gap-1.5 ${hasApprovalAuthority ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
          {/* Tab 1: Kendaraan (Utama) */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="w-4 h-4 shrink-0" />
            <span>Kendaraan</span>
          </button>

          {/* Tab 2: Ajukan */}
          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'request'
                ? 'bg-red-600 text-white font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Ajukan</span>
          </button>

          {/* Tab 3: Jadwal */}
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Jadwal</span>
          </button>

          {/* Tab 4: Riwayat */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Riwayat</span>
          </button>

          {/* Tab 5: Pengajuan Saya */}
          <button
            type="button"
            onClick={() => setActiveTab('my_requests')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'my_requests'
                ? 'bg-indigo-600 text-white font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Saya</span>
            {myActiveRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold font-mono">
                {myActiveRequestsCount}
              </span>
            )}
          </button>

          {/* Tab 6: Persetujuan (Hanya Tampil Jika Punya Hak Otoritas) */}
          {hasApprovalAuthority && (
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === 'approvals'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Persetujuan</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black font-mono">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Kendaraan (Dashboard) */}
      {activeTab === 'dashboard' && (
        <VehicleDashboardTab
          vehicleLogs={vehicleLogs}
          currentUser={currentUser}
          onNavigateTab={(t) => setActiveTab(t as VehicleTabType)}
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
          initialDraft={draftRequest}
          onSubmitRequest={handleSubmitRequest}
          onCancel={() => {
            if (onClearDraftRequest) onClearDraftRequest();
            setActiveTab('dashboard');
          }}
        />
      )}

      {/* Tab 3: Pengajuan Saya */}
      {activeTab === 'my_requests' && (
        <VehicleMyRequestsTab
          vehicleLogs={vehicleLogs}
          currentUser={currentUser}
          onOpenChecklistModal={(log) => setChecklistModalLog(log)}
          onOpenReturnModal={(log) => setReturnModalLog(log)}
          onSelectLogDetail={(log) => setSelectedDetailLog(log)}
          onNavigateToRequest={() => setActiveTab('request')}
        />
      )}

      {/* Tab 4: Jadwal (Schedule) */}
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

      {/* Tab 5: Persetujuan Kendaraan (Superadmin/Ketua/Sekretaris Only) */}
      {activeTab === 'approvals' && hasApprovalAuthority && (
        <VehicleApprovalsTab
          vehicleLogs={vehicleLogs}
          currentUser={currentUser}
          onOpenApproveModal={(log) => setApproveModalLog(log)}
          onSelectLogDetail={(log) => setSelectedDetailLog(log)}
        />
      )}

      {/* Tab 6: Riwayat (History & Excel Export) */}
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
