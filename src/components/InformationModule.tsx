import React, { useState } from 'react';
import { CalendarDays, Gift, Scale, HeartPulse, Car, Plus, Search, Info, Trash2, CheckCircle2 } from 'lucide-react';
import { OrganizationAgenda, SembakoEvent, AdvocacyCase, SickVisit, VehicleLog, UserAccount, checkIsSuperAdmin } from '../types';

interface InformationModuleProps {
  agendas: OrganizationAgenda[];
  sembakoEvents: SembakoEvent[];
  advocacyCases: AdvocacyCase[];
  sickVisits: SickVisit[];
  vehicleLogs: VehicleLog[];
  currentUser: UserAccount;
  onAddAgenda: (newAgenda: OrganizationAgenda) => void;
  onDeleteAgenda: (id: string) => void;
}

export const InformationModule: React.FC<InformationModuleProps> = ({
  agendas = [],
  sembakoEvents = [],
  advocacyCases = [],
  sickVisits = [],
  vehicleLogs = [],
  currentUser,
  onAddAgenda,
  onDeleteAgenda,
}) => {
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [isAddAgendaOpen, setIsAddAgendaOpen] = useState(false);
  const [newJudul, setNewJudul] = useState('');
  const [newLokasi, setNewLokasi] = useState('');
  const [newWaktu, setNewWaktu] = useState('');
  const [newDeskripsi, setNewDeskripsi] = useState('');

  // Active items calculations
  const activeAgendas = agendas.filter((a) => a.status !== 'Dibatalkan' && a.status !== 'Selesai');
  const [deleteAgendaConfirmObj, setDeleteAgendaConfirmObj] = useState<{ id: string; judul: string } | null>(null);

  const confirmDeleteAgenda = () => {
    if (deleteAgendaConfirmObj) {
      onDeleteAgenda(deleteAgendaConfirmObj.id);
      setDeleteAgendaConfirmObj(null);
    }
  };
  const activeSembako = sembakoEvents.filter((s) => s.status === 'Aktif');
  const activeAdvocacy = advocacyCases.filter((a) => a.status !== 'Selesai' && a.status !== 'Ditutup');
  const activeSickVisits = sickVisits.filter((s) => s.status !== 'Selesai');
  const activeVehicles = vehicleLogs.filter((v) => v.status === 'Sedang Digunakan');

  const totalActiveItems = 
    activeAgendas.length + 
    activeSembako.length + 
    activeAdvocacy.length + 
    activeSickVisits.length + 
    activeVehicles.length;

  const handleCreateAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !newJudul) return;

    const agd: OrganizationAgenda = {
      id: `agd-${Date.now()}`,
      judul: newJudul,
      jenis: 'Rapat',
      tanggalWaktu: newWaktu || new Date().toISOString().slice(0, 16),
      lokasi: newLokasi || 'Kantor Serikat SBN KASBI VCI',
      penanggungJawab: currentUser.name,
      deskripsi: newDeskripsi || 'Agenda Kegiatan Serikat',
      daftarPeserta: ['Pengurus Harian'],
      status: 'Akan Datang',
      notifikasiTerkirim: true
    };

    onAddAgenda(agd);
    setIsAddAgendaOpen(false);
    setNewJudul('');
    setNewLokasi('');
    setNewWaktu('');
    setNewDeskripsi('');
  };

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#3d0000] via-[#1a0000] to-[#0d0d0d] border border-red-900/60 rounded-2xl p-5 sm:p-6 text-white shadow-2xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-black uppercase mb-1">
            <Info className="w-4 h-4 text-red-500" />
            Pusat Informasi Active Activities
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-white">
            INFORMASI AGENDA & KEGIATAN SERIKAT
          </h1>
          <p className="text-xs text-gray-300 mt-0.5">
            Menampilkan seluruh agenda kegiatan, pembagian sembako, pendampingan advokasi, pendampingan anggota sakit, dan kendaraan operasional aktif.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsAddAgendaOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda Baru</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {totalActiveItems === 0 ? (
        <div className="bg-[#121212] border border-red-950/80 rounded-2xl p-12 text-center space-y-3 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-800 text-red-500 flex items-center justify-center mx-auto">
            <Info className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white uppercase">Belum Ada Informasi Kegiatan Aktif</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Saat ini tidak ada agenda kegiatan, pembagian sembako, pendampingan advokasi/sakit, maupun kendaraan yang sedang digunakan.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* 1. Agenda Kegiatan Aktif */}
          {activeAgendas.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-2 border-b border-red-950 pb-2">
                <CalendarDays className="w-4 h-4 text-red-500" />
                Agenda Kegiatan Serikat ({activeAgendas.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeAgendas.map((a) => (
                  <div key={a.id} className="bg-[#121212] border border-red-950 rounded-xl p-4 space-y-2 relative">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black text-white">{a.judul}</h3>
                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeleteAgendaConfirmObj({ id: a.id, judul: a.judul })}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          title="Hapus Agenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-300">{a.deskripsi}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-red-950">
                      <span>📍 {a.lokasi}</span>
                      <span className="text-red-400 font-mono font-bold">{a.tanggalWaktu}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Agenda Sembako Aktif */}
          {activeSembako.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-red-950 pb-2">
                <Gift className="w-4 h-4 text-amber-500" />
                Pembagian Sembako Aktif ({activeSembako.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSembako.map((s) => (
                  <div key={s.id} className="bg-[#121212] border border-amber-950/60 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-black text-white">{s.namaEvent}</h3>
                    <p className="text-xs text-gray-300">{s.jenisPaket}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-amber-950/40">
                      <span>📍 {s.lokasi}</span>
                      <span className="text-amber-400 font-bold">{s.totalSudahAmbil} / {s.totalPenerima} Ambil</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Advokasi Dalam Pendampingan */}
          {activeAdvocacy.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-red-950 pb-2">
                <Scale className="w-4 h-4 text-rose-500" />
                Pendampingan Advokasi Industrial ({activeAdvocacy.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeAdvocacy.map((adv) => (
                  <div key={adv.id} className="bg-[#121212] border border-rose-950/60 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-rose-400">
                      <span>{adv.nomorKasus}</span>
                      <span className="bg-rose-950 px-2 py-0.5 rounded border border-rose-800">{adv.status}</span>
                    </div>
                    <h3 className="text-sm font-black text-white">{adv.judulKasus}</h3>
                    <p className="text-xs text-gray-300">Anggota: {adv.namaAnggota} ({adv.nikAnggota})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Pendampingan Anggota Sakit */}
          {activeSickVisits.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-red-950 pb-2">
                <HeartPulse className="w-4 h-4 text-emerald-500" />
                Pendampingan Anggota Sakit ({activeSickVisits.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSickVisits.map((sv) => (
                  <div key={sv.id} className="bg-[#121212] border border-emerald-950/60 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-black text-white">{sv.namaAnggota}</h3>
                    <p className="text-xs text-gray-300">Lokasi Rawat: {sv.lokasi}</p>
                    <div className="text-[11px] text-emerald-400 font-bold">PJ: {sv.pengurusPenanggungJawab}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Kendaraan Operasional Digunakan */}
          {activeVehicles.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-red-950 pb-2">
                <Car className="w-4 h-4 text-blue-500" />
                Kendaraan Operasional Sedang Digunakan ({activeVehicles.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeVehicles.map((v) => (
                  <div key={v.id} className="bg-[#121212] border border-blue-950/60 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-400">
                      <span>{v.kendaraan} - {v.platNomor}</span>
                      <span>{v.jamMulai} WIB</span>
                    </div>
                    <p className="text-xs font-bold text-white">Pemakai: {v.namaPemakai}</p>
                    <p className="text-xs text-gray-400">Tujuan: {v.tujuan}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modal Input Agenda Baru */}
      {isAddAgendaOpen && (
        <div className="mobile-modal-backdrop">
          <form onSubmit={handleCreateAgenda} className="mobile-modal-card bg-[#121212] border border-red-950 text-white p-6 space-y-4 shadow-2xl relative max-w-md">
            <h3 className="text-base font-black text-white uppercase">Tambah Agenda Kegiatan Baru</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Judul Agenda</label>
                <input
                  type="text"
                  required
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  placeholder="e.g. Rapat Pleno Korlap Pabrik 1"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  value={newLokasi}
                  onChange={(e) => setNewLokasi(e.target.value)}
                  placeholder="e.g. Kantor Serikat SBN KASBI"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">Tanggal & Waktu</label>
                <input
                  type="datetime-local"
                  value={newWaktu}
                  onChange={(e) => setNewWaktu(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">Deskripsi Singkat</label>
                <textarea
                  value={newDeskripsi}
                  onChange={(e) => setNewDeskripsi(e.target.value)}
                  placeholder="Detail agenda kegiatan..."
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2 text-white h-20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddAgendaOpen(false)}
                className="px-4 py-2 bg-[#222] text-gray-300 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                Simpan Agenda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal Delete Agenda */}
      {deleteAgendaConfirmObj && (
        <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-[#121212] border border-red-950 text-white p-6 space-y-4 shadow-2xl max-w-sm">
            <h3 className="text-sm font-black text-red-500 uppercase">Konfirmasi Hapus Agenda</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Yakin ingin menghapus agenda &quot;{deleteAgendaConfirmObj.judul}&quot;? Data agenda dan notulensi terkait akan ikut terhapus dan tidak dapat dikembalikan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteAgendaConfirmObj(null)}
                className="px-4 py-2 bg-[#222] hover:bg-[#333] text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteAgenda}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
