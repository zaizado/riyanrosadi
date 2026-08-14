import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  BedDouble, 
  Car, 
  Coins, 
  ShieldCheck, 
  RefreshCw,
  Users
} from 'lucide-react';
import { 
  SickVisit, 
  SickVisitStatus, 
  Member, 
  UserAccount 
} from '../types';
import { SickVisitCard } from './sickVisit/SickVisitCard';
import { SickVisitAddModal } from './sickVisit/SickVisitAddModal';
import { SickVisitDetailModal } from './sickVisit/SickVisitDetailModal';
import { exportSickVisitToExcel } from '../lib/excelExport';

interface SickVisitModuleProps {
  sickVisits: SickVisit[];
  members: Member[];
  onAddVisit: (newVisit: SickVisit) => void;
  onUpdateVisit: (updatedVisit: SickVisit, actionName?: string, auditDetail?: string) => void;
  onDeleteVisit?: (visitId: string) => void;
  currentUser: UserAccount;
  onRequestVehicle?: (draft: any) => void;
}

export const SickVisitModule: React.FC<SickVisitModuleProps> = ({
  sickVisits,
  members,
  onAddVisit,
  onUpdateVisit,
  onDeleteVisit,
  currentUser,
  onRequestVehicle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  // Selected visit for detail modal
  const selectedVisit = useMemo(() => {
    return sickVisits.find(v => v.id === selectedVisitId) || null;
  }, [sickVisits, selectedVisitId]);

  // Statistics
  const totalCount = sickVisits.length;
  const waitingCoordCount = sickVisits.filter(
    v => v.status === 'Dilaporkan' || v.status === 'Menunggu Koordinasi' || v.status === 'Menunggu Kunjungan'
  ).length;
  const inProgressCount = sickVisits.filter(
    v => v.status === 'Disetujui' || v.status === 'Ditugaskan' || v.status === 'Dalam Pendampingan' || v.status === 'Sedang Didampingi'
  ).length;
  const rawatInapCount = sickVisits.filter(v => v.hasilPendampingan === 'RAWAT INAP').length;
  const selesaiCount = sickVisits.filter(v => v.status === 'Selesai').length;

  // Filtered List
  const filteredVisits = useMemo(() => {
    return sickVisits.filter((vis) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !q ||
        (vis.nomorPendampingan && vis.nomorPendampingan.toLowerCase().includes(q)) ||
        (vis.namaAnggota && vis.namaAnggota.toLowerCase().includes(q)) ||
        (vis.namaPasien && vis.namaPasien.toLowerCase().includes(q)) ||
        (vis.nikAnggota && vis.nikAnggota.toLowerCase().includes(q)) ||
        (vis.departemen && vis.departemen.toLowerCase().includes(q)) ||
        (vis.rumahSakitTujuan && vis.rumahSakitTujuan.toLowerCase().includes(q)) ||
        (vis.lokasi && vis.lokasi.toLowerCase().includes(q)) ||
        (vis.deskripsiKondisi && vis.deskripsiKondisi.toLowerCase().includes(q)) ||
        (vis.diagnosaSingkat && vis.diagnosaSingkat.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Urgent') return vis.isUrgent === true;
      if (selectedFilter === 'RawatInap') return vis.hasilPendampingan === 'RAWAT INAP';
      if (selectedFilter === 'Dipulangkan') return vis.hasilPendampingan === 'DIPULANGKAN';
      if (selectedFilter === 'Menunggu') {
        return vis.status === 'Dilaporkan' || vis.status === 'Menunggu Koordinasi' || vis.status === 'Menunggu Kunjungan';
      }
      if (selectedFilter === 'DalamProses') {
        return vis.status === 'Disetujui' || vis.status === 'Ditugaskan' || vis.status === 'Dalam Pendampingan' || vis.status === 'Sedang Didampingi';
      }
      if (selectedFilter === 'Selesai') return vis.status === 'Selesai';
      if (selectedFilter === 'Ditolak') return vis.status === 'Ditolak';

      return vis.status === selectedFilter;
    });
  }, [sickVisits, searchQuery, selectedFilter]);

  const handleUpdate = (updatedVisit: SickVisit, actionName?: string, auditDetail?: string) => {
    onUpdateVisit(updatedVisit, actionName, auditDetail);
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg shadow-red-950/50">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Pendampingan Anggota Sakit
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/60 font-mono">
                SOP 2026–2029
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Standar Operasional Prosedur Pengawalan, Rumah Sakit Mitra, & Akomodasi PTP SBN KASBI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportSickVisitToExcel(sickVisits)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="Download Laporan Format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-black shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Lapor Pendampingan Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <div 
          onClick={() => setSelectedFilter('All')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === 'All'
              ? 'bg-slate-900 border-rose-500/80 shadow-lg shadow-rose-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold">Total Laporan</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{totalCount}</p>
          <span className="text-[10px] text-slate-500">Semua kasus tercatat</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('Menunggu')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === 'Menunggu'
              ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 mb-1.5">
            <span className="text-[11px] font-bold">Koordinasi & Approval</span>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          </div>
          <p className="text-2xl font-black text-blue-300 font-mono">{waitingCoordCount}</p>
          <span className="text-[10px] text-blue-400/70">Perlu tindakan pengurus</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('DalamProses')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === 'DalamProses'
              ? 'bg-purple-950/60 border-purple-500 shadow-lg shadow-purple-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-purple-400 mb-1.5">
            <span className="text-[11px] font-bold">Dalam Pendampingan</span>
            <Car className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 font-mono">{inProgressCount}</p>
          <span className="text-[10px] text-purple-400/70">Petugas bertugas di RS</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('RawatInap')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === 'RawatInap'
              ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-bold">Pasien Rawat Inap</span>
            <BedDouble className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono">{rawatInapCount}</p>
          <span className="text-[10px] text-amber-400/70">Diopname di RS</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('Selesai')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === 'Selesai'
              ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[11px] font-bold">Selesai & Integritas</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 font-mono">{selesaiCount}</p>
          <span className="text-[10px] text-emerald-400/70">Bebas gratifikasi</span>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan No. Pendampingan, Nama Pasien, NIK, RS Tujuan, atau Gejala..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <span className="text-[11px] text-slate-500 font-semibold px-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter:
          </span>

          {[
            { id: 'All', label: 'Semua Kasus' },
            { id: 'Urgent', label: '🚨 Urgent RS' },
            { id: 'Menunggu', label: '⏳ Menunggu Koordinasi' },
            { id: 'Disetujui', label: '✓ Disetujui' },
            { id: 'Ditugaskan', label: '👥 Ditugaskan' },
            { id: 'DalamProses', label: '🚗 Sedang Didampingi' },
            { id: 'RawatInap', label: '🏥 Rawat Inap' },
            { id: 'Dipulangkan', label: '🏠 Dipulangkan' },
            { id: 'Selesai', label: '✨ Selesai' },
            { id: 'Ditolak', label: '✕ Ditolak' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                selectedFilter === f.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List Grid */}
      {filteredVisits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((visit) => (
            <SickVisitCard
              key={visit.id}
              visit={visit}
              onClick={() => setSelectedVisitId(visit.id)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/60 w-14 h-14 mx-auto flex items-center justify-center text-slate-500">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-300 text-sm">Tidak ada data pendampingan ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery || selectedFilter !== 'All'
                ? 'Coba ubah kata kunci pencarian atau reset filter di atas.'
                : 'Belum ada laporan pendampingan anggota sakit. Klik tombol di atas untuk mencatat laporan baru.'}
            </p>
          </div>
          {(searchQuery || selectedFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('All');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Reset Pencarian & Filter
            </button>
          )}
        </div>
      )}

      {/* Add Modal */}
      <SickVisitAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={onAddVisit}
        members={members}
        currentUser={currentUser}
        existingCount={sickVisits.length}
        onRequestVehicle={onRequestVehicle}
      />

      {/* Detail Modal */}
      {selectedVisit && (
        <SickVisitDetailModal
          visit={selectedVisit}
          isOpen={!!selectedVisit}
          onClose={() => setSelectedVisitId(null)}
          onUpdate={handleUpdate}
          onDelete={onDeleteVisit}
          currentUser={currentUser}
          onRequestVehicle={onRequestVehicle}
        />
      )}

    </div>
  );
};
