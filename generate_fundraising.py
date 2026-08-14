import os

content = """import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartHandshake, Plus, Search, X, Calendar, UserCheck, 
  Building2, Coins, Hospital, ShieldCheck, Phone, Edit3, 
  Trash2, CheckCircle2, AlertCircle, Filter, FileText, 
  Share2, Printer, User, BadgeDollarSign, Heart, ChevronRight, 
  Flame, ClipboardCheck, ArrowRight, Save, DollarSign, Wallet,
  Map as MapIcon, Users
} from 'lucide-react';
import { 
  FundraisingCampaign, Member, UserAccount, FamilyRelationship, 
  HealthCondition, CampaignStatus, SickVisit,
  FundraisingTahapProses, StatusMinimumSop, SumberDanaFundraising,
  FundraisingMapSosialisasi, FundraisingDistribusiDepartemen, FundraisingPenyerahanDana
} from '../types';
import { getLocalDateISO } from '../utils/dateUtils';
import { MemberSearchSelect } from './MemberSearchSelect';
import { ConfirmModal } from './ConfirmModal';

interface FundraisingModuleProps {
  campaigns: FundraisingCampaign[];
  members: Member[];
  sickVisits: SickVisit[];
  currentUser: UserAccount;
  onAddCampaign: (campaign: FundraisingCampaign) => Promise<void>;
  onUpdateCampaign: (campaign: FundraisingCampaign) => Promise<void>;
  onDeleteCampaign: (id: string) => Promise<void>;
}

export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
};

export const parseRupiahInput = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const clean = val.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

// BUSINESS LOGIC: FORMULA MINIMUM SOP
export const calculateFundraisingMinimum = (
  kondisi: HealthCondition, 
  isRawatInap: boolean, 
  isDidampingiKeRs: boolean
): number => {
  if (kondisi === 'Meninggal') return 300000;
  if (kondisi === 'Sakit') {
    if (!isRawatInap) return 0; // Not strictly SOP for fundraising, need verif
    if (isDidampingiKeRs) return 100000; // Didampingi RS
    return 200000; // Tidak didampingi RS
  }
  return 0;
};

export const FundraisingModule: React.FC<FundraisingModuleProps> = ({
  campaigns,
  members,
  sickVisits,
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

  // FORM INPUTS
  const [tahapProses, setTahapProses] = useState<FundraisingTahapProses>('DRAFT');
  
  // 1. Identitas Musibah
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberObj, setSelectedMemberObj] = useState<Member | null>(null);
  const [jenisPenerima, setJenisPenerima] = useState<'Anggota' | 'Keluarga'>('Anggota');
  const [namaPasien, setNamaPasien] = useState('');
  const [hubungan, setHubungan] = useState<FamilyRelationship | string>('Anggota');
  const [statusVerifikasiKeluarga, setStatusVerifikasiKeluarga] = useState<'Belum Diverifikasi' | 'Valid' | 'Perlu Verifikasi Pengurus'>('Belum Diverifikasi');
  
  // 2. Validasi SOP & Kondisi
  const [kondisi, setKondisi] = useState<HealthCondition>('Sakit');
  const [isRawatInap, setIsRawatInap] = useState<boolean>(false);
  const [keterangan, setKeterangan] = useState('');
  const [tanggalDigalang, setTanggalDigalang] = useState(() => getLocalDateISO());
  
  // 3. Pendampingan RS
  const [sickVisitId, setSickVisitId] = useState<string>('');
  const [nomorPendampingan, setNomorPendampingan] = useState<string>('');
  const [isDidampingiKeRs, setIsDidampingiKeRs] = useState(false);

  // 4. Sumber Dana
  const [sumberDana, setSumberDana] = useState<SumberDanaFundraising[]>(['Sukarela Karyawan']);
  
  // 5. PIC
  const [picMemberId, setPicMemberId] = useState('');
  const [picNama, setPicNama] = useState(currentUser.name || '');
  const [picNik, setPicNik] = useState(currentUser.nik || '');

  // 6. Map Sosialisasi
  const [mapSosialisasi, setMapSosialisasi] = useState<FundraisingMapSosialisasi>({
    dibuat: false, checklistDiisi: false, diedarkan: false, dikembalikan: false
  });

  // 7. Distribusi Departemen
  const [distribusiDepartemen, setDistribusiDepartemen] = useState<FundraisingDistribusiDepartemen[]>([]);
  
  // 8. DDU
  const [statusVerifikasiDdu, setStatusVerifikasiDdu] = useState<'Belum Diverifikasi' | 'Diverifikasi DDU'>('Belum Diverifikasi');

  // 9. Penyerahan Dana
  const [penyerahanDana, setPenyerahanDana] = useState<FundraisingPenyerahanDana>({
    status: 'Belum Diserahkan'
  });

  // Derived calculations
  const minimumSesuaiSop = calculateFundraisingMinimum(kondisi, isRawatInap, isDidampingiKeRs);
  
  // Total Terkumpul: if dist exists, sum them. Else manual.
  const [manualJumlahTerkumpulStr, setManualJumlahTerkumpulStr] = useState('');
  const calculatedJumlahTerkumpul = distribusiDepartemen.reduce((acc, curr) => acc + curr.jumlahDana, 0);
  const jumlahTerkumpul = distribusiDepartemen.length > 0 ? calculatedJumlahTerkumpul : parseRupiahInput(manualJumlahTerkumpulStr);
  
  const statusMinimum: StatusMinimumSop = 
    (kondisi === 'Sakit' && !isRawatInap) ? 'Perlu Verifikasi Pengurus' :
    (jumlahTerkumpul >= minimumSesuaiSop && minimumSesuaiSop > 0) ? 'Memenuhi Minimum SOP' :
    'Belum Memenuhi Minimum SOP';

  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('Sedang Berjalan');

  // Sync jenis penerima -> hubungan
  useEffect(() => {
    if (jenisPenerima === 'Anggota') {
      setHubungan('Anggota');
      if (selectedMemberObj) setNamaPasien(selectedMemberObj.namaLengkap);
    } else {
      if (hubungan === 'Anggota') setHubungan('Anak');
      if (selectedMemberObj && namaPasien === selectedMemberObj.namaLengkap) setNamaPasien('');
    }
  }, [jenisPenerima, selectedMemberObj]);

  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setSelectedMemberId('');
    setSelectedMemberObj(null);
    setJenisPenerima('Anggota');
    setNamaPasien('');
    setHubungan('Anggota');
    setStatusVerifikasiKeluarga('Belum Diverifikasi');
    setKondisi('Sakit');
    setIsRawatInap(false);
    setKeterangan('');
    setTanggalDigalang(getLocalDateISO());
    setSickVisitId('');
    setNomorPendampingan('');
    setIsDidampingiKeRs(false);
    setSumberDana(['Sukarela Karyawan']);
    setPicMemberId('');
    setPicNama(currentUser.name || '');
    setPicNik(currentUser.nik || '');
    setMapSosialisasi({ dibuat: false, checklistDiisi: false, diedarkan: false, dikembalikan: false });
    setDistribusiDepartemen([]);
    setStatusVerifikasiDdu('Belum Diverifikasi');
    setPenyerahanDana({ status: 'Belum Diserahkan' });
    setManualJumlahTerkumpulStr('');
    setTahapProses('DRAFT');
    setCampaignStatus('Sedang Berjalan');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (camp: FundraisingCampaign) => {
    setEditingCampaign(camp);
    setSelectedMemberId(camp.memberId);
    const targetMbr = members.find(m => m.id === camp.memberId || m.nik === camp.nikAnggota);
    setSelectedMemberObj(targetMbr || null);
    setJenisPenerima(camp.jenisPenerima || (camp.hubungan === 'Anggota' ? 'Anggota' : 'Keluarga'));
    setNamaPasien(camp.namaPasien || (camp.hubungan === 'Anggota' ? camp.namaAnggota : ''));
    setHubungan(camp.hubungan);
    setStatusVerifikasiKeluarga(camp.statusVerifikasiKeluarga || 'Belum Diverifikasi');
    setKondisi(camp.kondisi);
    setIsRawatInap(camp.isRawatInap ?? (camp.kondisi === 'Sakit')); // fallback
    setKeterangan(camp.keterangan);
    setTanggalDigalang(camp.tanggalDigalang || getLocalDateISO());
    setSickVisitId(camp.sickVisitId || '');
    setNomorPendampingan(camp.nomorPendampingan || '');
    setIsDidampingiKeRs(camp.isDidampingiKeRs ?? false);
    setSumberDana(camp.sumberDana || ['Sukarela Karyawan']);
    setPicMemberId(camp.picMemberId || '');
    setPicNama(camp.picNama);
    setPicNik(camp.picNik);
    setMapSosialisasi(camp.mapSosialisasi || { dibuat: false, checklistDiisi: false, diedarkan: false, dikembalikan: false });
    setDistribusiDepartemen(camp.distribusiDepartemen || []);
    setStatusVerifikasiDdu(camp.statusVerifikasiDdu || 'Belum Diverifikasi');
    setPenyerahanDana(camp.penyerahanDana || { status: 'Belum Diserahkan' });
    setManualJumlahTerkumpulStr(camp.jumlahTerkumpul ? camp.jumlahTerkumpul.toString() : '');
    setTahapProses(camp.tahapProses || 'LEGACY');
    setCampaignStatus(camp.status || 'Sedang Berjalan');
    setIsModalOpen(true);
  };

  const handleSelectMember = (mbr: Member | null) => {
    setSelectedMemberObj(mbr);
    if (mbr) {
      setSelectedMemberId(mbr.id);
      if (jenisPenerima === 'Anggota') setNamaPasien(mbr.namaLengkap);
    } else {
      setSelectedMemberId('');
      setNamaPasien('');
    }
  };

  const handleSelectSickVisit = (svId: string) => {
    setSickVisitId(svId);
    if (!svId) {
      setNomorPendampingan('');
      setIsDidampingiKeRs(false);
      return;
    }
    const sv = sickVisits.find(s => s.id === svId);
    if (sv) {
      setNomorPendampingan(sv.nomorPendampingan);
      setIsDidampingiKeRs(true);
      if (sv.kebutuhanPendampingan?.toLowerCase().includes('inap') || sv.kondisiTerbaru?.toLowerCase().includes('inap')) {
          setIsRawatInap(true);
      }
    }
  };

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

  const addDepartmentDist = () => {
    const newId = Date.now().toString();
    setDistribusiDepartemen([...distribusiDepartemen, {
      id: newId,
      namaDepartemen: '',
      statusMap: 'Belum Diedarkan',
      jumlahDana: 0
    }]);
  };

  const updateDepartmentDist = (id: string, updates: Partial<FundraisingDistribusiDepartemen>) => {
    setDistribusiDepartemen(distribusiDepartemen.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const removeDepartmentDist = (id: string) => {
    setDistribusiDepartemen(distribusiDepartemen.filter(d => d.id !== id));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberObj) {
      alert('Silakan pilih Anggota yang digalang dana dari database terlebih dahulu.');
      return;
    }

    if (jenisPenerima === 'Keluarga' && !namaPasien.trim()) {
      alert('Silakan isi nama pasien (keluarga).');
      return;
    }

    if (!picNama.trim()) {
      alert('Silakan isi atau pilih PIC Pengurus penggalangan dana.');
      return;
    }

    if (tahapProses === 'SELESAI' && penyerahanDana.status !== 'Sudah Diserahkan' && tahapProses !== 'LEGACY') {
      alert('Tidak dapat mengubah status menjadi SELESAI jika penyerahan dana belum diserahkan.');
      return;
    }

    const payload: FundraisingCampaign = {
      ...(editingCampaign || {}),
      id: editingCampaign ? editingCampaign.id : `DANA-${Date.now()}`,
      nomorPenggalangan: editingCampaign ? editingCampaign.nomorPenggalangan : `DANA-${new Date().getFullYear()}-${Math.floor(Math.random()*1000).toString().padStart(3, '0')}`,
      memberId: selectedMemberObj.id,
      namaAnggota: selectedMemberObj.namaLengkap,
      nikAnggota: selectedMemberObj.nik,
      departemen: selectedMemberObj.departemen,
      nomorHp: selectedMemberObj.nomorHp || '-',
      hubungan: (hubungan as FamilyRelationship),
      kondisi,
      keterangan: keterangan.trim(),
      picMemberId,
      picNama: picNama.trim(),
      picNik: picNik.trim(),
      tanggalDigalang,
      jumlahTerkumpul,
      isDidampingiKeRs,
      status: campaignStatus,
      dibuatOleh: editingCampaign ? editingCampaign.dibuatOleh : currentUser.name,
      createdAt: editingCampaign ? editingCampaign.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      jenisPenerima,
      namaPasien,
      hubunganPasien: hubungan,
      statusVerifikasiKeluarga: jenisPenerima === 'Anggota' ? 'Valid' : statusVerifikasiKeluarga,
      isRawatInap,
      sickVisitId,
      nomorPendampingan,
      minimumSesuaiSop,
      statusMinimum,
      sumberDana,
      mapSosialisasi,
      distribusiDepartemen,
      penanggungJawabDduNama: statusVerifikasiDdu === 'Diverifikasi DDU' ? (editingCampaign?.penanggungJawabDduNama || currentUser.name) : '',
      statusVerifikasiDdu,
      tahapProses,
      penyerahanDana,
    };

    try {
      if (editingCampaign) {
        await onUpdateCampaign(payload);
      } else {
        await onAddCampaign(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchQuery = c.namaAnggota.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.nomorPenggalangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (c.namaPasien || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchKondisi = filterKondisi === 'SEMUA' || c.kondisi === filterKondisi;
      const matchHubungan = filterHubungan === 'SEMUA' || c.hubungan === filterHubungan;
      const matchPendampingan = filterPendampingan === 'SEMUA' || 
                                (filterPendampingan === 'YA' && c.isDidampingiKeRs) || 
                                (filterPendampingan === 'TIDAK' && !c.isDidampingiKeRs);
      const matchStatus = filterStatus === 'SEMUA' || c.status === filterStatus;
      
      return matchQuery && matchKondisi && matchHubungan && matchPendampingan && matchStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [campaigns, searchQuery, filterKondisi, filterHubungan, filterPendampingan, filterStatus]);

  // UI rendering helper for fallback
  const getPasienName = (c: FundraisingCampaign) => {
    if (c.namaPasien) return c.namaPasien;
    return c.hubungan === 'Anggota' ? c.namaAnggota : 'Belum Dicatat';
  };

  const getTahapLabel = (tahap?: string) => {
    if (!tahap || tahap === 'LEGACY') return 'Data Legacy';
    return tahap;
  };

  // The rest of UI components
"""

