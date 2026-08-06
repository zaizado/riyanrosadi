import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartHandshake, 
  Plus, 
  Search, 
  X, 
  Calendar, 
  UserCheck, 
  Building2, 
  Coins, 
  Hospital, 
  ShieldCheck, 
  Phone, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  FileText, 
  Share2, 
  Printer, 
  User, 
  BadgeDollarSign,
  Heart,
  ChevronRight,
  Flame
} from 'lucide-react';
import { 
  FundraisingCampaign, 
  Member, 
  UserAccount, 
  FamilyRelationship, 
  HealthCondition, 
  CampaignStatus 
} from '../types';
import { MemberSearchSelect } from './MemberSearchSelect';
import { ConfirmModal } from './ConfirmModal';

interface FundraisingModuleProps {
  campaigns: FundraisingCampaign[];
  members: Member[];
  currentUser: UserAccount;
  onAddCampaign: (campaign: FundraisingCampaign) => Promise<void>;
  onUpdateCampaign: (campaign: FundraisingCampaign) => Promise<void>;
  onDeleteCampaign: (id: string) => Promise<void>;
}

// Helper formatting rupiah
export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
};

// Helper parsing numeric from formatted string
export const parseRupiahInput = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const clean = val.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export const FundraisingModule: React.FC<FundraisingModuleProps> = ({
  campaigns,
  members,
  currentUser,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<FundraisingCampaign | null>(null);
  const [deleteTargetId, setDeleteCampaignId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<FundraisingCampaign | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKondisi, setFilterKondisi] = useState<string>('SEMUA');
  const [filterHubungan, setFilterHubungan] = useState<string>('SEMUA');
  const [filterPendampingan, setFilterPendampingan] = useState<string>('SEMUA');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');

  // Form inputs
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberObj, setSelectedMemberObj] = useState<Member | null>(null);
  
  const [hubungan, setHubungan] = useState<FamilyRelationship>('Anggota');
  const [kondisi, setKondisi] = useState<HealthCondition>('Sakit');
  const [keterangan, setKeterangan] = useState('');
  
  // PIC inputs
  const [picMemberId, setPicMemberId] = useState('');
  const [picNama, setPicNama] = useState(currentUser.name || '');
  const [picNik, setPicNik] = useState(currentUser.nik || '');

  const [tanggalDigalang, setTanggalDigalang] = useState(() => new Date().toISOString().slice(0, 10));
  const [jumlahTerkumpulStr, setJumlahTerkumpulStr] = useState('');
  const [isDidampingiKeRs, setIsDidampingiKeRs] = useState(true);
  const [status, setStatus] = useState<CampaignStatus>('Sedang Berjalan');

  // Open modal for new creation
  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setSelectedMemberId('');
    setSelectedMemberObj(null);
    setHubungan('Anggota');
    setKondisi('Sakit');
    setKeterangan('');
    setPicMemberId('');
    setPicNama(currentUser.name || '');
    setPicNik(currentUser.nik || '');
    setTanggalDigalang(new Date().toISOString().slice(0, 10));
    setJumlahTerkumpulStr('');
    setIsDidampingiKeRs(true);
    setStatus('Sedang Berjalan');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (camp: FundraisingCampaign) => {
    setEditingCampaign(camp);
    setSelectedMemberId(camp.memberId);
    
    const targetMbr = members.find(m => m.id === camp.memberId || m.nik === camp.nikAnggota);
    setSelectedMemberObj(targetMbr || null);
    
    setHubungan(camp.hubungan);
    setKondisi(camp.kondisi);
    setKeterangan(camp.keterangan);
    setPicMemberId(camp.picMemberId || '');
    setPicNama(camp.picNama);
    setPicNik(camp.picNik);
    setTanggalDigalang(camp.tanggalDigalang || new Date().toISOString().slice(0, 10));
    setJumlahTerkumpulStr(camp.jumlahTerkumpul ? camp.jumlahTerkumpul.toLocaleString('id-ID') : '');
    setIsDidampingiKeRs(camp.isDidampingiKeRs ?? true);
    setStatus(camp.status);
    setIsModalOpen(true);
  };

  // Handle member selection
  const handleSelectMember = (mbr: Member | null) => {
    setSelectedMemberObj(mbr);
    if (mbr) {
      setSelectedMemberId(mbr.id);
    } else {
      setSelectedMemberId('');
    }
  };

  // Handle PIC selection
  const handleSelectPicMember = (mbr: Member | null) => {
    if (mbr) {
      setPicMemberId(mbr.id);
      setPicNama(mbr.namaLengkap);
      setPicNik(mbr.nik);
    } else {
      setPicMemberId('');
      setPicNama(currentUser.name);
      setPicNik(currentUser.nik);
    }
  };

  // Handle Form Submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberObj) {
      alert('Silakan pilih Anggota yang digalang dana dari database terlebih dahulu.');
      return;
    }

    if (!picNama.trim()) {
      alert('Silakan isi atau pilih PIC Pengurus penggalangan dana.');
      return;
    }

    const nominalNum = parseRupiahInput(jumlahTerkumpulStr);

    if (editingCampaign) {
      const updated: FundraisingCampaign = {
        ...editingCampaign,
        memberId: selectedMemberObj.id,
        namaAnggota: selectedMemberObj.namaLengkap,
        nikAnggota: selectedMemberObj.nik,
        departemen: selectedMemberObj.departemen,
        nomorHp: selectedMemberObj.nomorHp || '-',
        hubungan,
        kondisi,
        keterangan: keterangan.trim(),
        picMemberId,
        picNama: picNama.trim(),
        picNik: picNik.trim(),
        tanggalDigalang,
        jumlahTerkumpul: nominalNum,
        isDidampingiKeRs,
        status,
        updatedAt: new Date().toISOString()
      };
      await onUpdateCampaign(updated);
    } else {
      const newId = `dana-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const newNomor = `DANA-${new Date().getFullYear()}-${String(campaigns.length + 1).padStart(3, '0')}`;
      const created: FundraisingCampaign = {
        id: newId,
        nomorPenggalangan: newNomor,
        memberId: selectedMemberObj.id,
        namaAnggota: selectedMemberObj.namaLengkap,
        nikAnggota: selectedMemberObj.nik,
        departemen: selectedMemberObj.departemen,
        nomorHp: selectedMemberObj.nomorHp || '-',
        hubungan,
        kondisi,
        keterangan: keterangan.trim(),
        picMemberId,
        picNama: picNama.trim(),
        picNik: picNik.trim(),
        tanggalDigalang,
        jumlahTerkumpul: nominalNum,
        isDidampingiKeRs,
        status,
        dibuatOleh: currentUser.name,
        createdAt: new Date().toISOString()
      };
      await onAddCampaign(created);
    }

    setIsModalOpen(false);
  };

  // Filter Logic
  const filteredCampaigns = campaigns.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      !q ||
      c.namaAnggota.toLowerCase().includes(q) ||
      c.nikAnggota.toLowerCase().includes(q) ||
      c.nomorPenggalangan.toLowerCase().includes(q) ||
      c.departemen.toLowerCase().includes(q) ||
      c.picNama.toLowerCase().includes(q) ||
      c.picNik.toLowerCase().includes(q) ||
      c.keterangan.toLowerCase().includes(q);

    const matchKondisi = filterKondisi === 'SEMUA' || c.kondisi === filterKondisi;
    const matchHubungan = filterHubungan === 'SEMUA' || c.hubungan === filterHubungan;
    const matchPendampingan = 
      filterPendampingan === 'SEMUA' || 
      (filterPendampingan === 'DIDAMPINGI' && c.isDidampingiKeRs) ||
      (filterPendampingan === 'TIDAK_DIDAMPINGI' && !c.isDidampingiKeRs);

    const matchStatus = filterStatus === 'SEMUA' || c.status === filterStatus;

    return matchSearch && matchKondisi && matchHubungan && matchPendampingan && matchStatus;
  });

  // Calculate statistics
  const totalCampaigns = campaigns.length;
  const totalDanaTerkumpul = campaigns.reduce((acc, curr) => acc + (curr.jumlahTerkumpul || 0), 0);
  const totalSakit = campaigns.filter(c => c.kondisi === 'Sakit').length;
  const totalMeninggal = campaigns.filter(c => c.kondisi === 'Meninggal').length;
  const totalDidampingi = campaigns.filter(c => c.isDidampingiKeRs).length;

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-red-700 via-red-800 to-slate-900 text-white rounded-3xl shadow-xl border border-red-600/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5" /> Solidaritas & Santunan Sosial
              </span>
              <span className="text-[10px] text-red-200 font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                SBN KASBI PT VCI
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              Pusat Penggalangan Dana & Santunan
            </h1>
            <p className="text-xs text-red-100/90 max-w-2xl leading-relaxed">
              Pencatatan resmi penggalangan dana musibah sakit/duka meninggal dunia untuk Anggota & Keluarga, pencatatan PIC Pengurus, serta verifikasi pendampingan rumah sakit.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-yellow-300/50"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Penggalangan Dana</span>
          </button>
        </div>
      </div>

      {/* Stats Widget Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-red-300 transition-all space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Program</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCampaigns}</p>
          <p className="text-[10px] text-slate-500">Penggalangan Dana Dicatat</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 rounded-2xl shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400">Dana Terkumpul</span>
            <div className="p-2 rounded-xl bg-yellow-400/20 text-yellow-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-yellow-400 truncate">{formatRupiah(totalDanaTerkumpul)}</p>
          <p className="text-[10px] text-slate-300">Total Donasi Terdistribusi</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-300 transition-all space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Kasus Sakit</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Hospital className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{totalSakit}</p>
          <p className="text-[10px] text-slate-500">Anggota / Keluarga Sakit</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-rose-300 transition-all space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Duka / Meninggal</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600">{totalMeninggal}</p>
          <p className="text-[10px] text-slate-500">Santunan Meninggal Dunia</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-300 transition-all space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Didampingi RS</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalDidampingi}</p>
          <p className="text-[10px] text-slate-500">Didampingi Ke RS oleh Pengurus</p>
        </div>

      </div>

      {/* Filter and Search Section */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIK, Nama Anggota, PIC Pengurus, Nomor Dana, atau Keterangan..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Filter Penggalangan:</span>
          </div>

        </div>

        {/* Filter Badges Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          
          {/* Kondisi */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Kondisi</label>
            <select
              value={filterKondisi}
              onChange={(e) => setFilterKondisi(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="SEMUA">Semua Kondisi</option>
              <option value="Sakit">Sakit</option>
              <option value="Meninggal">Meninggal Dunia</option>
            </select>
          </div>

          {/* Hubungan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Hubungan Keluarga</label>
            <select
              value={filterHubungan}
              onChange={(e) => setFilterHubungan(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="SEMUA">Semua Hubungan</option>
              <option value="Anggota">Anggota Lengkap</option>
              <option value="Anak">Anak</option>
              <option value="Istri">Istri</option>
              <option value="Suami">Suami</option>
              <option value="Orang Tua">Orang Tua</option>
            </select>
          </div>

          {/* Pendampingan RS */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Pendampingan RS</label>
            <select
              value={filterPendampingan}
              onChange={(e) => setFilterPendampingan(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="SEMUA">Semua Status RS</option>
              <option value="DIDAMPINGI">Didampingi Pengurus</option>
              <option value="TIDAK_DIDAMPINGI">Tidak Didampingi</option>
            </select>
          </div>

          {/* Status Program */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Status Program</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditutup">Ditutup</option>
            </select>
          </div>

        </div>
      </div>

      {/* Campaign List Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h3 className="font-black text-slate-800 text-base">Belum Ada Data Penggalangan Dana</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || filterKondisi !== 'SEMUA' || filterHubungan !== 'SEMUA'
              ? 'Tidak ditemukan penggalangan dana yang sesuai dengan kata kunci atau filter yang Anda pilih.'
              : 'Belum ada program penggalangan dana yang dibuat. Klik tombol di bawah untuk membuat pencatatan pertama.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Penggalangan Dana</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((camp) => {
            const isSakit = camp.kondisi === 'Sakit';

            return (
              <motion.div
                key={camp.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 hover:border-red-300 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                
                {/* Card Top Header */}
                <div className={`p-4 border-b flex items-start justify-between gap-2 ${
                  isSakit 
                    ? 'bg-amber-50/70 border-amber-200/80' 
                    : 'bg-rose-50/70 border-rose-200/80'
                }`}>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        {camp.nomorPenggalangan}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        isSakit 
                          ? 'bg-amber-100 text-amber-900 border-amber-300' 
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}>
                        {camp.kondisi === 'Sakit' ? '🏥 Sakit' : '🖤 Meninggal'}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
                        {camp.hubungan}
                      </span>
                    </div>

                    <h3 className="font-black text-sm text-slate-900 truncate mt-1">
                      {camp.namaAnggota}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                    camp.status === 'Sedang Berjalan'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : camp.status === 'Selesai'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}>
                    {camp.status}
                  </span>
                </div>

                {/* Card Body Details */}
                <div className="p-4 space-y-3 flex-1 text-xs text-slate-700">
                  
                  {/* Anggota Info */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">NIK Anggota:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {camp.nikAnggota}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Departemen:</span>
                      <span className="font-bold text-slate-800">{camp.departemen}</span>
                    </div>
                    {camp.nomorHp && camp.nomorHp !== '-' && (
                      <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-200/60">
                        <span className="text-slate-500 font-semibold">Kontak WA:</span>
                        <a
                          href={`https://wa.me/${camp.nomorHp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{camp.nomorHp}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Keterangan Musibah */}
                  {camp.keterangan && (
                    <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed italic">
                      "{camp.keterangan}"
                    </div>
                  )}

                  {/* PIC Pengurus & Tanggal */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">PIC Penggalangan:</span>
                      <span className="font-bold text-slate-800 truncate block mt-0.5">{camp.picNama}</span>
                      <span className="font-mono text-[9px] text-slate-500 block">NIK: {camp.picNik}</span>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Tanggal Digalang:</span>
                      <span className="font-bold text-slate-800 block mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-red-600 shrink-0" />
                        <span>{camp.tanggalDigalang}</span>
                      </span>
                    </div>
                  </div>

                  {/* Pendampingan RS Badge */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                    camp.isDidampingiKeRs
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                      : 'bg-slate-100 border-slate-200 text-slate-600 font-medium'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {camp.isDidampingiKeRs ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>
                        {camp.isDidampingiKeRs 
                          ? 'Didampingi Pengurus ke RS' 
                          : 'Tidak Didampingi ke RS'}
                      </span>
                    </div>
                    {camp.isDidampingiKeRs && (
                      <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                        VERIFIED
                      </span>
                    )}
                  </div>

                  {/* Big Total Terkumpul Box */}
                  <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl border border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block">Total Dana Terkumpul:</span>
                      <span className="text-base font-black text-yellow-400">
                        {formatRupiah(camp.jumlahTerkumpul || 0)}
                      </span>
                    </div>
                    <div className="p-2 bg-yellow-400/20 text-yellow-400 rounded-lg">
                      <Coins className="w-5 h-5" />
                    </div>
                  </div>

                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedReceipt(camp)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Struk / Bukti</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(camp)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-colors"
                      title="Edit / Update Nominal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteCampaignId(camp.id)}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg cursor-pointer transition-colors"
                      title="Hapus Penggalangan Dana"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-red-700 to-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-yellow-400 text-slate-900 font-bold">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-wide text-white">
                      {editingCampaign ? 'Edit Data Penggalangan Dana' : 'Buat Penggalangan Dana Baru'}
                    </h3>
                    <p className="text-[11px] text-red-200">
                      Isi data anggota musibah, PIC penggalangan, dan nominal dana terkumpul.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-800">
                
                {/* 1. Target Member Selection */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-slate-800 font-extrabold text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-red-600">
                      <User className="w-4 h-4" /> 1. Target Anggota (Yang Digalang Dana)
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Mencari NIK dari database</span>
                  </div>

                  <MemberSearchSelect
                    members={members}
                    selectedMemberId={selectedMemberId}
                    onSelectMember={handleSelectMember}
                    label="Pilih / Cari NIK / Nama Anggota"
                    placeholder="Ketik NIK atau Nama Anggota..."
                    required={true}
                  />

                  {selectedMemberObj && (
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900">{selectedMemberObj.namaLengkap}</span>
                        <span className="font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          NIK: {selectedMemberObj.nik}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex justify-between">
                        <span>Dept: <strong>{selectedMemberObj.departemen}</strong> ({selectedMemberObj.bagian || 'Line'})</span>
                        <span>No HP: <strong>{selectedMemberObj.nomorHp || '-'}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Hubungan & Kondisi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Pilihan Hubungan */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Hubungan (Yang Sakit / Meninggal) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {(['Anggota', 'Anak', 'Istri', 'Suami', 'Orang Tua'] as FamilyRelationship[]).map((rel) => {
                        const isSelected = hubungan === rel;
                        return (
                          <button
                            key={rel}
                            type="button"
                            onClick={() => setHubungan(rel)}
                            className={`py-2 px-1.5 rounded-xl font-extrabold text-[11px] text-center border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {rel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pilihan Kondisi */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Kondisi Musibah <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setKondisi('Sakit')}
                        className={`py-2.5 px-3 rounded-xl font-black text-xs text-center border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          kondisi === 'Sakit'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Hospital className="w-4 h-4" />
                        <span>Sakit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setKondisi('Meninggal')}
                        className={`py-2.5 px-3 rounded-xl font-black text-xs text-center border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          kondisi === 'Meninggal'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                        <span>Meninggal</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* 3. Keterangan Detail */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Keterangan Musibah / Lokasi RS / Penyebab
                  </label>
                  <textarea
                    rows={2}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Sakit DBD dirawat di RS Hermina Bitung, atau Duka meninggal dunia di rumah duka..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* 4. PIC Penggalangan Dana */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-slate-800 font-extrabold text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-red-600">
                      <UserCheck className="w-4 h-4" /> 2. PIC Penggalangan Dana (Pengurus / Penanggung Jawab)
                    </span>
                  </div>

                  <MemberSearchSelect
                    members={members}
                    selectedMemberId={picMemberId}
                    onSelectMember={handleSelectPicMember}
                    label="Pilih PIC Pengurus dari Database"
                    placeholder="Ketik NIK atau Nama Pengurus/PIC..."
                    required={false}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama PIC Pengurus</label>
                      <input
                        type="text"
                        value={picNama}
                        onChange={(e) => setPicNama(e.target.value)}
                        placeholder="Nama PIC..."
                        required
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">NIK PIC Pengurus</label>
                      <input
                        type="text"
                        value={picNik}
                        onChange={(e) => setPicNik(e.target.value)}
                        placeholder="NIK PIC..."
                        required
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Tanggal & Nominal Uang Rupiah */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Tanggal Digalang Dana */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Tanggal Digalang Dana <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={tanggalDigalang}
                      onChange={(e) => setTanggalDigalang(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Nominal Terkumpul */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Jumlah Penggalangan Dana Terkumpul (Rupiah) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-500 text-xs">Rp</span>
                      <input
                        type="text"
                        value={jumlahTerkumpulStr}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = parseRupiahInput(val);
                          setJumlahTerkumpulStr(num ? num.toLocaleString('id-ID') : '');
                        }}
                        placeholder="e.g. 1.500.000"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    {jumlahTerkumpulStr && (
                      <p className="text-[10px] text-emerald-600 font-bold">
                        Terformat: {formatRupiah(parseRupiahInput(jumlahTerkumpulStr))}
                      </p>
                    )}
                  </div>

                </div>

                {/* 6. Pendampingan Ke RS oleh Pengurus */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Apakah Anggota ini sakit didampingi ke RS oleh Pengurus? <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDidampingiKeRs(true)}
                      className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        isDidampingiKeRs
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Ya, Didampingi Pengurus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDidampingiKeRs(false)}
                      className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        !isDidampingiKeRs
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Tidak Didampingi</span>
                    </button>
                  </div>
                </div>

                {/* 7. Status Penggalangan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Status Program Penggalangan Dana</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                  >
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai / Terdistribusi</option>
                    <option value="Ditutup">Ditutup</option>
                  </select>
                </div>

                {/* Submit Actions */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingCampaign ? 'Simpan Perubahan' : 'Simpan Penggalangan Dana'}</span>
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECEIPT / BUKTI STRUK MODAL */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-300 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-extrabold text-[10px] uppercase">
                  SERIKAT BURUH NASIONAL KASBI PT VCI
                </span>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  TANDA BUKTI PENGGALANGAN DANA
                </h3>
                <p className="font-mono text-xs text-slate-500 font-bold">{selectedReceipt.nomorPenggalangan}</p>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Anggota Penerima:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.namaAnggota}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIK / Dept:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedReceipt.nikAnggota} ({selectedReceipt.departemen})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hubungan / Kondisi:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.hubungan} ({selectedReceipt.kondisi})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PIC Pengurus:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.picNama} ({selectedReceipt.picNik})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Digalang:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.tanggalDigalang}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pendampingan RS:</span>
                  <span className={`font-bold ${selectedReceipt.isDidampingiKeRs ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {selectedReceipt.isDidampingiKeRs ? 'Didampingi Pengurus' : 'Tidak Didampingi'}
                  </span>
                </div>

                {selectedReceipt.keterangan && (
                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 italic border border-slate-200 my-2">
                    "{selectedReceipt.keterangan}"
                  </div>
                )}

                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-xl text-center space-y-0.5 mt-2">
                  <span className="text-[10px] text-yellow-800 font-bold uppercase tracking-wider block">Jumlah Dana Terkumpul:</span>
                  <span className="text-xl font-black text-slate-900 block">
                    {formatRupiah(selectedReceipt.jumlahTerkumpul || 0)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk</span>
                </button>

                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Penggalangan Dana"
        message="Apakah Anda yakin ingin menghapus data penggalangan dana ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={async () => {
          if (deleteTargetId) {
            await onDeleteCampaign(deleteTargetId);
            setDeleteCampaignId(null);
          }
        }}
        onCancel={() => setDeleteCampaignId(null)}
      />

    </div>
  );
};
