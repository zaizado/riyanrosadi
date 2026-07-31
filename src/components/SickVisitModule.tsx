import React, { useState } from 'react';
import { 
  HeartPulse, 
  Plus, 
  Search, 
  MapPin, 
  Building2, 
  Clock, 
  User, 
  Phone, 
  X, 
  Activity, 
  ChevronRight, 
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { SickVisit, SickVisitStatus, Member, UserAccount, SickVisitLog } from '../types';
import { MemberSearchSelect } from './MemberSearchSelect';
import { exportSickVisitToExcel } from '../lib/excelExport';

interface SickVisitModuleProps {
  sickVisits: SickVisit[];
  members: Member[];
  onAddVisit: (newVisit: SickVisit) => void;
  onUpdateVisit: (updatedVisit: SickVisit) => void;
  onDeleteVisit?: (visitId: string) => void;
  currentUser: UserAccount;
}

export const SickVisitModule: React.FC<SickVisitModuleProps> = ({
  sickVisits,
  members,
  onAddVisit,
  onUpdateVisit,
  onDeleteVisit,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVisitDetail, setSelectedVisitDetail] = useState<SickVisit | null>(null);

  // Condition Log Update Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logCatatan, setLogCatatan] = useState('');
  const [logKondisi, setLogKondisi] = useState('');
  const [logStatus, setLogStatus] = useState<SickVisitStatus>('Sedang Didampingi');

  // New Visit Form State
  const [newMemberId, setNewMemberId] = useState('');
  const [jenisLokasi, setJenisLokasi] = useState<'Rumah Sakit' | 'Rumah'>('Rumah Sakit');
  const [lokasi, setLokasi] = useState('');
  const [diagnosaSingkat, setDiagnosaSingkat] = useState('');
  const [catatanAwal, setCatatanAwal] = useState('');
  const [pengurusPJ, setPengurusPJ] = useState(currentUser.name);

  // Status Badge Helper
  const getStatusBadge = (status: SickVisitStatus) => {
    switch (status) {
      case 'Menunggu Kunjungan':
        return 'bg-amber-950 text-amber-400 border-amber-800/60';
      case 'Sedang Didampingi':
        return 'bg-rose-950 text-rose-400 border-rose-800/60';
      case 'Selesai':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800/60';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const filteredVisits = sickVisits.filter((vis) => {
    const matchSearch = 
      vis.nomorPendampingan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vis.namaAnggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vis.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vis.diagnosaSingkat && vis.diagnosaSingkat.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = selectedStatusFilter === 'All' || vis.status === selectedStatusFilter;

    return matchSearch && matchStatus;
  });

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const mbr = members.find(m => m.id === newMemberId);
    if (!mbr) {
      alert('Pilih anggota dari database terlebih dahulu!');
      return;
    }

    const newVisitObj: SickVisit = {
      id: `sak-${Date.now()}`,
      nomorPendampingan: `SAK-2026-${String(sickVisits.length + 1).padStart(3, '0')}`,
      memberId: mbr.id,
      namaAnggota: mbr.namaLengkap,
      nikAnggota: mbr.nik,
      departemen: mbr.departemen,
      nomorHp: mbr.nomorHp,
      lokasi: lokasi || (jenisLokasi === 'Rumah Sakit' ? 'RS Rujukan' : mbr.alamat),
      jenisLokasi,
      diagnosaSingkat,
      catatanAwal,
      tanggalKunjunganAwal: new Date().toISOString().slice(0, 10),
      status: 'Menunggu Kunjungan',
      pengurusPenanggungJawab: pengurusPJ,
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: new Date().toISOString().slice(0, 10),
          penulis: currentUser.name,
          catatan: `Pendampingan anggota sakit dicatat: ${catatanAwal}`,
          kondisiTerbaru: diagnosaSingkat || 'Dalam perawatan awal'
        }
      ]
    };

    onAddVisit(newVisitObj);
    setIsAddModalOpen(false);
    // Reset
    setNewMemberId('');
    setLokasi('');
    setDiagnosaSingkat('');
    setCatatanAwal('');
  };

  const handleAddConditionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitDetail || !logCatatan.trim()) return;

    const newLogItem: SickVisitLog = {
      id: `slog-${Date.now()}`,
      tanggal: new Date().toISOString().slice(0, 10),
      penulis: currentUser.name,
      catatan: logCatatan,
      kondisiTerbaru: logKondisi || 'Kondisi stabil'
    };

    const updatedVisit: SickVisit = {
      ...selectedVisitDetail,
      status: logStatus,
      riwayatKunjungan: [newLogItem, ...selectedVisitDetail.riwayatKunjungan]
    };

    onUpdateVisit(updatedVisit);
    setSelectedVisitDetail(updatedVisit);
    setIsLogModalOpen(false);
    setLogCatatan('');
    setLogKondisi('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-950 text-red-400 border border-red-800/40">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Pendampingan Anggota Sakit</h1>
            <p className="text-xs text-slate-400">Pencatatan Kunjungan Sosial & Pendampingan Kesehatan Anggota SBN KASBI</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportSickVisitToExcel(filteredVisits)}
            className="px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            title="Download Laporan Format Tabel Excel (.xlsx) Siap Cetak"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Laporan Excel ({filteredVisits.length})</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-md shadow-red-900/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Catat Pendampingan Sakit
          </button>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Anggota, Rumah Sakit, Alamat, atau Diagnosa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setSelectedStatusFilter('All')}
            className={`px-3 py-1.5 rounded-lg border ${selectedStatusFilter === 'All' ? 'bg-rose-950 text-rose-300 border-rose-800 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
          >
            Semua ({sickVisits.length})
          </button>
          <button
            onClick={() => setSelectedStatusFilter('Menunggu Kunjungan')}
            className={`px-3 py-1.5 rounded-lg border ${selectedStatusFilter === 'Menunggu Kunjungan' ? 'bg-amber-950 text-amber-300 border-amber-800 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
          >
            Menunggu Kunjungan
          </button>
          <button
            onClick={() => setSelectedStatusFilter('Sedang Didampingi')}
            className={`px-3 py-1.5 rounded-lg border ${selectedStatusFilter === 'Sedang Didampingi' ? 'bg-rose-950 text-rose-300 border-rose-800 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
          >
            Sedang Didampingi
          </button>
          <button
            onClick={() => setSelectedStatusFilter('Selesai')}
            className={`px-3 py-1.5 rounded-lg border ${selectedStatusFilter === 'Selesai' ? 'bg-emerald-950 text-emerald-300 border-emerald-800 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVisits.length === 0 ? (
          <div className="col-span-2 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
            Belum ada data pendampingan anggota sakit.
          </div>
        ) : (
          filteredVisits.map((vis) => (
            <div 
              key={vis.id}
              onClick={() => setSelectedVisitDetail(vis)}
              className="bg-slate-900 hover:bg-slate-850 p-5 rounded-2xl border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer shadow-md space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-800/40">
                  {vis.nomorPendampingan}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(vis.status)}`}>
                  {vis.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-white group-hover:text-rose-300 transition-colors">
                  {vis.namaAnggota} <span className="text-xs text-slate-400 font-normal">({vis.departemen})</span>
                </h3>
                <p className="text-xs text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Diagnosa: {vis.diagnosaSingkat || 'Membutuhkan Istirahat Medis'}
                </p>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="flex items-center gap-1.5 text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <strong className="truncate">{vis.lokasi}</strong>
                </p>
                <p className="text-[11px] text-slate-400">PJ Pengurus: {vis.pengurusPenanggungJawab}</p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[10px] text-slate-500">Kunjungan Awal: {vis.tanggalKunjunganAwal}</span>
                <div className="flex items-center gap-1 text-rose-400 font-semibold text-[11px] group-hover:translate-x-1 transition-transform">
                  <span>Log Kunjungan</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* VISIT DETAIL & LOGS MODAL */}
      {selectedVisitDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedVisitDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950 px-2.5 py-0.5 rounded border border-rose-800">
                  {selectedVisitDetail.nomorPendampingan}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedVisitDetail.status)}`}>
                  {selectedVisitDetail.status}
                </span>
              </div>

              <h2 className="text-xl font-black text-white">{selectedVisitDetail.namaAnggota}</h2>
              <p className="text-xs text-slate-300">NIK: {selectedVisitDetail.nikAnggota} • Dept: {selectedVisitDetail.departemen} • HP: {selectedVisitDetail.nomorHp}</p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <p className="text-[10px] text-slate-400 font-semibold">Lokasi Rumah Sakit / Kediaman:</p>
                <p className="font-bold text-white flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {selectedVisitDetail.lokasi} ({selectedVisitDetail.jenisLokasi})
                </p>
                <p className="text-[10px] text-slate-400 font-semibold pt-1">Diagnosa Singkat:</p>
                <p className="font-bold text-rose-400">{selectedVisitDetail.diagnosaSingkat || '-'}</p>
                <p className="text-[10px] text-slate-400 font-semibold pt-1">Pengurus Penanggung Jawab:</p>
                <p className="font-bold text-slate-200">{selectedVisitDetail.pengurusPenanggungJawab}</p>
              </div>
            </div>

            {/* Visit Logs Timeline */}
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  Riwayat Kunjungan & Perkembangan Kondisi
                </h3>
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Kunjungan & Kondisi
                </button>
              </div>

              <div className="space-y-3">
                {selectedVisitDetail.riwayatKunjungan.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-slate-200">{log.penulis}</span>
                      <span>{log.tanggal}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{log.catatan}</p>
                    {log.kondisiTerbaru && (
                      <p className="text-[11px] text-rose-400 font-semibold pt-1">
                        Kondisi Kesehatan: {log.kondisiTerbaru}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedVisitDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Tutup Modal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONDITION LOG UPDATE MODAL */}
      {isLogModalOpen && selectedVisitDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-white p-6 shadow-2xl relative">
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-3">Catat Kunjungan & Perkembangan</h2>

            <form onSubmit={handleAddConditionLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Status Pendampingan</label>
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value as SickVisitStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                >
                  <option value="Menunggu Kunjungan">Menunggu Kunjungan</option>
                  <option value="Sedang Didampingi">Sedang Didampingi</option>
                  <option value="Selesai">Selesai (Pulang/Sembuh)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Catatan Kunjungan & Bantuan Bungkusan</label>
                <textarea
                  rows={3}
                  value={logCatatan}
                  onChange={(e) => setLogCatatan(e.target.value)}
                  placeholder="Catatan hasil kunjungan pengurus..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Kondisi Kesehatan Terbaru</label>
                <input
                  type="text"
                  value={logKondisi}
                  onChange={(e) => setLogKondisi(e.target.value)}
                  placeholder="Misal: Sudah membaik, trombosit naik, rawat jalan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Simpan Kunjungan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* CREATE NEW VISIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg text-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">Catat Pendampingan Anggota Sakit Baru</h2>

            <form onSubmit={handleCreateVisit} className="space-y-3.5 text-xs">
              <div>
                <MemberSearchSelect
                  members={members}
                  selectedMemberId={newMemberId}
                  onSelectMember={(m) => setNewMemberId(m ? m.id : '')}
                  label="Pilih Anggota dari Database"
                  placeholder="Ketik NIK, Nama, atau Departemen..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Jenis Lokasi</label>
                  <select
                    value={jenisLokasi}
                    onChange={(e) => setJenisLokasi(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Rumah Sakit">Rumah Sakit</option>
                    <option value="Rumah">Rumah Kediaman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama RS / Alamat Detail</label>
                  <input
                    type="text"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="Contoh: RSUD Tangerang Ruang 3B"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Diagnosa Singkat (Opsional)</label>
                <input
                  type="text"
                  value={diagnosaSingkat}
                  onChange={(e) => setDiagnosaSingkat(e.target.value)}
                  placeholder="Contoh: Demam Berdarah / Operasi Usus Buntu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pengurus Penanggung Jawab Visite</label>
                <input
                  type="text"
                  value={pengurusPJ}
                  onChange={(e) => setPengurusPJ(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Catatan Awal Kunjungan</label>
                <textarea
                  rows={3}
                  value={catatanAwal}
                  onChange={(e) => setCatatanAwal(e.target.value)}
                  placeholder="Kebutuhan bantuan, surat BPJS, atau jadwal perkiraan sembuh..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Simpan Kunjungan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