content += """
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header Module */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-lg shadow-red-900/50 shrink-0">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Penggalangan Dana
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modul Resmi KASBI PT VCI - Sesuai SOP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Buat Penggalangan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nomor, anggota, atau pasien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-600"
          />
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="SEMUA" className="bg-slate-800">Semua Status</option>
              <option value="Sedang Berjalan" className="bg-slate-800">Sedang Berjalan</option>
              <option value="Selesai" className="bg-slate-800">Selesai</option>
              <option value="Ditutup" className="bg-slate-800">Ditutup</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterKondisi}
              onChange={(e) => setFilterKondisi(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="SEMUA" className="bg-slate-800">Semua Kondisi</option>
              <option value="Sakit" className="bg-slate-800">Sakit</option>
              <option value="Meninggal" className="bg-slate-800">Meninggal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredCampaigns.map((camp) => (
            <motion.div
              key={camp.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col group relative"
            >
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono border border-slate-700">
                      {camp.nomorPenggalangan}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      camp.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      camp.status === 'Ditutup' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                      'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                    {getPasienName(camp)}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{camp.departemen}</span>
                  </div>
                </div>
                
                <div className={`p-2.5 rounded-xl border shadow-inner ${
                  camp.kondisi === 'Sakit' 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  <Hospital className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide font-semibold">Terkumpul</p>
                    <p className="text-sm font-black text-emerald-400">{formatRupiah(camp.jumlahTerkumpul)}</p>
                  </div>
                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide font-semibold">Tahap</p>
                    <p className="text-xs font-bold text-slate-300">{getTahapLabel(camp.tahapProses)}</p>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between items-center bg-slate-800/30 py-1.5 px-2 rounded-lg">
                    <span className="text-slate-400">Hubungan</span>
                    <span className="font-semibold">{camp.hubungan}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/30 py-1.5 px-2 rounded-lg">
                    <span className="text-slate-400">Min. SOP</span>
                    <span className="font-semibold">{camp.minimumSesuaiSop ? formatRupiah(camp.minimumSesuaiSop) : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/30 py-1.5 px-2 rounded-lg">
                    <span className="text-slate-400">Pendampingan RS</span>
                    {camp.isDidampingiKeRs ? (
                      <span className="font-semibold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ya</span>
                    ) : (
                      <span className="font-semibold text-rose-400 flex items-center gap-1"><X className="w-3 h-3"/> Tidak</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-slate-800/80 bg-slate-900/80 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedReceipt(camp)}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase">Detail</span>
                </button>
                <button
                  onClick={() => handleOpenEditModal(camp)}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase">Edit</span>
                </button>
                <button
                  onClick={() => setDeleteCampaignId(camp.id)}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase">Hapus</span>
                </button>
              </div>
            </motion.div>
          ))}
          {filteredCampaigns.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800/50 border-dashed">
              <HeartHandshake className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Tidak ada data penggalangan dana ditemukan.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

"""

