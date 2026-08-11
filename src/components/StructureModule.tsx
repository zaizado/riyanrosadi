import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, Search, ShieldCheck, Award, Building2, Phone, Filter, 
  Camera, CheckCircle2, Mail, MessageSquare, BadgeCheck, X, Eye, 
  Lock, UserCheck, ExternalLink 
} from 'lucide-react';
import { STRUKTUR_PENGURUS_DATA, PengurusItem } from '../data/strukturPengurusData';
import { UserAccount, Member } from '../types';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { compressImage } from '../lib/imageUtils';

interface StructureModuleProps {
  users?: UserAccount[];
  members?: Member[];
  currentUser?: UserAccount;
  onUpdateUser?: (updatedUser: UserAccount) => Promise<void> | void;
  onUpdateMember?: (updatedMember: Member) => Promise<void> | void;
  onNavigateToProfile?: () => void;
}

export const StructureModule: React.FC<StructureModuleProps> = ({
  users = [],
  members = [],
  currentUser,
  onUpdateUser,
  onUpdateMember,
  onNavigateToProfile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBidang, setSelectedBidang] = useState<string>('Semua');
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [selectedOfficerModal, setSelectedOfficerModal] = useState<PengurusItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bidangOptions = [
    'Semua',
    ...Array.from(new Set(STRUKTUR_PENGURUS_DATA.map((p) => p.bidang)))
  ];

  // Helper for clean NIK matching
  const matchNik = (nik1?: string, nik2?: string): boolean => {
    if (!nik1 || !nik2) return false;
    const s1 = nik1.trim().toLowerCase();
    const s2 = nik2.trim().toLowerCase();
    if (s1 === s2) return true;
    const c1 = s1.replace(/^0+/, '');
    const c2 = s2.replace(/^0+/, '');
    return c1.length > 0 && c1 === c2;
  };

  // Helper to match officer item with system UserAccounts by NIK, Name, or Role
  const findMatchingUserForOfficer = (p: PengurusItem): UserAccount | null => {
    if (!users || users.length === 0) return null;
    const pNik = (p.nik || '').trim();
    const pNama = (p.nama || '').trim().toLowerCase();
    const pJabatan = (p.jabatan || '').trim().toLowerCase();

    if (pNik) {
      const match = users.find(u => u.nik && matchNik(u.nik, pNik));
      if (match) return match;
    }

    if (pNama) {
      const match = users.find(u => {
        const uName = (u.name || '').trim().toLowerCase();
        return uName && (uName === pNama || uName.includes(pNama) || pNama.includes(uName));
      });
      if (match) return match;
    }

    if (pJabatan) {
      const match = users.find(u => u.role && u.role.trim().toLowerCase() === pJabatan);
      if (match) return match;
    }

    return null;
  };

  // Helper to match officer item with Member record by NIK
  const findMatchingMemberForOfficer = (p: PengurusItem): Member | null => {
    if (!members || members.length === 0) return null;
    const pNik = (p.nik || '').trim();
    if (!pNik) return null;

    return members.find(m => m.nik && matchNik(m.nik, pNik)) || null;
  };

  // Unified officer resolution from real-time database state (users & members)
  const getResolvedOfficer = (p: PengurusItem) => {
    const matchedUser = findMatchingUserForOfficer(p);
    const matchedMember = findMatchingMemberForOfficer(p);

    const displayPhoto = matchedUser?.avatarUrl || matchedMember?.fotoUrl || p.fotoUrl || cheAvatar;
    const displayEmail = matchedUser?.email || matchedMember?.email || 'Belum diatur';
    const displayPhone = matchedUser?.phoneNumber || matchedMember?.nomorHp || p.noHp || 'Belum diatur';
    const displayNama = matchedUser?.name || matchedMember?.namaLengkap || p.nama;
    const displayNik = p.nik || matchedUser?.nik || matchedMember?.nik || '-';
    const displayJabatan = p.jabatan || matchedUser?.role || 'Pengurus';
    const displayBidang = p.bidang || 'SBN KASBI VCI';
    const displayDepartemen = p.departemen || matchedUser?.department || matchedMember?.departemen || 'PT Victory Chingluh Indonesia';
    const displayBagian = p.bagian || matchedMember?.bagian || 'SBN KASBI VCI';

    const isSelf = Boolean(
      currentUser && (
        (currentUser.nik && p.nik && matchNik(currentUser.nik, p.nik)) ||
        (matchedUser && matchedUser.id === currentUser.id) ||
        (currentUser.name && p.nama && currentUser.name.trim().toLowerCase() === p.nama.trim().toLowerCase())
      )
    );

    const lastActiveIso = matchedUser?.lastActive || (isSelf ? currentUser?.lastActive : undefined);

    let isOnline = false;
    let onlineStatusText = 'Offline';

    if (isSelf) {
      isOnline = true;
      onlineStatusText = 'Online';
    } else if (lastActiveIso) {
      const lastActiveTime = new Date(lastActiveIso).getTime();
      if (!isNaN(lastActiveTime)) {
        const diffMs = Date.now() - lastActiveTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 3) {
          isOnline = true;
          onlineStatusText = 'Online';
        } else if (diffMinutes < 60) {
          onlineStatusText = `Aktif ${diffMinutes}m lalu`;
        } else if (diffMinutes < 1440) {
          const hours = Math.floor(diffMinutes / 60);
          onlineStatusText = `Aktif ${hours}j lalu`;
        } else {
          const days = Math.floor(diffMinutes / 1440);
          onlineStatusText = `Aktif ${days}h lalu`;
        }
      }
    }

    return {
      matchedUser,
      matchedMember,
      displayPhoto,
      displayEmail,
      displayPhone,
      displayNama,
      displayNik,
      displayJabatan,
      displayBidang,
      displayDepartemen,
      displayBagian,
      isSelf,
      isOnline,
      onlineStatusText
    };
  };

  const getWhatsAppUrl = (phoneStr: string) => {
    if (!phoneStr || phoneStr === 'Belum diatur') return null;
    let clean = phoneStr.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (clean.length < 9) return null;
    return `https://wa.me/${clean}`;
  };

  const handleTriggerUpload = (pengurusId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveUploadId(pengurusId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadId) return;

    const targetOfficer = STRUKTUR_PENGURUS_DATA.find(p => p.id === activeUploadId);
    if (!targetOfficer) return;

    const compressedResult = await compressImage(file, 250, 250, 0.65);
    const matchedUser = findMatchingUserForOfficer(targetOfficer);

    if (matchedUser && onUpdateUser) {
      await onUpdateUser({
        ...matchedUser,
        avatarUrl: compressedResult
      });
    } else if (onUpdateUser) {
      const newUsr: UserAccount = {
        id: `usr-${targetOfficer.nik || Date.now()}`,
        username: (targetOfficer.nama || 'pengurus').toLowerCase().replace(/\s+/g, '_'),
        name: targetOfficer.nama,
        email: 'pengurus@sbn.or.id',
        nik: targetOfficer.nik || '',
        role: (targetOfficer.jabatan as any) || 'Pengurus',
        department: targetOfficer.departemen || 'Assembly',
        phoneNumber: targetOfficer.noHp || '-',
        avatarUrl: compressedResult
      };
      await onUpdateUser(newUsr);
    }

    const matchedMember = findMatchingMemberForOfficer(targetOfficer);
    if (matchedMember && onUpdateMember) {
      await onUpdateMember({
        ...matchedMember,
        fotoUrl: compressedResult
      });
    }

    setUploadSuccessMessage(`Foto profil ${targetOfficer.nama} berhasil diperbarui di server database!`);
    setTimeout(() => setUploadSuccessMessage(null), 3500);
    setActiveUploadId(null);
    e.target.value = '';
  };

  const filteredPengurus = STRUKTUR_PENGURUS_DATA.filter((p) => {
    const info = getResolvedOfficer(p);
    const matchesSearch = 
      (info.displayNama && String(info.displayNama).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (info.displayNik && String(info.displayNik).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (info.displayJabatan && String(info.displayJabatan).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (info.displayEmail && String(info.displayEmail).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (info.displayPhone && String(info.displayPhone).toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBidang = selectedBidang === 'Semua' || p.bidang === selectedBidang;

    return matchesSearch && matchesBidang;
  });

  return (
    <div className="space-y-6 select-none pb-10">
      {/* Hidden file input for updating officer photos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#3b0000] via-[#1a0000] to-[#0d0d0d] border border-red-900/60 rounded-2xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-black uppercase">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            SBN KASBI PT Victory Chingluh Indonesia
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
            STRUKTUR PENGURUS SERIKAT
          </h1>
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            Data profil, email, nomor WhatsApp, dan foto pengurus disinkronkan secara otomatis dari menu Profil. Klik kartu pengurus untuk melihat detail biodata lengkap.
          </p>
        </div>
      </div>

      {uploadSuccessMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{uploadSuccessMessage}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-[#121212] border border-red-950/80 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama, NIK, WhatsApp, Email, Jabatan..."
            className="w-full bg-[#1a1a1a] border border-[#333] focus:border-red-600 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        {/* Bidang Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-red-500 shrink-0" />
          <select
            value={selectedBidang}
            onChange={(e) => setSelectedBidang(e.target.value)}
            className="w-full sm:w-auto bg-[#1a1a1a] border border-[#333] focus:border-red-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
          >
            {bidangOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Pengurus List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPengurus.map((p) => {
          const info = getResolvedOfficer(p);
          const isSuperAdmin = currentUser?.role === 'Super Admin';
          const canEditPhoto = isSuperAdmin || info.isSelf;
          const cardWaUrl = getWhatsAppUrl(info.displayPhone);

          return (
            <div 
              key={p.id}
              onClick={() => setSelectedOfficerModal(p)}
              className="bg-[#121212] hover:bg-[#181818] border border-red-950/80 hover:border-red-700/60 rounded-2xl p-4 transition-all shadow-xl space-y-3 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-2">
                
                {/* Header Card: Avatar + Name + NIK */}
                <div className="flex items-start justify-between gap-2 border-b border-red-950/60 pb-3">
                  <div className="flex items-center gap-3.5">
                    
                    {/* Photo Avatar */}
                    <div className="relative group/avatar shrink-0">
                      <img
                        src={info.displayPhoto}
                        alt={info.displayNama}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-red-500/80 shadow-lg bg-black"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = cheAvatar;
                        }}
                      />

                      {/* Online Status Dot Indicator */}
                      <span 
                        className={`absolute -top-1 -left-1 w-4 h-4 rounded-full border-2 border-[#121212] flex items-center justify-center z-10 shadow-md ${
                          info.isOnline ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-600'
                        }`}
                        title={info.isOnline ? `${info.displayNama} sedang Online / Aktif` : `${info.displayNama} (${info.onlineStatusText})`}
                      >
                        {info.isOnline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        )}
                      </span>

                      {canEditPhoto && (
                        <button
                          onClick={(e) => handleTriggerUpload(p.id, e)}
                          className="absolute -bottom-1 -right-1 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg border border-black cursor-pointer group-hover/avatar:scale-110 transition-transform"
                          title={`Ubah Foto Profil ${info.displayNama}`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white leading-tight group-hover:text-red-400 transition-colors">
                        {info.displayNama}
                      </h3>
                      <div className="inline-block px-2 py-0.5 rounded bg-red-950/80 border border-red-800/50 text-[10px] font-bold text-red-400 mt-1 font-mono">
                        NIK: {info.displayNik}
                      </div>
                    </div>

                  </div>

                  <div className="p-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-900/40 group-hover:bg-red-600 group-hover:text-white transition-colors" title="Lihat Profil Lengkap">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                {/* Detail Contact & Role Info */}
                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex items-center gap-2 text-gray-200 font-bold">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{info.displayJabatan}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="truncate">{info.displayDepartemen} ({info.displayBagian})</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-gray-300 text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono truncate">{info.displayPhone}</span>
                    </div>
                    {cardWaUrl && (
                      <a
                        href={cardWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-700/60 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                        title={`Chat WhatsApp ke ${info.displayNama}`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat WA</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{info.displayEmail}</span>
                  </div>
                </div>

              </div>

              {/* Bottom Footer Tag */}
              <div className="pt-2 border-t border-red-950/40 flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                <span className="bg-[#1a1a1a] px-2 py-0.5 rounded text-red-400 border border-red-950">{info.displayBidang}</span>
                <span className={`font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                  info.isOnline 
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60' 
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${info.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span>{info.isOnline ? 'Online' : info.onlineStatusText}</span>
                </span>
              </div>

            </div>
          );
        })}

        {filteredPengurus.length === 0 && (
          <div className="col-span-full p-8 bg-[#121212] border border-red-950/80 rounded-2xl text-center space-y-2">
            <Users className="w-8 h-8 text-red-500/60 mx-auto" />
            <p className="text-sm font-bold text-gray-300">Pengurus tidak ditemukan</p>
            <p className="text-xs text-gray-500">Coba ubah kata kunci pencarian atau filter bidang.</p>
          </div>
        )}
      </div>

      {/* DETAIL BIODATA MODAL */}
      {selectedOfficerModal && (() => {
        const modalInfo = getResolvedOfficer(selectedOfficerModal);
        const waUrl = getWhatsAppUrl(modalInfo.displayPhone);
        const canEditModalPhoto = (currentUser?.role === 'Super Admin') || modalInfo.isSelf;

        return (
          <div className="mobile-modal-backdrop">
            <div className="mobile-modal-card bg-[#121212] border border-red-900/80 text-white shadow-2xl relative max-w-2xl">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedOfficerModal(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-red-600 text-gray-300 hover:text-white rounded-xl border border-red-900/50 transition-colors cursor-pointer"
                title="Tutup Modal Biodata"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Banner Header Modal */}
              <div className="bg-gradient-to-r from-[#3d0000] via-[#1a0000] to-[#0d0d0d] border-b border-red-900/80 p-6 text-white relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                
                {/* Photo Avatar */}
                <div className="relative group shrink-0">
                  <img
                    src={modalInfo.displayPhoto}
                    alt={modalInfo.displayNama}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-red-600 shadow-2xl bg-black"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = cheAvatar;
                    }}
                  />

                  {/* Online Status Badge in Modal */}
                  <span 
                    className={`absolute -top-2 -left-2 px-2.5 py-1 rounded-full border-2 border-[#121212] text-[10px] font-black uppercase flex items-center gap-1.5 shadow-xl ${
                      modalInfo.isOnline ? 'bg-emerald-950 text-emerald-400 border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                    title={modalInfo.isOnline ? 'Status: Online / Aktif Sekarang' : `Status: ${modalInfo.onlineStatusText}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${modalInfo.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                    <span>{modalInfo.isOnline ? 'Online' : modalInfo.onlineStatusText}</span>
                  </span>

                  {canEditModalPhoto && (
                    <button
                      onClick={(e) => handleTriggerUpload(selectedOfficerModal.id, e)}
                      className="absolute -bottom-2 -right-2 p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg border-2 border-black cursor-pointer group-hover:scale-110 transition-transform"
                      title="Ubah Foto Profil"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Core Header Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-black uppercase">
                    <BadgeCheck className="w-4 h-4 text-red-500" />
                    {modalInfo.displayJabatan}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {modalInfo.displayNama}
                  </h2>
                  <p className="text-xs text-gray-300 font-extrabold tracking-wide">
                    NIK KARYAWAN: <span className="text-red-400 font-mono text-sm">{modalInfo.displayNik}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Departemen: {modalInfo.displayDepartemen}
                  </p>
                </div>

              </div>

              {/* Biodata Information Content */}
              <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
                
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-red-400 uppercase tracking-wider border-b border-red-950 pb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-red-500" />
                    Informasi Lengkap Profil Pengurus
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Field 1: Nama Lengkap */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Nama Lengkap</span>
                      <p className="text-xs font-black text-white">{modalInfo.displayNama}</p>
                    </div>

                    {/* Field 2: NIK */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">NIK Karyawan</span>
                      <p className="text-xs font-bold text-red-400 font-mono">{modalInfo.displayNik}</p>
                    </div>

                    {/* Field 3: Jabatan Organisasi */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Jabatan Organisasi</span>
                      <p className="text-xs font-bold text-amber-400">{modalInfo.displayJabatan}</p>
                    </div>

                    {/* Field 4: Departemen */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Departemen / Pabrik</span>
                      <p className="text-xs font-bold text-gray-300">{modalInfo.displayDepartemen}</p>
                    </div>

                    {/* Field 6: Bagian */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Bagian / Line Kerja</span>
                      <p className="text-xs font-bold text-gray-300">{modalInfo.displayBagian}</p>
                    </div>

                    {/* Field 7: Nomor WhatsApp */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 space-y-2 col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Nomor HP / WhatsApp</span>
                        <p className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{modalInfo.displayPhone}</span>
                        </p>
                      </div>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Chat WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {/* Field 8: Email */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 space-y-2 col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Alamat Email</span>
                        <p className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                          <span>{modalInfo.displayEmail}</span>
                        </p>
                      </div>
                      {modalInfo.displayEmail && modalInfo.displayEmail !== 'Belum diatur' && (
                        <a
                          href={`mailto:${modalInfo.displayEmail}`}
                          className="px-3 py-1.5 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/60 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                          <span>Kirim Email</span>
                        </a>
                      )}
                    </div>

                  </div>
                </div>

                {/* Footer Notice Box */}
                {modalInfo.isSelf ? (
                  <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <BadgeCheck className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">Ini Adalah Profil Anda Karyawan / Pengurus</p>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          Setiap perubahan email, nomor WhatsApp, dan foto di menu Profil (samping tombol Scan) akan otomatis memperbarui informasi Anda di seluruh sistem.
                        </p>
                      </div>
                    </div>
                    {onNavigateToProfile && (
                      <button
                        onClick={() => {
                          setSelectedOfficerModal(null);
                          onNavigateToProfile();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Edit Profil Saya
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                    <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Akses Informasi Publik Pengurus (Read-Only)</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Data profil dan kontak ini disinkronkan secara resmi dari akun milik <b>{modalInfo.displayNama}</b>. Pengguna lain hanya dapat melihat informasi kontak ini, dan tidak berhak merubah data milik pengurus lain.
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#0a0a0a] border-t border-red-950/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOfficerModal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Tutup Biodata
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
