import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  User, 
  Users, 
  X, 
  Bell, 
  CheckCircle2, 
  Edit3, 
  Trash2,
  Calendar,
  Layers
} from 'lucide-react';
import { OrganizationAgenda, AgendaType, UserAccount } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface AgendaModuleProps {
  agendas: OrganizationAgenda[];
  onAddAgenda: (newAgenda: OrganizationAgenda) => void;
  onUpdateAgenda: (updatedAgenda: OrganizationAgenda) => void;
  onDeleteAgenda: (agendaId: string) => void;
  currentUser: UserAccount;
}

export const AgendaModule: React.FC<AgendaModuleProps> = ({
  agendas,
  onAddAgenda,
  onUpdateAgenda,
  onDeleteAgenda,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<OrganizationAgenda | null>(null);
  const [deleteAgendaConfirmObj, setDeleteAgendaConfirmObj] = useState<OrganizationAgenda | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<OrganizationAgenda>>({
    judul: '',
    jenis: 'Konsolidasi',
    tanggalWaktu: '2026-08-05T09:00',
    lokasi: 'Aula Gedung Serikat KASBI Cikupa',
    penanggungJawab: currentUser.name,
    deskripsi: '',
    daftarPeserta: ['Seluruh Pengurus Harian', 'Koordinator Lapangan'],
    status: 'Akan Datang',
    notifikasiTerkirim: true
  });

  const agendaTypesList: AgendaType[] = [
    'Rapat',
    'Konsolidasi',
    'Pendidikan',
    'Pelatihan',
    'Demonstrasi',
    'Audiensi',
    'Kunjungan',
    'Kegiatan Sosial',
    'Lainnya'
  ];

  const filteredAgendas = agendas.filter((agd) => {
    const matchSearch = 
      agd.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agd.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agd.penanggungJawab.toLowerCase().includes(searchQuery.toLowerCase());

    const matchType = selectedTypeFilter === 'All' || agd.jenis === selectedTypeFilter;

    return matchSearch && matchType;
  });

  const handleOpenAdd = () => {
    setEditingAgenda(null);
    setFormData({
      judul: '',
      jenis: 'Rapat',
      tanggalWaktu: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      lokasi: 'Sekretariat SBN KASBI PT VCI',
      penanggungJawab: currentUser.name,
      deskripsi: '',
      daftarPeserta: ['Pengurus Harian SBN KASBI'],
      status: 'Akan Datang',
      notifikasiTerkirim: true
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (agenda: OrganizationAgenda) => {
    setEditingAgenda(agenda);
    setFormData({ ...agenda });
    setIsAddModalOpen(true);
  };

  const handleSaveAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul) return;

    if (editingAgenda) {
      onUpdateAgenda({
        ...editingAgenda,
        ...formData
      } as OrganizationAgenda);
    } else {
      const newAgd: OrganizationAgenda = {
        id: `agd-${Date.now()}`,
        judul: formData.judul || 'Agenda Baru',
        jenis: (formData.jenis as AgendaType) || 'Rapat',
        tanggalWaktu: formData.tanggalWaktu || new Date().toISOString().slice(0,16),
        lokasi: formData.lokasi || 'Sekretariat SBN',
        penanggungJawab: formData.penanggungJawab || currentUser.name,
        deskripsi: formData.deskripsi || '',
        daftarPeserta: formData.daftarPeserta || ['Pengurus'],
        status: (formData.status as any) || 'Akan Datang',
        notifikasiTerkirim: true
      };
      onAddAgenda(newAgd);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-950 text-red-400 border border-red-800/40">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Agenda Organisasi</h1>
            <p className="text-xs text-slate-400">Jadwal Rapat, Konsolidasi & Kegiatan SBN KASBI PT VCI</p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-md shadow-red-900/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Agenda Baru
        </button>
      </div>

      {/* Filter and View Switcher Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Judul Agenda, Lokasi, atau Penanggung Jawab..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="All">Semua Jenis Agenda</option>
            {agendaTypesList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Agendas Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgendas.length === 0 ? (
          <div className="col-span-2 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
            Belum ada agenda kegiatan yang sesuai.
          </div>
        ) : (
          filteredAgendas.map((agd) => (
            <div 
              key={agd.id}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                  {agd.jenis}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {new Date(agd.tanggalWaktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <h3 className="font-bold text-base text-white">{agd.judul}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{agd.deskripsi}</p>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {agd.lokasi}
                </p>
                <p className="text-[11px] text-slate-400">PJ: <strong className="text-white">{agd.penanggungJawab}</strong></p>
              </div>

              {/* Participants badge list */}
              <div className="pt-2 flex flex-wrap gap-1">
                {agd.daftarPeserta.map((peserta, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {peserta}
                  </span>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Notifikasi Otomatis Terkirim
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEdit(agd)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400"
                    title="Edit Agenda"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteAgendaConfirmObj(agd)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 cursor-pointer transition-colors"
                    title="Hapus Agenda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ADD / EDIT AGENDA MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg text-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">
              {editingAgenda ? 'Edit Agenda Organisasi' : 'Tambah Agenda Kegiatan Baru'}
            </h2>

            <form onSubmit={handleSaveAgenda} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Judul Kegiatan / Agenda</label>
                <input
                  type="text"
                  value={formData.judul || ''}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Konsolidasi Pengurus SBN KASBI Line 01-10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Jenis Agenda</label>
                  <select
                    value={formData.jenis || 'Rapat'}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value as AgendaType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {agendaTypesList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Waktu & Tanggal</label>
                  <input
                    type="datetime-local"
                    value={formData.tanggalWaktu || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalWaktu: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Lokasi Kegiatan</label>
                <input
                  type="text"
                  value={formData.lokasi || ''}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  placeholder="Contoh: Gedung Sekretariat SBN KASBI / Meeting Room PT VCI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Penanggung Jawab (PJ)</label>
                <input
                  type="text"
                  value={formData.penanggungJawab || ''}
                  onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Deskripsi Agenda & Pokok Pembahasan</label>
                <textarea
                  rows={3}
                  value={formData.deskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Deskripsi singkat tujuan kegiatan..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Simpan Agenda
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE AGENDA MODAL */}
      <ConfirmModal
        isOpen={!!deleteAgendaConfirmObj}
        title="Hapus Agenda Kegiatan"
        message={`Apakah Anda yakin ingin menghapus agenda kegiatan "${deleteAgendaConfirmObj?.judul}"?`}
        confirmText="Ya, Hapus Agenda"
        cancelText="Batal"
        type="danger"
        icon="trash"
        onConfirm={() => {
          if (deleteAgendaConfirmObj) {
            onDeleteAgenda(deleteAgendaConfirmObj.id);
            setDeleteAgendaConfirmObj(null);
          }
        }}
        onCancel={() => setDeleteAgendaConfirmObj(null)}
      />

    </div>
  );
};