content += """
      {/* Modal Detail Receipt */
      selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
          <div className="bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Detail Penggalangan
              </h2>
              <button onClick={() => setSelectedReceipt(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-6">
              {/* Header Info */}
              <div className="text-center space-y-2">
                <div className="inline-flex px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-mono font-bold text-slate-300">
                  {selectedReceipt.nomorPenggalangan}
                </div>
                <h3 className="text-2xl font-black text-white">{getPasienName(selectedReceipt)}</h3>
                <p className="text-sm text-slate-400">
                  {selectedReceipt.hubungan === 'Anggota' ? 'Anggota' : `Keluarga (${selectedReceipt.hubungan}) dari ${selectedReceipt.namaAnggota}`}
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mt-2 ${
                  selectedReceipt.status === 'Selesai' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedReceipt.status === 'Ditutup' ? 'bg-slate-800 text-slate-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  Status: {selectedReceipt.status}
                </span>
              </div>

              {/* Grid 2 Column */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Kondisi</p>
                  <p className="text-sm font-semibold">{selectedReceipt.kondisi}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Rawat Inap</p>
                  <p className="text-sm font-semibold">{selectedReceipt.isRawatInap ? 'Ya' : 'Tidak / Meninggal'}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pendampingan RS</p>
                  <p className="text-sm font-semibold">{selectedReceipt.isDidampingiKeRs ? 'Ya' : 'Tidak'}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Tahap SOP</p>
                  <p className="text-sm font-semibold text-indigo-400">{getTahapLabel(selectedReceipt.tahapProses)}</p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
                  Rincian Dana
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-sm text-slate-400">Minimum SOP</span>
                    <span className="font-semibold text-slate-200">{selectedReceipt.minimumSesuaiSop ? formatRupiah(selectedReceipt.minimumSesuaiSop) : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-sm text-slate-400">Terkumpul</span>
                    <span className="font-bold text-emerald-400">{formatRupiah(selectedReceipt.jumlahTerkumpul)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Status Minimum</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      selectedReceipt.statusMinimum === 'Memenuhi Minimum SOP' ? 'bg-emerald-500/20 text-emerald-400' :
                      selectedReceipt.statusMinimum === 'Belum Memenuhi Minimum SOP' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{selectedReceipt.statusMinimum || 'Legacy'}</span>
                  </div>
                </div>
              </div>
              
              {/* Other detail sections like Map, DDU can go here similarly */}
              
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 text-center">
                <button onClick={() => setSelectedReceipt(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">
                  Tutup
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Data Penggalangan"
        message="Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={async () => {
          if (deleteTargetId) {
            await onDeleteCampaign(deleteTargetId);
            setDeleteCampaignId(null);
          }
        }}
        onCancel={() => setDeleteCampaignId(null)}
        isDestructive
      />
"""

