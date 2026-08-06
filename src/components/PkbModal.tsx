import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Scale, 
  CheckCircle2, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Layers, 
  Filter,
  Info
} from 'lucide-react';
import { PKB_DATA, PkbPasal, KELOMPOK_MATERI_DEFAULT } from '../data/pkbData';
import { UserAccount, checkIsSuperAdmin } from '../types';

interface PkbModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount;
}

const STORAGE_KEY_CUSTOM_MATERI = 'sbn_custom_materi_v1';

export const PkbModal: React.FC<PkbModalProps> = ({ isOpen, onClose, currentUser }) => {
  const isSuperAdmin = currentUser ? checkIsSuperAdmin(currentUser) : false;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelompok, setSelectedKelompok] = useState<string>('PKB PT VCI (2024-2026)');
  const [selectedBab, setSelectedBab] = useState<string>('SEMUA');
  const [expandedPasal, setExpandedPasal] = useState<string | number | null>(null);

  // Custom user materials state
  const [customMaterials, setCustomMaterials] = useState<PkbPasal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_MATERI);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Add material form modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formKelompok, setFormKelompok] = useState<string>(KELOMPOK_MATERI_DEFAULT[1]);
  const [formCustomKelompok, setFormCustomKelompok] = useState('');
  const [formNomor, setFormNomor] = useState('');
  const [formJudul, setFormJudul] = useState('');
  const [formBab, setFormBab] = useState('');
  const [formBabJudul, setFormBabJudul] = useState('');
  const [formRingkasan, setFormRingkasan] = useState('');
  const [formIsi, setFormIsi] = useState('');

  // Persist custom materials
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_MATERI, JSON.stringify(customMaterials));
    } catch (e) {
      console.error("Failed to save custom materials:", e);
    }
  }, [customMaterials]);

  // Combine default PKB_DATA and custom materials
  const allMaterials = useMemo(() => {
    const combined = [...PKB_DATA, ...customMaterials];
    return combined.map((m, idx) => ({
      ...m,
      id: m.id || `mat-${idx}-${m.nomor}`,
      kelompokMateri: m.kelompokMateri || 'PKB PT VCI (2024-2026)'
    }));
  }, [customMaterials]);

  // Extract all available unique material groups in numbered tab order
  const kelompokList = useMemo(() => {
    const defaultGroups = Array.from(KELOMPOK_MATERI_DEFAULT);
    const customGroups = new Set<string>();
    
    allMaterials.forEach((m) => {
      const g = m.kelompokMateri || 'PKB PT VCI (2024-2026)';
      if (!defaultGroups.includes(g)) {
        customGroups.add(g);
      }
    });
    
    return [...defaultGroups, ...Array.from(customGroups), 'SEMUA'];
  }, [allMaterials]);

  // Extract BAB list dynamically based on selected Kelompok
  const babList = useMemo(() => {
    const babSet = new Set<string>();
    allMaterials.forEach((p) => {
      if (selectedKelompok === 'SEMUA' || p.kelompokMateri === selectedKelompok) {
        babSet.add(p.bab);
      }
    });
    return ['SEMUA', ...Array.from(babSet)];
  }, [allMaterials, selectedKelompok]);

  // Reset selected BAB if switching material group
  const handleKelompokChange = (kelompok: string) => {
    setSelectedKelompok(kelompok);
    setSelectedBab('SEMUA');
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((item) => {
      const itemGroup = item.kelompokMateri || 'PKB PT VCI (2024-2026)';
      const matchesGroup = selectedKelompok === 'SEMUA' || itemGroup === selectedKelompok;
      const matchesBab = selectedBab === 'SEMUA' || item.bab === selectedBab;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesGroup && matchesBab;

      const matchesNomor = `pasal ${item.nomor}`.toLowerCase().includes(q) || item.nomor.toString().toLowerCase().includes(q);
      const matchesJudul = item.judul.toLowerCase().includes(q);
      const matchesRingkasan = item.ringkasan.toLowerCase().includes(q);
      const matchesBabJudul = item.babJudul.toLowerCase().includes(q);
      const matchesGroupText = itemGroup.toLowerCase().includes(q);
      const matchesIsi = item.isiLengkap.some((line) => line.toLowerCase().includes(q));

      return matchesGroup && matchesBab && (matchesNomor || matchesJudul || matchesRingkasan || matchesBabJudul || matchesGroupText || matchesIsi);
    });
  }, [allMaterials, searchQuery, selectedKelompok, selectedBab]);

  // Add new material
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formNomor.trim()) return;

    const finalGroup = formKelompok === 'LAINNYA' 
      ? (formCustomKelompok.trim() || 'Kelompok Materi Baru') 
      : formKelompok;

    const isiLines = formIsi.split('\n').map(s => s.trim()).filter(Boolean);

    const newMat: PkbPasal = {
      id: `custom-mat-${Date.now()}`,
      nomor: formNomor,
      judul: formJudul,
      bab: formBab || 'UMUM',
      babJudul: formBabJudul || 'KETENTUAN KHUSUS',
      ringkasan: formRingkasan || formJudul,
      isiLengkap: isiLines.length > 0 ? isiLines : [formRingkasan || formJudul],
      kelompokMateri: finalGroup
    };

    setCustomMaterials(prev => [newMat, ...prev]);
    setSelectedKelompok(finalGroup);
    setIsAddModalOpen(false);

    // Reset form
    setFormNomor('');
    setFormJudul('');
    setFormBab('');
    setFormBabJudul('');
    setFormRingkasan('');
    setFormIsi('');
    setFormCustomKelompok('');
  };

  const handleDeleteCustomMaterial = (id: string) => {
    setCustomMaterials(prev => prev.filter(m => m.id !== id));
  };

  const getGroupBadgeClass = (groupName?: string) => {
    switch (groupName) {
      case 'PKB PT VCI (2024-2026)':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'UU No. 21 Tahun 2000 (Serikat Pekerja)':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'UU No. 13 Tahun 2003 (Ketenagakerjaan)':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UU No. 2 Tahun 2004 (PPHI)':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'UU No. 6 Tahun 2023 (Cipta Kerja)':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Peraturan Perusahaan & K3':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SOP & Panduan Organisasi':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 select-none">
      
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-slate-900 border-b border-red-800 p-4 sm:p-5 flex items-center justify-between shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
              <BookOpen className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-yellow-300 text-[10px] font-black uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
                Pusat Regulasi & PKB PT VCI
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                PKB & KUMPULAN PERATURAN ORGANISASI
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1 transition-all cursor-pointer"
              title="Tambah Kelompok / Materi Peraturan Baru"
            >
              <Plus className="w-4 h-4 text-slate-900" />
              <span className="hidden sm:inline">Tambah Materi Baru</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Bar: Kelompok Materi Tabs */}
        <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 sm:px-4 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
            <span className="flex items-center gap-1.5 text-yellow-400 uppercase tracking-wider text-[10px]">
              <Layers className="w-3.5 h-3.5 text-yellow-400" />
              Kelompok Materi Peraturan:
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Materi dipisah per kelompok agar teratur dan tidak tercampur
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {kelompokList.map((group) => {
              const isSelected = selectedKelompok === group;
              const count = allMaterials.filter(m => group === 'SEMUA' || (m.kelompokMateri || 'PKB PT VCI (2024-2026)') === group).length;

              let displayTitle = group;

              if (group === 'PKB PT VCI (2024-2026)') {
                displayTitle = 'PKB PT VCI (2024-2026)';
              } else if (group === 'UU No. 21 Tahun 2000 (Serikat Pekerja)') {
                displayTitle = 'UU No. 21/2000 (Serikat Pekerja)';
              } else if (group === 'UU No. 13 Tahun 2003 (Ketenagakerjaan)') {
                displayTitle = 'UU No. 13/2003 (Ketenagakerjaan)';
              } else if (group === 'UU No. 2 Tahun 2004 (PPHI)') {
                displayTitle = 'UU No. 2/2004 (PPHI)';
              } else if (group === 'UU No. 6 Tahun 2023 (Cipta Kerja)') {
                displayTitle = 'UU No. 6/2023 (Cipta Kerja)';
              } else if (group === 'Peraturan Perusahaan & K3') {
                displayTitle = 'Peraturan Perusahaan & K3';
              } else if (group === 'SOP & Panduan Organisasi') {
                displayTitle = 'SOP & Panduan Organisasi';
              } else if (group === 'SEMUA') {
                displayTitle = 'Semua Materi';
              }

              return (
                <button
                  key={group}
                  onClick={() => handleKelompokChange(group)}
                  className={`px-3.5 py-2 rounded-xl font-black shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-400/50'
                      : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span>{displayTitle}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sub-Filter (BAB) Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 space-y-3 shrink-0">
          
          {/* Search Bar Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-red-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari dalam ${selectedKelompok === 'SEMUA' ? 'semua kelompok' : selectedKelompok} (kata kunci, nomor pasal, UU, K3, lembur, pesangon)...`}
              className="w-full bg-white border-2 border-slate-300 focus:border-red-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm font-medium"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* BAB Filter Category Pills */}
          {babList.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1 pr-1">
                <Filter className="w-3 h-3 text-slate-400" /> Filter BAB:
              </span>
              {babList.map((bab) => (
                <button
                  key={bab}
                  onClick={() => setSelectedBab(bab)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    selectedBab === bab
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300'
                  }`}
                >
                  {bab}
                </button>
              ))}
            </div>
          )}

          {/* Search Result Counter */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold px-1">
            <span>
              Menampilkan <span className="text-red-700 font-bold">{filteredMaterials.length}</span> Materi 
              {selectedKelompok !== 'SEMUA' && <span> dalam kelompok "<span className="text-slate-900 font-bold">{selectedKelompok}</span>"</span>}
              {searchQuery && <span> pencarian "<span className="text-slate-900 font-bold">{searchQuery}</span>"</span>}
            </span>
            <span className="text-slate-500 text-[10px]">Klik kartu untuk membaca rincian lengkap</span>
          </div>

        </div>

        {/* Material Items Scroll List */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 bg-slate-100">
          
          {filteredMaterials.map((pasal) => {
            const itemKey = pasal.id || `p-${pasal.nomor}`;
            const isExpanded = expandedPasal === itemKey;
            const groupName = pasal.kelompokMateri || 'PKB PT VCI (2024-2026)';
            const isCustom = Boolean(pasal.id && pasal.id.startsWith('custom-mat-'));

            return (
              <div
                key={itemKey}
                className={`border rounded-2xl transition-all shadow-sm overflow-hidden ${
                  isExpanded 
                    ? 'bg-white border-red-500 ring-1 ring-red-300 shadow-md' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-red-300'
                }`}
              >
                {/* Card Header */}
                <div
                  onClick={() => setExpandedPasal(isExpanded ? null : itemKey)}
                  className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    
                    {/* Badges Bar */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded border font-bold text-[10px] uppercase tracking-wide ${getGroupBadgeClass(groupName)}`}>
                        {groupName}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-yellow-300 font-mono font-black text-[11px]">
                        {typeof pasal.nomor === 'number' ? `Pasal ${pasal.nomor}` : pasal.nomor}
                      </span>
                      <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[240px]">
                        {pasal.bab}: {pasal.babJudul}
                      </span>
                    </div>

                    {/* Judul Materi */}
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      {pasal.judul}
                    </h3>

                    {/* Ringkasan */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {pasal.ringkasan}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    {isCustom && isSuperAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pasal.id && confirm(`Hapus materi "${pasal.judul}"?`)) {
                            handleDeleteCustomMaterial(pasal.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus Materi Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-red-600" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content View */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-200 bg-slate-50 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[10px] font-bold text-red-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-red-600" />
                        <span>Detail Ketentuan Materi {typeof pasal.nomor === 'number' ? `Pasal ${pasal.nomor}` : pasal.nomor}</span>
                      </div>
                      <span className="text-slate-500 font-normal">Kelompok: {groupName}</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-800 leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      {pasal.isiLengkap.map((line, idx) => (
                        <p key={idx} className="whitespace-pre-wrap">{line}</p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Kategori: {pasal.bab} - {pasal.babJudul}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Dokumen Resmi Terverifikasi SBN KASBI VCI
                      </span>
                    </div>
                  </div>
                )}

              </div>
            );
          })}

          {filteredMaterials.length === 0 && (
            <div className="p-12 text-center space-y-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Scale className="w-10 h-10 text-red-400 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 uppercase">Materi Tidak Ditemukan</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Tidak ada materi dalam kelompok "{selectedKelompok}" yang cocok dengan kata kunci "{searchQuery}".
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedKelompok('SEMUA'); setSelectedBab('SEMUA'); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Tampilkan Semua Kelompok Materi
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="text-[11px] font-semibold hidden sm:inline">
            SBN KASBI PT Victory Chingluh Indonesia - Pusat Arsip Hukum & Kebijakan
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer ml-auto shadow-sm"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* MODAL FORM TAMBAH MATERI / KELOMPOK BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg my-auto p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-600 border border-red-200">
                <FolderPlus className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">Tambah Materi / Peraturan Baru</h3>
                <p className="text-xs text-slate-500">Pilih atau buat kelompok materi baru agar terpisah dari PKB</p>
              </div>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3 text-xs">
              
              {/* Kelompok Materi Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Kelompok Materi: <span className="text-red-500">*</span>
                </label>
                <select
                  value={formKelompok}
                  onChange={(e) => setFormKelompok(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500"
                >
                  {KELOMPOK_MATERI_DEFAULT.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                  <option value="LAINNYA">+ Buat Kelompok Materi Baru...</option>
                </select>
              </div>

              {/* If "LAINNYA", Input New Group Name */}
              {formKelompok === 'LAINNYA' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-amber-900">
                    Nama Kelompok Materi Baru:
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomKelompok}
                    onChange={(e) => setFormCustomKelompok(e.target.value)}
                    placeholder="Contoh: Peraturan Disnaker & Himbauan, Edaran Manajemen, K3 Khusus..."
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Kode / Nomor */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kode / Nomor Pasal / Reg: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNomor}
                    onChange={(e) => setFormNomor(e.target.value)}
                    placeholder="Contoh: UU-06/2023, SK-02, Pasal 87..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori / BAB:
                  </label>
                  <input
                    type="text"
                    value={formBab}
                    onChange={(e) => setFormBab(e.target.value)}
                    placeholder="Contoh: BAB I, REGULASI KHUSUS..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Judul */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Judul Dokumen / Materi: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Peraturan Penggunaan APD & Fasilitas Pabrik..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Judul Bab */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sub-Judul / Keterangan BAB:
                </label>
                <input
                  type="text"
                  value={formBabJudul}
                  onChange={(e) => setFormBabJudul(e.target.value)}
                  placeholder="Contoh: PENANGANAN KESELAMATAN & TATA TERTIB..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Ringkasan Singkat */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ringkasan Singkat:
                </label>
                <input
                  type="text"
                  value={formRingkasan}
                  onChange={(e) => setFormRingkasan(e.target.value)}
                  placeholder="Penjelasan ringkas isi materi..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Isi Detail (Per Paragraf/Poin) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Rincian Isi / Ketentuan Lengkap (1 Poin Per Baris):
                </label>
                <textarea
                  rows={4}
                  value={formIsi}
                  onChange={(e) => setFormIsi(e.target.value)}
                  placeholder={"1. Ketentuan pertama...\n2. Ketentuan kedua...\n3. Ketentuan ketiga..."}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Materi Baru
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

