import React, { useState } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  User, 
  X, 
  MessageSquare, 
  Send, 
  ChevronRight,
  ShieldAlert,
  Paperclip,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { AdvocacyCase, AdvocacyStatus, Member, UserAccount, AdvocacyUpdate } from '../types';
import { MemberSearchSelect } from './MemberSearchSelect';
import { exportAdvocacyToExcel } from '../lib/excelExport';
import { ModalPortal } from './ModalPortal';
import { SectionHeader, PrimaryButton, SecondaryButton } from './ui/DesignSystem';

interface AdvocacyModuleProps {
  advocacyCases: AdvocacyCase[];
  members: Member[];
  onAddCase: (newCase: AdvocacyCase) => void;
  onUpdateCase: (updatedCase: AdvocacyCase) => void;
  onDeleteCase?: (caseId: string) => void;
  currentUser: UserAccount;
}

export const AdvocacyModule: React.FC<AdvocacyModuleProps> = ({
  advocacyCases,
  members,
  onAddCase,
  onUpdateCase,
  onDeleteCase,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<AdvocacyCase | null>(null);
  
  // Progress Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateStatusBaru, setUpdateStatusBaru] = useState<AdvocacyStatus>('Dalam Pendampingan');

  // Form State for New Case
  const [newCaseMemberId, setNewCaseMemberId] = useState('');
  const [newCaseJudul, setNewCaseJudul] = useState('');
  const [newCaseKategori, setNewCaseKategori] = useState<AdvocacyCase['kategori']>('Hubungan Industrial');
  const [newCasePendamping, setNewCasePendamping] = useState(currentUser.name);
  const [newCaseDeskripsi, setNewCaseDeskripsi] = useState('');

  // Status Badge Colors
  const getStatusBadge = (status: AdvocacyStatus) => {
    switch (status) {
      case 'Baru':
        return 'bg-blue-950 text-blue-400 border-blue-800/60';
      case 'Dalam Pendampingan':
        return 'bg-amber-950 text-amber-400 border-amber-800/60';
      case 'Mediasi':
      case 'Mediation':
        return 'bg-purple-950 text-purple-400 border-purple-800/60';
      case 'Negosiasi':
        return 'bg-indigo-950 text-indigo-400 border-indigo-800/60';
      case 'Selesai':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800/60';
      case 'Ditutup':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  // Filtered cases
  const filteredCases = advocacyCases.filter((cas) => {
    const matchSearch = 
      (cas.nomorKasus && cas.nomorKasus.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cas.judulKasus && cas.judulKasus.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cas.namaAnggota && cas.namaAnggota.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cas.departemen && cas.departemen.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = selectedStatusFilter === 'All' || cas.status === selectedStatusFilter;
    const matchCategory = selectedCategoryFilter === 'All' || cas.kategori === selectedCategoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMbr = members.find(m => m.id === newCaseMemberId);
    if (!selectedMbr) {
      alert('Pilih anggota terlebih dahulu dari database!');
      return;
    }

    const newCaseObj: AdvocacyCase = {
      id: `adv-${Date.now()}`,
      nomorKasus: `ADV-2026-${String(advocacyCases.length + 1).padStart(3, '0')}`,
      memberId: selectedMbr.id,
      namaAnggota: selectedMbr.namaLengkap,
      nikAnggota: selectedMbr.nik,
      departemen: selectedMbr.departemen,
      judulKasus: newCaseJudul,
      kategori: newCaseKategori,
      tanggalDibuat: new Date().toISOString().slice(0, 10),
      status: 'Baru',
      pendampingUtama: newCasePendamping,
      deskripsiMasalah: newCaseDeskripsi,
      riwayatPerkembangan: [
        {
          id: `upd-${Date.now()}`,
          tanggal: new Date().toISOString().slice(0, 10),
          penulis: currentUser.name,
          catatan: `Laporan advokasi kasus baru berhasil dibuat. Deskripsi: ${newCaseDeskripsi}`,
          statusSebelumnya: 'Baru',
          statusBaru: 'Baru'
        }
      ]
    };

    onAddCase(newCaseObj);
    setIsAddModalOpen(false);
    // Reset form
    setNewCaseMemberId('');
    setNewCaseJudul('');
    setNewCaseDeskripsi('');
  };

  const handleAddProgressUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseDetail || !updateNotes.trim()) return;

    const newUpdate: AdvocacyUpdate = {
      id: `upd-${Date.now()}`,
      tanggal: new Date().toISOString().slice(0, 10),
      penulis: currentUser.name,
      catatan: updateNotes,
      statusSebelumnya: selectedCaseDetail.status,
      statusBaru: updateStatusBaru,
    };

    const updatedCase: AdvocacyCase = {
      ...selectedCaseDetail,
      status: updateStatusBaru,
      riwayatPerkembangan: [newUpdate, ...selectedCaseDetail.riwayatPerkembangan]
    };

    onUpdateCase(updatedCase);
    setSelectedCaseDetail(updatedCase);
    setIsUpdateModalOpen(false);
    setUpdateNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <SectionHeader
        icon={Scale}
        title="Pendampingan Advokasi"
        description="Dokumentasi & Pengawalan Kasus Industrial Buruh SBN KASBI PT VCI"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <SecondaryButton
              icon={FileSpreadsheet}
              onClick={() => exportAdvocacyToExcel(filteredCases)}
              size="sm"
            >
              Laporan Excel ({filteredCases.length})
            </SecondaryButton>
            <PrimaryButton
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
            >
              Buat Kasus Baru
            </PrimaryButton>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nomor Kasus, Judul, Nama Anggota, atau Departemen..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Filter Status Kasus</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="All">Semua Status</option>
              <option value="Baru">Baru</option>
              <option value="Dalam Pendampingan">Dalam Pendampingan</option>
              <option value="Mediasi">Mediasi</option>
              <option value="Negosiasi">Negosiasi</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditutup">Ditutup</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Filter Kategori Kasus</label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="All">Semua Kategori</option>
              <option value="Hubungan Industrial">Hubungan Industrial</option>
              <option value="Sanksi/SP">Sanksi / SP</option>
              <option value="K3/Kecelakaan Kerja">K3 / Kecelakaan Kerja</option>
              <option value="Hak Pesangon/Mutasi">Hak Pesangon / Mutasi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCases.length === 0 ? (
          <div className="col-span-2 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
            Belum ada kasus advokasi yang sesuai filter.
          </div>
        ) : (
          filteredCases.map((cas) => (
            <div 
              key={cas.id}
              onClick={() => setSelectedCaseDetail(cas)}
              className="bg-slate-900 hover:bg-slate-850 p-5 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer shadow-md space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800/40">
                  {cas.nomorKasus}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(cas.status)}`}>
                  {cas.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors leading-snug">
                  {cas.judulKasus}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cas.deskripsiMasalah}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="space-y-0.5">
                  <p className="text-slate-200 font-semibold">{cas.namaAnggota} ({cas.departemen})</p>
                  <p className="text-[10px] text-slate-500">Pendamping: {cas.pendampingUtama}</p>
                </div>
                
                <div className="flex items-center gap-1 text-amber-400 font-semibold text-[11px] group-hover:translate-x-1 transition-transform">
                  <span>Lihat Riwayat</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* CASE DETAIL & TIMELINE MODAL */}
      {selectedCaseDetail && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-3xl">
            <button
              onClick={() => setSelectedCaseDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
                  {selectedCaseDetail.nomorKasus}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedCaseDetail.status)}`}>
                  Status: {selectedCaseDetail.status}
                </span>
                <span className="text-xs text-slate-400">Dibuat: {selectedCaseDetail.tanggalDibuat}</span>
              </div>

              <h2 className="text-lg font-black text-white">{selectedCaseDetail.judulKasus}</h2>
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Korban / Anggota Terlibat:</p>
                <p className="font-bold text-slate-200">{selectedCaseDetail.namaAnggota} (NIK: {selectedCaseDetail.nikAnggota}) - Dept {selectedCaseDetail.departemen}</p>
                <p className="text-[10px] text-slate-400 font-semibold pt-1">Pendamping Utama Serikat:</p>
                <p className="font-bold text-amber-400">{selectedCaseDetail.pendampingUtama}</p>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold mb-1">Deskripsi & Kronologi Masalah:</p>
                {selectedCaseDetail.deskripsiMasalah}
              </div>
            </div>

            {/* Timeline Perkembangan Kasus */}
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Riwayat Perkembangan & Catatan Advokasi
                </h3>
                <button
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Update Perkembangan Kasus
                </button>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800 pl-8">
                {selectedCaseDetail.riwayatPerkembangan.map((upd) => (
                  <div key={upd.id} className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="absolute -left-8 top-3.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-slate-900" />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-slate-200">{upd.penulis}</span>
                      <span>{upd.tanggal}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{upd.catatan}</p>
                    {upd.statusBaru !== upd.statusSebelumnya && (
                      <p className="text-[10px] text-amber-400 font-semibold pt-1">
                        Status diperbarui: {upd.statusSebelumnya} → <strong className="text-white">{upd.statusBaru}</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCaseDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Tutup Modal
              </button>
            </div>

          </div>
        </div>
        </ModalPortal>
      )}

      {/* UPDATE PROGRESS MODAL */}
      {isUpdateModalOpen && selectedCaseDetail && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-md">
            <button
              onClick={() => setIsUpdateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-3">Update Perkembangan Advokasi</h2>
            <form onSubmit={handleAddProgressUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Ubah Status Kasus</label>
                <select
                  value={updateStatusBaru}
                  onChange={(e) => setUpdateStatusBaru(e.target.value as AdvocacyStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                >
                  <option value="Baru">Baru</option>
                  <option value="Dalam Pendampingan">Dalam Pendampingan</option>
                  <option value="Mediasi">Mediasi</option>
                  <option value="Negosiasi">Negosiasi</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditutup">Ditutup</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Catatan Perkembangan Hasil Perundingan</label>
                <textarea
                  rows={4}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Tulis hasil mediasi, risalah runding Bipartit, atau tindak lanjut..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>

          </div>
        </div>
        </ModalPortal>
      )}

      {/* CREATE NEW ADVOCACY CASE MODAL */}
      {isAddModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-lg">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">Buat Kasus Advokasi Baru</h2>

            <form onSubmit={handleCreateCase} className="space-y-3.5 text-xs">
              <div>
                <MemberSearchSelect
                  members={members}
                  selectedMemberId={newCaseMemberId}
                  onSelectMember={(m) => setNewCaseMemberId(m ? m.id : '')}
                  label="Pilih Anggota yang Didampingi"
                  placeholder="Ketik NIK, Nama, atau Departemen Anggota..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Judul Kasus / Pokok Permasalahan</label>
                <input
                  type="text"
                  value={newCaseJudul}
                  onChange={(e) => setNewCaseJudul(e.target.value)}
                  placeholder="Misal: Dugaan Mutasi Tidak Sesuai Kesepakatan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Kategori Kasus</label>
                <select
                  value={newCaseKategori}
                  onChange={(e) => setNewCaseKategori(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="Hubungan Industrial">Hubungan Industrial</option>
                  <option value="Sanksi/SP">Sanksi / SP</option>
                  <option value="K3/Kecelakaan Kerja">K3 / Kecelakaan Kerja</option>
                  <option value="Hak Pesangon/Mutasi">Hak Pesangon / Mutasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pengurus Penanggung Jawab</label>
                <input
                  type="text"
                  value={newCasePendamping}
                  onChange={(e) => setNewCasePendamping(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Uraian & Kronologi Masalah</label>
                <textarea
                  rows={4}
                  value={newCaseDeskripsi}
                  onChange={(e) => setNewCaseDeskripsi(e.target.value)}
                  placeholder="Jelaskan detail kronologi kejadian..."
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Simpan Kasus Advokasi
                </button>
              </div>

            </form>

          </div>
        </div>
        </ModalPortal>
      )}

    </div>
  );
};