content += """
      {/* FORM MODAL - V2 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all text-white">
          <div className="w-full max-w-2xl bg-slate-900 h-full overflow-y-auto flex flex-col shadow-2xl border-l border-slate-800 animate-slide-in-right">
            
            <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-4 flex justify-between items-center">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-red-500" />
                {editingCampaign ? 'Edit Penggalangan Dana' : 'Form Penggalangan Baru'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-8 flex-1">
              
              {/* SECTION 1: IDENTITAS MUSIBAH */}
              <section className="space-y-4">
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  1. Identitas Musibah
                </h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Anggota Utama (Karyawan PT VCI)</label>
                  <MemberSearchSelect
                    members={members}
                    selectedMemberId={selectedMemberId}
                    onSelectMember={handleSelectMember}
                    placeholder="Ketik NIK atau Nama Karyawan..."
                  />
                  {!selectedMemberObj && (
                    <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3"/> Wajib pilih anggota dari database.
                    </p>
                  )}
                </div>

                {selectedMemberObj && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Penerima Dana / Pasien</label>
                        <select
                          value={jenisPenerima}
                          onChange={(e) => setJenisPenerima(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                          <option value="Anggota">Diri Sendiri (Anggota)</option>
                          <option value="Keluarga">Keluarga Anggota</option>
                        </select>
                      </div>
                      
                      {jenisPenerima === 'Keluarga' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hubungan</label>
                          <select
                            value={hubungan}
                            onChange={(e) => setHubungan(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          >
                            <option value="Anak">Anak</option>
                            <option value="Suami">Suami</option>
                            <option value="Istri">Istri</option>
                            <option value="Orang Tua">Orang Tua</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {jenisPenerima === 'Keluarga' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Pasien / Yang Meninggal</label>
                          <input
                            type="text"
                            value={namaPasien}
                            onChange={e => setNamaPasien(e.target.value)}
                            placeholder="Wajib diisi..."
                            required
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status KK Keluarga</label>
                          <select
                            value={statusVerifikasiKeluarga}
                            onChange={(e) => setStatusVerifikasiKeluarga(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          >
                            <option value="Belum Diverifikasi">Belum Diverifikasi</option>
                            <option value="Valid">Valid (Sesuai KK)</option>
                            <option value="Perlu Verifikasi Pengurus">Perlu Verifikasi Pengurus</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* SECTION 2: KONDISI & VALIDASI SOP */}
              <section className="space-y-4">
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  2. Validasi Kondisi
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kondisi</label>
                    <select
                      value={kondisi}
                      onChange={(e) => setKondisi(e.target.value as HealthCondition)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                      <option value="Sakit">Sakit</option>
                      <option value="Meninggal">Meninggal</option>
                    </select>
                  </div>
                  {kondisi === 'Sakit' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Apakah Rawat Inap?</label>
                      <select
                        value={isRawatInap ? 'Ya' : 'Tidak'}
                        onChange={(e) => setIsRawatInap(e.target.value === 'Ya')}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      >
                        <option value="Tidak">Tidak</option>
                        <option value="Ya">Ya (Rawat Inap)</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {kondisi === 'Sakit' && !isRawatInap && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2 text-amber-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold leading-relaxed">
                      Kasus sakit tanpa rawat inap belum memenuhi kriteria penggalangan dana sesuai SOP. 
                      Data akan ditandai <strong className="text-amber-300">"Perlu Verifikasi Pengurus"</strong>.
                    </p>
                  </div>
                )}
              </section>

              {/* SECTION 3: PENDAMPINGAN RS (SICK VISIT INTEGRATION) */}
              {kondisi === 'Sakit' && (
                <section className="space-y-4">
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    3. Integrasi Pendampingan RS
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hubungkan dgn Rekod Anggota Sakit (Opsi)</label>
                    <select
                      value={sickVisitId}
                      onChange={(e) => handleSelectSickVisit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">-- Tidak Terhubung / Pilih --</option>
                      {sickVisits
                        .filter(sv => sv.memberId === selectedMemberId)
                        .map(sv => (
                        <option key={sv.id} value={sv.id}>
                          {sv.nomorPendampingan} - {sv.namaPasien || sv.namaAnggota}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isDidampingiKeRs}
                        onChange={(e) => setIsDidampingiKeRs(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-red-500 focus:ring-red-500"
                      />
                      <div>
                        <span className="text-sm font-bold text-white">Didampingi Pengurus ke RS?</span>
                        <p className="text-[10px] text-slate-400">Centang jika pernah divisit oleh pengurus SBN KASBI.</p>
                      </div>
                    </label>
                  </div>
                </section>
              )}

              {/* SOP CARD CALCULATION */}
              <section className="bg-slate-800 border border-slate-700 p-4 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl" />
                <h4 className="text-xs font-black text-slate-300 uppercase mb-3 flex items-center gap-1.5 relative z-10">
                  <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
                  Kalkulasi Minimum SOP
                </h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3 relative z-10">
                  <div className="flex justify-between"><span>Kondisi:</span> <span className="font-bold text-slate-200">{kondisi}</span></div>
                  <div className="flex justify-between"><span>Rawat Inap:</span> <span className="font-bold text-slate-200">{isRawatInap ? 'Ya' : 'Tidak'}</span></div>
                  <div className="flex justify-between"><span>Pendampingan:</span> <span className="font-bold text-slate-200">{isDidampingiKeRs ? 'Ya' : 'Tidak'}</span></div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-700 pt-3 relative z-10">
                  <span className="text-sm font-bold text-white">Target Minimum:</span>
                  <span className="text-lg font-black text-emerald-400">{formatRupiah(minimumSesuaiSop)}</span>
                </div>
              </section>

              {/* SECTION: DEPARTEMEN & PENGUMPULAN */}
              <section className="space-y-4">
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  4. Distribusi Departemen & Pengumpulan Dana
                </h3>

                <div className="space-y-3">
                  {distribusiDepartemen.map((dept, index) => (
                    <div key={dept.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row gap-3 items-start sm:items-center relative">
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">Nama Departemen</label>
                        <input
                          type="text"
                          value={dept.namaDepartemen}
                          onChange={e => updateDepartmentDist(dept.id, { namaDepartemen: e.target.value })}
                          placeholder="Misal: PPU / Assy"
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">Status Map</label>
                        <select
                          value={dept.statusMap}
                          onChange={e => updateDepartmentDist(dept.id, { statusMap: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-sm"
                        >
                          <option value="Belum Diedarkan">Belum Diedarkan</option>
                          <option value="Sudah Diedarkan">Sudah Diedarkan</option>
                          <option value="Sudah Dikembalikan">Sdh Dikembalikan</option>
                        </select>
                      </div>
                      <div className="w-full sm:w-40">
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">Terkumpul</label>
                        <input
                          type="number"
                          value={dept.jumlahDana || ''}
                          onChange={e => updateDepartmentDist(dept.id, { jumlahDana: parseInt(e.target.value || '0') })}
                          className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded-lg px-2 py-1.5 text-sm"
                        />
                      </div>
                      <button type="button" onClick={() => removeDepartmentDist(dept.id)} className="absolute top-3 right-3 sm:relative sm:top-0 sm:right-0 p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addDepartmentDist} className="w-full py-2 border border-dashed border-slate-700 text-indigo-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" /> Tambah Distribusi Departemen
                  </button>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center mt-3">
                  <span className="text-sm font-bold text-slate-300">Total Akumulasi Terkumpul:</span>
                  <span className="text-xl font-black text-emerald-400">{formatRupiah(jumlahTerkumpul)}</span>
                </div>
              </section>

              {/* SECTION: PIC & WORKFLOW STATUS */}
              <section className="space-y-4">
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  5. Proses & Status
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">PIC Pengurus</label>
                    <input
                      type="text"
                      value={picNama}
                      onChange={e => setPicNama(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tahap SOP Saat Ini</label>
                    <select
                      value={tahapProses}
                      onChange={(e) => setTahapProses(e.target.value as any)}
                      className="w-full bg-indigo-950 border border-indigo-500/50 text-indigo-300 font-bold rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="VERIFIKASI">VERIFIKASI</option>
                      <option value="MAP DIBUAT">MAP DIBUAT</option>
                      <option value="MAP DIEDARKAN">MAP DIEDARKAN</option>
                      <option value="PENGUMPULAN">PENGUMPULAN</option>
                      <option value="MAP DIKEMBALIKAN">MAP DIKEMBALIKAN</option>
                      <option value="VERIFIKASI DDU">VERIFIKASI DDU</option>
                      <option value="SIAP DISERAHKAN">SIAP DISERAHKAN</option>
                      <option value="SUDAH DISERAHKAN">SUDAH DISERAHKAN</option>
                      <option value="SELESAI">SELESAI</option>
                    </select>
                  </div>
                </div>
                
                {tahapProses === 'SUDAH DISERAHKAN' || tahapProses === 'SELESAI' ? (
                  <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase">Catatan Penyerahan Dana</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={penyerahanDana.status}
                        onChange={e => setPenyerahanDana({ ...penyerahanDana, status: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-2 text-sm"
                      >
                        <option value="Belum Diserahkan">Belum Diserahkan</option>
                        <option value="Sudah Diserahkan">Sudah Diserahkan</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nama Penerima Dana"
                        value={penyerahanDana.penerimaNama || ''}
                        onChange={e => setPenyerahanDana({ ...penyerahanDana, penerimaNama: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-2 text-sm"
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status Kampanye Dashboard</label>
                  <select
                    value={campaignStatus}
                    onChange={(e) => setCampaignStatus(e.target.value as CampaignStatus)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  >
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditutup">Ditutup / Batal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Keterangan Tambahan</label>
                  <textarea
                    value={keterangan}
                    onChange={e => setKeterangan(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="Catatan..."
                  />
                </div>
              </section>
              
            </form>

            <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-3.5 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleSubmitForm}
                className="py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-colors shadow-lg flex justify-center items-center gap-2"
              >
                <Save className="w-5 h-5" /> Simpan Data
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};
"""

with open("src/components/FundraisingModule.tsx", "w") as f:
    f.write(content)
