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
  FileText,
  Upload,
  Download,
  Paperclip,
  AlertTriangle,
  Printer,
  Sparkles,
  ChevronRight,
  Eye,
  History,
  ListTodo,
  CheckSquare,
  Info,
  FileCheck,
  FilePlus,
  Share2,
  Check,
  Send,
  MoreVertical
} from 'lucide-react';
import { 
  OrganizationAgenda, 
  AgendaType, 
  UserAccount, 
  checkIsSuperAdmin, 
  NotulensiAgenda,
  TindakLanjutItem,
  LampiranNotulensiItem,
  NotulensiHistoryItem
} from '../types';
import { ConfirmModal } from './ConfirmModal';
import { ModalPortal } from './ModalPortal';
import { SectionHeader, PrimaryButton } from './ui/DesignSystem';
import { exportNotulensiPdf, exportNotulensiDocx } from '../utils/notulensiExport';
import { parseUploadedFile } from '../utils/documentParser';

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
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<OrganizationAgenda | null>(null);
  const [deleteAgendaConfirmObj, setDeleteAgendaConfirmObj] = useState<OrganizationAgenda | null>(null);

  // Detail & Notulensi Integrated Modal State
  const [selectedAgenda, setSelectedAgenda] = useState<OrganizationAgenda | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'participants' | 'minutes' | 'followup' | 'attachments'>('minutes');
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);

  // Notulensi Editor Form State
  const [notulensiForm, setNotulensiForm] = useState<{
    judulRapat: string;
    tanggalWaktu: string;
    tempat: string;
    pimpinanRapat: string;
    notulis: string;
    pesertaText: string;
    agendaPembahasan: string;
    isiPembahasan: string;
    keputusanRapat: string[];
    aspirasiMasukan: string;
    catatanTambahan: string;
    newDecisionText: string;
  }>({
    judulRapat: '',
    tanggalWaktu: '',
    tempat: '',
    pimpinanRapat: '',
    notulis: currentUser.name,
    pesertaText: '',
    agendaPembahasan: '',
    isiPembahasan: '',
    keputusanRapat: [],
    aspirasiMasukan: '',
    catatanTambahan: '',
    newDecisionText: ''
  });

  // Tindak Lanjut Form State
  const [newFollowUp, setNewFollowUp] = useState<{
    task: string;
    pic: string;
    deadline: string;
    status: 'Belum Dimulai' | 'Berjalan' | 'Selesai';
    notes: string;
  }>({
    task: '',
    pic: '',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: 'Belum Dimulai',
    notes: ''
  });

  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Form state for add/edit agenda
  const [formData, setFormData] = useState<Partial<OrganizationAgenda>>({
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

  // Enhanced Global Search across title, date, participants, discussion content, decisions, PIC
  const filteredAgendas = agendas.filter((agd) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      const matchType = selectedTypeFilter === 'All' || agd.jenis === selectedTypeFilter;
      const matchStatus = statusFilter === 'All' || agd.status === statusFilter;
      return matchType && matchStatus;
    }

    const notulensi = agd.notulensi;
    const isMatchInAgenda = 
      agd.judul.toLowerCase().includes(query) ||
      agd.lokasi.toLowerCase().includes(query) ||
      agd.penanggungJawab.toLowerCase().includes(query) ||
      agd.jenis.toLowerCase().includes(query) ||
      agd.deskripsi.toLowerCase().includes(query) ||
      agd.daftarPeserta.some(p => p.toLowerCase().includes(query));

    const isMatchInNotulensi = notulensi ? (
      (notulensi.judulRapat && notulensi.judulRapat.toLowerCase().includes(query)) ||
      (notulensi.pimpinanRapat && notulensi.pimpinanRapat.toLowerCase().includes(query)) ||
      (notulensi.notulis && notulensi.notulis.toLowerCase().includes(query)) ||
      (notulensi.pesertaText && notulensi.pesertaText.toLowerCase().includes(query)) ||
      (notulensi.agendaPembahasan && notulensi.agendaPembahasan.toLowerCase().includes(query)) ||
      (notulensi.isiPembahasan && notulensi.isiPembahasan.toLowerCase().includes(query)) ||
      (notulensi.isiNotulensi && notulensi.isiNotulensi.toLowerCase().includes(query)) ||
      (notulensi.keputusanRapat && notulensi.keputusanRapat.some(k => k.toLowerCase().includes(query))) ||
      (notulensi.poinKeputusan && notulensi.poinKeputusan.some(k => k.toLowerCase().includes(query))) ||
      (notulensi.tindakLanjutList && notulensi.tindakLanjutList.some(t => t.task.toLowerCase().includes(query) || t.pic.toLowerCase().includes(query)))
    ) : false;

    const matchType = selectedTypeFilter === 'All' || agd.jenis === selectedTypeFilter;
    const matchStatus = statusFilter === 'All' || agd.status === statusFilter;

    return (isMatchInAgenda || isMatchInNotulensi) && matchType && matchStatus;
  });

  const handleOpenAdd = () => {
    if (!isSuperAdmin) return;
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
    if (!isSuperAdmin) return;
    setEditingAgenda(agenda);
    setFormData({ ...agenda });
    setIsAddModalOpen(true);
  };

  const handleSaveAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !formData.judul) return;

    if (editingAgenda) {
      const updated = {
        ...editingAgenda,
        ...formData
      } as OrganizationAgenda;
      onUpdateAgenda(updated);
      if (selectedAgenda && selectedAgenda.id === updated.id) {
        setSelectedAgenda(updated);
      }
    } else {
      const newAgd: OrganizationAgenda = {
        id: `agd-${Date.now()}`,
        judul: formData.judul || 'Agenda Baru',
        jenis: (formData.jenis as AgendaType) || 'Rapat',
        tanggalWaktu: formData.tanggalWaktu || new Date().toISOString(),
        lokasi: formData.lokasi || 'Sekretariat',
        penanggungJawab: formData.penanggungJawab || currentUser.name,
        deskripsi: formData.deskripsi || '',
        daftarPeserta: formData.daftarPeserta || ['Pengurus Harian SBN KASBI'],
        status: (formData.status as any) || 'Akan Datang',
        notifikasiTerkirim: true
      };
      onAddAgenda(newAgd);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteAgendaConfirm = () => {
    if (deleteAgendaConfirmObj) {
      onDeleteAgenda(deleteAgendaConfirmObj.id);
      if (selectedAgenda && selectedAgenda.id === deleteAgendaConfirmObj.id) {
        setSelectedAgenda(null);
      }
      setDeleteAgendaConfirmObj(null);
    }
  };

  // Open Integrated Agenda Modal
  const handleOpenAgendaDetail = (agenda: OrganizationAgenda, initialTab: 'info' | 'participants' | 'minutes' | 'followup' | 'attachments' = 'minutes') => {
    setSelectedAgenda(agenda);
    setActiveTab(initialTab);
    setImportNotice(null);

    const existing = agenda.notulensi;
    if (existing) {
      setNotulensiForm({
        judulRapat: existing.judulRapat || existing.judulNotulensi || agenda.judul,
        tanggalWaktu: existing.tanggalWaktu || agenda.tanggalWaktu,
        tempat: existing.tempat || agenda.lokasi,
        pimpinanRapat: existing.pimpinanRapat || agenda.penanggungJawab,
        notulis: existing.notulis || currentUser.name,
        pesertaText: existing.pesertaText || agenda.daftarPeserta.join(', '),
        agendaPembahasan: existing.agendaPembahasan || agenda.deskripsi,
        isiPembahasan: existing.isiPembahasan || existing.isiNotulensi || '',
        keputusanRapat: existing.keputusanRapat || existing.poinKeputusan || [],
        aspirasiMasukan: existing.aspirasiMasukan || '',
        catatanTambahan: existing.catatanTambahan || '',
        newDecisionText: ''
      });
      setIsEditingMinutes(false);
    } else {
      setNotulensiForm({
        judulRapat: `Notulensi Agenda: ${agenda.judul}`,
        tanggalWaktu: agenda.tanggalWaktu,
        tempat: agenda.lokasi,
        pimpinanRapat: agenda.penanggungJawab,
        notulis: currentUser.name,
        pesertaText: agenda.daftarPeserta.join(', '),
        agendaPembahasan: agenda.deskripsi,
        isiPembahasan: '',
        keputusanRapat: [],
        aspirasiMasukan: '',
        catatanTambahan: '',
        newDecisionText: ''
      });
      setIsEditingMinutes(isSuperAdmin);
    }
  };

  // File Upload & Text Extraction for Import Notulensi
  const handleImportNotulensiFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAgenda) return;

    try {
      const parsed = await parseUploadedFile(file);

      // Create Attachment object
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string || '';
        const newAttachment: LampiranNotulensiItem = {
          id: `att-${Date.now()}`,
          fileName: file.name,
          fileType: file.type || file.name.split('.').pop() || 'document',
          fileDataUrl: dataUrl,
          uploadedAt: new Date().toISOString()
        };

        const currentNotulensi = selectedAgenda.notulensi;
        const currentLampiran = currentNotulensi?.lampiranList || [];

        setNotulensiForm(prev => ({
          ...prev,
          judulRapat: parsed.extractedTitle || prev.judulRapat || selectedAgenda.judul,
          pimpinanRapat: parsed.extractedLeader || prev.pimpinanRapat || selectedAgenda.penanggungJawab,
          notulis: parsed.extractedNotulis || prev.notulis || currentUser.name,
          pesertaText: parsed.extractedParticipants || prev.pesertaText || selectedAgenda.daftarPeserta.join(', '),
          isiPembahasan: parsed.rawText || parsed.extractedDiscussion || prev.isiPembahasan,
          keputusanRapat: parsed.extractedDecisions && parsed.extractedDecisions.length > 0 
            ? Array.from(new Set([...prev.keputusanRapat, ...parsed.extractedDecisions]))
            : prev.keputusanRapat
        }));

        setImportNotice(`Dokumen "${file.name}" berhasil di-import dan dilampirkan! Teks telah di-ekstrak ke dalam form notulensi.`);
        setIsEditingMinutes(true);
      };
      reader.readAsDataURL(file);

    } catch (err) {
      console.error("Gagal membaca file import:", err);
      setImportNotice(`Gagal meng-ekstrak file "${file.name}". Silakan ketik atau tempel isi catatan secara manual.`);
    }
  };

  // Add Decision Point in Form
  const handleAddDecisionPoint = () => {
    if (!notulensiForm.newDecisionText.trim()) return;
    setNotulensiForm(prev => ({
      ...prev,
      keputusanRapat: [...prev.keputusanRapat, prev.newDecisionText.trim()],
      newDecisionText: ''
    }));
  };

  // Remove Decision Point
  const handleRemoveDecisionPoint = (index: number) => {
    setNotulensiForm(prev => ({
      ...prev,
      keputusanRapat: prev.keputusanRapat.filter((_, i) => i !== index)
    }));
  };

  // Save Notulensi & Synchronize with Firestore Realtime
  const handleSaveNotulensi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgenda) return;

    const existingNotulensi = selectedAgenda.notulensi;
    const now = new Date().toISOString();

    const historyItem: NotulensiHistoryItem = {
      id: `hist-${Date.now()}`,
      changedBy: currentUser.name,
      userRole: currentUser.role,
      changedAt: now,
      summary: existingNotulensi ? 'Memperbarui data & isi notulensi' : 'Membuat notulensi baru'
    };

    const newNotulensiObj: NotulensiAgenda = {
      id: existingNotulensi?.id || `notul-${Date.now()}`,
      agendaId: selectedAgenda.id,
      judulRapat: notulensiForm.judulRapat || selectedAgenda.judul,
      tanggalWaktu: notulensiForm.tanggalWaktu || selectedAgenda.tanggalWaktu,
      tempat: notulensiForm.tempat || selectedAgenda.lokasi,
      pimpinanRapat: notulensiForm.pimpinanRapat || selectedAgenda.penanggungJawab,
      notulis: notulensiForm.notulis || currentUser.name,
      pesertaText: notulensiForm.pesertaText || selectedAgenda.daftarPeserta.join(', '),
      agendaPembahasan: notulensiForm.agendaPembahasan || selectedAgenda.deskripsi,
      isiPembahasan: notulensiForm.isiPembahasan || 'Belum ada catatan detail.',
      keputusanRapat: notulensiForm.keputusanRapat,
      aspirasiMasukan: notulensiForm.aspirasiMasukan,
      catatanTambahan: notulensiForm.catatanTambahan,
      tindakLanjutList: existingNotulensi?.tindakLanjutList || [],
      lampiranList: existingNotulensi?.lampiranList || [],
      history: [historyItem, ...(existingNotulensi?.history || [])],
      createdBy: existingNotulensi?.createdBy || currentUser.name,
      createdAt: existingNotulensi?.createdAt || now,
      updatedBy: currentUser.name,
      updatedAt: now,

      // Legacy fallback
      judulNotulensi: notulensiForm.judulRapat,
      waktuDibuat: now,
      isiNotulensi: notulensiForm.isiPembahasan,
      poinKeputusan: notulensiForm.keputusanRapat
    };

    const updatedAgenda: OrganizationAgenda = {
      ...selectedAgenda,
      notulensi: newNotulensiObj
    };

    onUpdateAgenda(updatedAgenda);
    setSelectedAgenda(updatedAgenda);
    setIsEditingMinutes(false);
    setImportNotice('Notulensi berhasil disimpan ke Firestore! Perubahan otomatis tersinkron ke semua perangkat pengurus.');
  };

  // Convert Decision Point to Tindak Lanjut Task
  const handleConvertDecisionToTask = (decisionText: string) => {
    if (!selectedAgenda || !selectedAgenda.notulensi) return;

    const newTask: TindakLanjutItem = {
      id: `tl-${Date.now()}`,
      task: decisionText,
      pic: selectedAgenda.notulensi.pimpinanRapat || selectedAgenda.penanggungJawab,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'Belum Dimulai',
      notes: 'Otomatis dibuat dari Keputusan Rapat'
    };

    const currentNotulensi = selectedAgenda.notulensi;
    const updatedNotulensi: NotulensiAgenda = {
      ...currentNotulensi,
      tindakLanjutList: [...(currentNotulensi.tindakLanjutList || []), newTask],
      updatedAt: new Date().toISOString()
    };

    const updatedAgenda: OrganizationAgenda = {
      ...selectedAgenda,
      notulensi: updatedNotulensi
    };

    onUpdateAgenda(updatedAgenda);
    setSelectedAgenda(updatedAgenda);
    setActiveTab('followup');
  };

  // Add Manual Tindak Lanjut Task
  const handleAddFollowUpTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgenda || !selectedAgenda.notulensi || !newFollowUp.task.trim()) return;

    const newTask: TindakLanjutItem = {
      id: `tl-${Date.now()}`,
      task: newFollowUp.task.trim(),
      pic: newFollowUp.pic.trim() || selectedAgenda.penanggungJawab,
      deadline: newFollowUp.deadline,
      status: newFollowUp.status,
      notes: newFollowUp.notes.trim()
    };

    const currentNotulensi = selectedAgenda.notulensi;
    const updatedNotulensi: NotulensiAgenda = {
      ...currentNotulensi,
      tindakLanjutList: [...(currentNotulensi.tindakLanjutList || []), newTask],
      updatedAt: new Date().toISOString()
    };

    const updatedAgenda: OrganizationAgenda = {
      ...selectedAgenda,
      notulensi: updatedNotulensi
    };

    onUpdateAgenda(updatedAgenda);
    setSelectedAgenda(updatedAgenda);
    setNewFollowUp({
      task: '',
      pic: '',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'Belum Dimulai',
      notes: ''
    });
  };

  // Update Status of Tindak Lanjut Task
  const handleUpdateFollowUpStatus = (taskId: string, newStatus: TindakLanjutItem['status']) => {
    if (!selectedAgenda || !selectedAgenda.notulensi) return;

    const currentNotulensi = selectedAgenda.notulensi;
    const updatedList = (currentNotulensi.tindakLanjutList || []).map(item => {
      if (item.id === taskId) {
        return { ...item, status: newStatus };
      }
      return item;
    });

    const updatedNotulensi: NotulensiAgenda = {
      ...currentNotulensi,
      tindakLanjutList: updatedList,
      updatedAt: new Date().toISOString()
    };

    const updatedAgenda: OrganizationAgenda = {
      ...selectedAgenda,
      notulensi: updatedNotulensi
    };

    onUpdateAgenda(updatedAgenda);
    setSelectedAgenda(updatedAgenda);
  };

  // Delete Tindak Lanjut Task
  const handleDeleteFollowUpTask = (taskId: string) => {
    if (!selectedAgenda || !selectedAgenda.notulensi) return;

    const currentNotulensi = selectedAgenda.notulensi;
    const updatedList = (currentNotulensi.tindakLanjutList || []).filter(item => item.id !== taskId);

    const updatedNotulensi: NotulensiAgenda = {
      ...currentNotulensi,
      tindakLanjutList: updatedList,
      updatedAt: new Date().toISOString()
    };

    const updatedAgenda: OrganizationAgenda = {
      ...selectedAgenda,
      notulensi: updatedNotulensi
    };

    onUpdateAgenda(updatedAgenda);
    setSelectedAgenda(updatedAgenda);
  };

  // Upload Additional Lampiran
  const handleUploadLampiranDirect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAgenda || !selectedAgenda.notulensi) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string || '';
      const newAtt: LampiranNotulensiItem = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        fileType: file.type || 'document',
        fileDataUrl: dataUrl,
        uploadedAt: new Date().toISOString()
      };

      const currentNotulensi = selectedAgenda.notulensi;
      const updatedNotulensi: NotulensiAgenda = {
        ...currentNotulensi,
        lampiranList: [...(currentNotulensi.lampiranList || []), newAtt],
        updatedAt: new Date().toISOString()
      };

      const updatedAgenda: OrganizationAgenda = {
        ...selectedAgenda,
        notulensi: updatedNotulensi
      };

      onUpdateAgenda(updatedAgenda);
      setSelectedAgenda(updatedAgenda);
    };
    reader.readAsDataURL(file);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: OrganizationAgenda['status']) => {
    switch (status) {
      case 'Berjalan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            🔵 Sedang Berjalan
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Selesai
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800 rounded-full">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold bg-blue-950 text-blue-400 border border-blue-800 rounded-full">
            Akan Datang
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* SECTION HEADER */}
      <SectionHeader
        icon={CalendarDays}
        title="Agenda & Notulensi Serikat"
        description="Sistem Terintegrasi Jadwal Rapat, Risalah Notulensi, Decision Tracking & Progress Tindak Lanjut"
        action={
          isSuperAdmin ? (
            <PrimaryButton
              onClick={handleOpenAdd}
              icon={Plus}
            >
              Tambah Agenda
            </PrimaryButton>
          ) : undefined
        }
      />

      {/* FILTER & GLOBAL SEARCH BAR */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari agenda, notulensi, keputusan, peserta, kata kunci (misal: 'kenaikan upah')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            >
              <option value="All">Semua Jenis Agenda</option>
              {agendaTypesList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            >
              <option value="All">Semua Status</option>
              <option value="Berjalan">🔵 Sedang Berjalan</option>
              <option value="Akan Datang">🔵 Akan Datang</option>
              <option value="Selesai">✅ Selesai</option>
              <option value="Dibatalkan">⛔ Dibatalkan</option>
            </select>
          </div>
        </div>

        {searchQuery.trim() && (
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-between pt-1">
            <span>Ditemukan {filteredAgendas.length} agenda/notulensi yang cocok dengan kata kunci "{searchQuery}"</span>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>

      {/* AGENDA CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgendas.length === 0 ? (
          <div className="col-span-2 p-10 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic space-y-2">
            <CalendarDays className="w-10 h-10 text-slate-700 mx-auto" />
            <p>Belum ada agenda kegiatan atau notulensi yang cocok dengan filter pencarian.</p>
          </div>
        ) : (
          filteredAgendas.map((agd) => {
            const hasNotulensi = !!agd.notulensi;
            const followUps = agd.notulensi?.tindakLanjutList || [];
            const completedFollowUps = followUps.filter(f => f.status === 'Selesai').length;

            return (
              <div
                key={agd.id}
                className={`bg-slate-900 p-5 rounded-2xl border transition-all shadow-md space-y-3.5 relative flex flex-col justify-between ${
                  agd.status === 'Berjalan' 
                    ? 'border-emerald-500/80 ring-1 ring-emerald-500/30' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Card Label */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-black bg-slate-950 text-emerald-400 border border-emerald-800/60 rounded tracking-wider uppercase">
                        AGENDA SERIKAT
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-300 rounded">
                        {agd.jenis}
                      </span>
                    </div>
                    {renderStatusBadge(agd.status)}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-base text-white hover:text-emerald-400 transition-colors cursor-pointer" onClick={() => handleOpenAgendaDetail(agd, 'minutes')}>
                      {agd.judul}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">{agd.deskripsi || 'Tidak ada deskripsi khusus.'}</p>
                  </div>

                  {/* Meta Date & Location */}
                  <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                    <p className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {new Date(agd.tanggalWaktu).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {agd.lokasi}
                    </p>
                  </div>

                  {/* Notulensi Status Indicator */}
                  <div className="flex items-center justify-between pt-1">
                    {hasNotulensi ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ✓ Notulensi Tersedia
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-slate-950 text-slate-400 border border-slate-800 rounded-lg">
                        <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        + Tambahkan Notulensi
                      </span>
                    )}

                    {followUps.length > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {completedFollowUps}/{followUps.length} Tindak Lanjut Selesai
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleOpenAgendaDetail(agd, 'info')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Info className="w-3.5 h-3.5 text-emerald-400" />
                      Detail
                    </button>

                    <button
                      onClick={() => handleOpenAgendaDetail(agd, 'minutes')}
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      📝 Notulensi
                    </button>

                    {agd.status === 'Berjalan' && (
                      <button
                        onClick={() => handleOpenAgendaDetail(agd, 'minutes')}
                        className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer shadow-md transition-colors animate-pulse"
                        title="Import File Notulensi untuk Agenda Berjalan"
                      >
                        📥 Import Notulensi
                      </button>
                    )}
                  </div>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(agd)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 cursor-pointer"
                        title="Edit Agenda"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteAgendaConfirmObj(agd)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Hapus Agenda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* INTEGRATED AGENDA & NOTULENSI MODAL WITH 5 TABS */}
      {selectedAgenda && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
            <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-4">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedAgenda(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="space-y-1 pr-8">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800 rounded uppercase tracking-wider">
                    {selectedAgenda.jenis}
                  </span>
                  {renderStatusBadge(selectedAgenda.status)}
                </div>
                <h2 className="text-xl font-bold text-white">{selectedAgenda.judul}</h2>
                <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                  <span>📍 {selectedAgenda.lokasi}</span>
                  <span>•</span>
                  <span>🕒 {new Date(selectedAgenda.tanggalWaktu).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
                </p>
              </div>

              {/* 5 INTEGRATED TABS */}
              <div className="flex overflow-x-auto border-b border-slate-800 gap-2 text-xs font-bold scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'info' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Informasi
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('participants')}
                  className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'participants' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Peserta ({selectedAgenda.daftarPeserta.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('minutes')}
                  className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'minutes' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Notulensi Rapat
                  {selectedAgenda.notulensi && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('followup')}
                  className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'followup' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  Tindak Lanjut ({selectedAgenda.notulensi?.tindakLanjutList?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('attachments')}
                  className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'attachments' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  Lampiran ({selectedAgenda.notulensi?.lampiranList?.length || 0})
                </button>
              </div>

              {/* Notice Banner */}
              {importNotice && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{importNotice}</span>
                </div>
              )}

              {/* TAB 1: INFORMASI AGENDA */}
              {activeTab === 'info' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="font-bold text-white text-sm">Detail Informasi Rapat / Agenda</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px]">PENANGGUNG JAWAB / PIMPINAN</span>
                        <strong className="text-white">{selectedAgenda.penanggungJawab}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">LOKASI</span>
                        <strong className="text-white">{selectedAgenda.lokasi}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">WAKTU SAMPAI SELESAI</span>
                        <strong className="text-white">{new Date(selectedAgenda.tanggalWaktu).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">STATUS AGENDA</span>
                        <div>{renderStatusBadge(selectedAgenda.status)}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-500 block text-[10px] mb-1">DESKRIPSI & POKOK BAHASAN</span>
                      <p className="text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                        {selectedAgenda.deskripsi || 'Tidak ada deskripsi khusus.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Notifikasi otomatis telah terkirim ke seluruh pengurus</span>
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold text-[10px]">
                      ✓ Terkirim
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: DAFTAR PESERTA */}
              {activeTab === 'participants' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="font-bold text-white text-sm">Daftar Peserta &amp; Jajaran Pengurus</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedAgenda.daftarPeserta.map((peserta, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span className="font-semibold text-slate-200 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            {peserta}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            Peserta
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NOTULENSI RAPAT (VIEWER / EDITOR / IMPORT / EXPORT) */}
              {activeTab === 'minutes' && (
                <div className="space-y-4 text-xs">

                  {/* Actions Header bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      {!isEditingMinutes ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsEditingMinutes(true)}
                            disabled={!isSuperAdmin}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit Notulensi
                          </button>

                          {/* File Import Button */}
                          <label
                            htmlFor="importNotulensiInput"
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Import File (.txt/.pdf/.docx)
                          </label>
                          <input
                            type="file"
                            id="importNotulensiInput"
                            onChange={handleImportNotulensiFile}
                            accept=".txt,.doc,.docx,.pdf,.csv,.json,.md"
                            className="hidden"
                          />
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingMinutes(false)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold cursor-pointer"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>

                    {selectedAgenda.notulensi && !isEditingMinutes && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportNotulensiPdf(selectedAgenda, selectedAgenda.notulensi!)}
                          className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>

                        <button
                          type="button"
                          onClick={() => exportNotulensiDocx(selectedAgenda, selectedAgenda.notulensi!)}
                          className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          DOCX
                        </button>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </button>
                      </div>
                    )}
                  </div>

                  {/* READ-ONLY VIEW MODE */}
                  {!isEditingMinutes ? (
                    selectedAgenda.notulensi ? (
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        
                        {/* Title & Metadata */}
                        <div className="pb-3 border-b border-slate-800">
                          <h3 className="text-base font-bold text-white">{selectedAgenda.notulensi.judulRapat || selectedAgenda.judul}</h3>
                          <p className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Pimpinan: <strong className="text-slate-200">{selectedAgenda.notulensi.pimpinanRapat || selectedAgenda.penanggungJawab}</strong></span>
                            <span>Notulis: <strong className="text-slate-200">{selectedAgenda.notulensi.notulis}</strong></span>
                            <span>Tempat: <strong className="text-slate-200">{selectedAgenda.notulensi.tempat || selectedAgenda.lokasi}</strong></span>
                          </p>
                        </div>

                        {/* Pokok Agenda */}
                        {selectedAgenda.notulensi.agendaPembahasan && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pokok Agenda Pembahasan</label>
                            <p className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-slate-200">
                              {selectedAgenda.notulensi.agendaPembahasan}
                            </p>
                          </div>
                        )}

                        {/* Isi Pembahasan */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Detail Risalah &amp; Isi Pembahasan Rapat</label>
                          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                            {selectedAgenda.notulensi.isiPembahasan || selectedAgenda.notulensi.isiNotulensi || 'Belum ada catatan detail.'}
                          </div>
                        </div>

                        {/* Keputusan Rapat List */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Keputusan / Kesepakatan Rapat</label>
                          {(selectedAgenda.notulensi.keputusanRapat && selectedAgenda.notulensi.keputusanRapat.length > 0) || (selectedAgenda.notulensi.poinKeputusan && selectedAgenda.notulensi.poinKeputusan.length > 0) ? (
                            <div className="space-y-2">
                              {(selectedAgenda.notulensi.keputusanRapat?.length ? selectedAgenda.notulensi.keputusanRapat : selectedAgenda.notulensi.poinKeputusan!).map((kep, idx) => (
                                <div key={idx} className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/60 flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <span className="p-1 bg-emerald-900 text-emerald-300 font-bold text-[10px] rounded shrink-0 mt-0.5">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-slate-200 font-medium leading-relaxed">{kep}</span>
                                  </div>

                                  {isSuperAdmin && (
                                    <button
                                      onClick={() => handleConvertDecisionToTask(kep)}
                                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                                      title="Buat Tugas Tindak Lanjut"
                                    >
                                      <ListTodo className="w-3 h-3" />
                                      Jadi Tindak Lanjut
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-500 italic">
                              Belum ada poin keputusan khusus yang dicatat.
                            </p>
                          )}
                        </div>

                        {/* Aspirasi & Catatan Tambahan */}
                        {(selectedAgenda.notulensi.aspirasiMasukan || selectedAgenda.notulensi.catatanTambahan) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedAgenda.notulensi.aspirasiMasukan && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Aspirasi &amp; Masukan Peserta</label>
                                <p className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-300">
                                  {selectedAgenda.notulensi.aspirasiMasukan}
                                </p>
                              </div>
                            )}

                            {selectedAgenda.notulensi.catatanTambahan && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Catatan Tambahan</label>
                                <p className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-300">
                                  {selectedAgenda.notulensi.catatanTambahan}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* RIWAYAT PERUBAHAN / VERSION HISTORY LOG */}
                        {selectedAgenda.notulensi.history && selectedAgenda.notulensi.history.length > 0 && (
                          <div className="pt-3 border-t border-slate-800 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <History className="w-3.5 h-3.5 text-emerald-400" />
                              Riwayat Perubahan Notulensi ({selectedAgenda.notulensi.history.length})
                            </label>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {selectedAgenda.notulensi.history.map((hist) => (
                                <div key={hist.id} className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] flex justify-between items-center text-slate-300">
                                  <div>
                                    <strong className="text-white">{hist.changedBy}</strong> <span className="text-slate-500">({hist.userRole || 'Pengurus'})</span>: {hist.summary}
                                  </div>
                                  <span className="text-[10px] text-slate-500 shrink-0">
                                    {new Date(hist.changedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
                        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">Belum ada risalah notulensi yang dibuat untuk agenda ini.</p>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setIsEditingMinutes(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            ✍️ Buat / Input Notulensi Baru
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    /* EDITING / FORM MODE */
                    <form onSubmit={handleSaveNotulensi} className="space-y-4">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                        <h3 className="font-bold text-white text-sm">Form Notulensi Rapat &amp; Risalah</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Judul Rapat</label>
                            <input
                              type="text"
                              value={notulensiForm.judulRapat}
                              onChange={(e) => setNotulensiForm({ ...notulensiForm, judulRapat: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Pimpinan Rapat</label>
                            <input
                              type="text"
                              value={notulensiForm.pimpinanRapat}
                              onChange={(e) => setNotulensiForm({ ...notulensiForm, pimpinanRapat: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Notulis</label>
                            <input
                              type="text"
                              value={notulensiForm.notulis}
                              onChange={(e) => setNotulensiForm({ ...notulensiForm, notulis: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Tempat / Lokasi</label>
                            <input
                              type="text"
                              value={notulensiForm.tempat}
                              onChange={(e) => setNotulensiForm({ ...notulensiForm, tempat: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Daftar Peserta Hadir</label>
                          <input
                            type="text"
                            value={notulensiForm.pesertaText}
                            onChange={(e) => setNotulensiForm({ ...notulensiForm, pesertaText: e.target.value })}
                            placeholder="Contoh: Seluruh Pengurus Harian, Korlap, Wakorlap"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Pokok Agenda Pembahasan</label>
                          <input
                            type="text"
                            value={notulensiForm.agendaPembahasan}
                            onChange={(e) => setNotulensiForm({ ...notulensiForm, agendaPembahasan: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Isi Pembahasan &amp; Risalah Rapat (Detail Diskusi)</label>
                          <textarea
                            rows={6}
                            value={notulensiForm.isiPembahasan}
                            onChange={(e) => setNotulensiForm({ ...notulensiForm, isiPembahasan: e.target.value })}
                            placeholder="Ketik atau paste isi pembahasan hasil rapat..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-sans leading-relaxed"
                            required
                          />
                        </div>

                        {/* Keputusan Rapat Builder */}
                        <div className="space-y-2">
                          <label className="block text-slate-400 font-semibold">Point Decision / Keputusan Rapat</label>
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={notulensiForm.newDecisionText}
                              onChange={(e) => setNotulensiForm({ ...notulensiForm, newDecisionText: e.target.value })}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDecisionPoint(); } }}
                              placeholder="Ketik poin keputusan lalu tekan Tambah..."
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                            />
                            <button
                              type="button"
                              onClick={handleAddDecisionPoint}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                            >
                              + Tambah
                            </button>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {notulensiForm.keputusanRapat.map((dec, idx) => (
                              <div key={idx} className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                                <span className="text-slate-200">#{idx + 1}. {dec}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDecisionPoint(idx)}
                                  className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Aspirasi &amp; Masukan</label>
                            <textarea
                              rows={2}
                              value={notulensiForm.aspirasiMasukan}
                              onChange={(e) => setNotulensiForm({ ...notulensiForm, aspirasiMasukan: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Catatan Tambahan</label>
                            <textarea
                              rows={2}
                              value={notulensiForm.catatanTambahan}
                              onChange={(e) => setNotulensiForm({ ...notulensiForm, catatanTambahan: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                            />
                          </div>
                        </div>

                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingMinutes(false)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-lg"
                        >
                          💾 Simpan Notulensi ke Firestore
                        </button>
                      </div>
                    </form>
                  )}

                </div>
              )}

              {/* TAB 4: TINDAK LANJUT KEPUTUSAN (PROGRESS TRACKING) */}
              {activeTab === 'followup' && (
                <div className="space-y-4 text-xs">
                  
                  {/* Progress Header */}
                  {selectedAgenda.notulensi?.tindakLanjutList && selectedAgenda.notulensi.tindakLanjutList.length > 0 && (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-white">Progress Tindak Lanjut Decision</span>
                        <span className="text-emerald-400">
                          {selectedAgenda.notulensi.tindakLanjutList.filter(t => t.status === 'Selesai').length} / {selectedAgenda.notulensi.tindakLanjutList.length} Selesai
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{
                            width: `${Math.round((selectedAgenda.notulensi.tindakLanjutList.filter(t => t.status === 'Selesai').length / selectedAgenda.notulensi.tindakLanjutList.length) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Add New Followup Task Form */}
                  {isSuperAdmin && (
                    <form onSubmit={handleAddFollowUpTask} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        Tambah Item Tindak Lanjut
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 mb-1 font-semibold">Tugas / Action Item</label>
                          <input
                            type="text"
                            value={newFollowUp.task}
                            onChange={(e) => setNewFollowUp({ ...newFollowUp, task: e.target.value })}
                            placeholder="Misal: Melakukan kajian kenaikan upah sektoral"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">PIC / Divisi Penanggung Jawab</label>
                          <input
                            type="text"
                            value={newFollowUp.pic}
                            onChange={(e) => setNewFollowUp({ ...newFollowUp, pic: e.target.value })}
                            placeholder="Misal: Divisi Advokasi / Litbang"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Deadline Completion</label>
                          <input
                            type="date"
                            value={newFollowUp.deadline}
                            onChange={(e) => setNewFollowUp({ ...newFollowUp, deadline: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          + Tambah Item Tindak Lanjut
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tindak Lanjut Items List */}
                  <div className="space-y-2">
                    {selectedAgenda.notulensi?.tindakLanjutList && selectedAgenda.notulensi.tindakLanjutList.length > 0 ? (
                      selectedAgenda.notulensi.tindakLanjutList.map((item) => (
                        <div key={item.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-white text-xs">{item.task}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-x-3">
                                <span>PIC: <strong className="text-emerald-400">{item.pic}</strong></span>
                                <span>Deadline: <strong className="text-slate-200">{item.deadline}</strong></span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={item.status}
                                onChange={(e) => handleUpdateFollowUpStatus(item.id, e.target.value as any)}
                                disabled={!isSuperAdmin}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-slate-900 cursor-pointer ${
                                  item.status === 'Selesai' 
                                    ? 'text-emerald-400 border-emerald-800' 
                                    : item.status === 'Berjalan'
                                    ? 'text-amber-400 border-amber-800'
                                    : 'text-slate-400 border-slate-800'
                                }`}
                              >
                                <option value="Belum Dimulai">🔴 Belum Dimulai</option>
                                <option value="Berjalan">🟡 Sedang Berjalan</option>
                                <option value="Selesai">🟢 Selesai</option>
                              </select>

                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteFollowUpTask(item.id)}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs italic">
                        Belum ada item tindak lanjut untuk keputusan rapat ini.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 5: LAMPIRAN DOKUMEN */}
              {activeTab === 'attachments' && (
                <div className="space-y-4 text-xs">
                  
                  {/* Upload Lampiran Box */}
                  {isSuperAdmin && (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
                      <Upload className="w-6 h-6 text-emerald-400 mx-auto" />
                      <p className="font-bold text-white">Unggah File Lampiran Dokumen Notulensi</p>
                      <input
                        type="file"
                        id="directLampiranUpload"
                        onChange={handleUploadLampiranDirect}
                        className="hidden"
                      />
                      <label
                        htmlFor="directLampiranUpload"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Unggah Lampiran Baru
                      </label>
                    </div>
                  )}

                  <div className="space-y-2">
                    {selectedAgenda.notulensi?.lampiranList && selectedAgenda.notulensi.lampiranList.length > 0 ? (
                      selectedAgenda.notulensi.lampiranList.map((att) => (
                        <div key={att.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden text-slate-300">
                            <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-white truncate">{att.fileName}</p>
                              <p className="text-[10px] text-slate-500">Diunggah: {new Date(att.uploadedAt).toLocaleString('id-ID')}</p>
                            </div>
                          </div>

                          {att.fileDataUrl && (
                            <a
                              href={att.fileDataUrl}
                              download={att.fileName}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Unduh
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs italic">
                        Belum ada file lampiran terunggah.
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        </ModalPortal>
      )}

      {/* ADD / EDIT AGENDA MODAL */}
      {isAddModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
            <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-lg w-full space-y-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-white">
                {editingAgenda ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan Baru'}
              </h2>

              <form onSubmit={handleSaveAgenda} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Judul Agenda Kegiatan</label>
                  <input
                    type="text"
                    value={formData.judul || ''}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    placeholder="Misal: Rapat Evaluasi PKB & Sembako"
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
                    <label className="block text-slate-400 mb-1 font-semibold">Status Agenda</label>
                    <select
                      value={formData.status || 'Akan Datang'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                    >
                      <option value="Akan Datang">🔵 Akan Datang</option>
                      <option value="Berjalan">🔵 Sedang Berjalan</option>
                      <option value="Selesai">✅ Selesai</option>
                      <option value="Dibatalkan">⛔ Dibatalkan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Waktu &amp; Tanggal</label>
                  <input
                    type="datetime-local"
                    value={formData.tanggalWaktu || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalWaktu: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Lokasi / Tempat</label>
                  <input
                    type="text"
                    value={formData.lokasi || ''}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Penanggung Jawab / Pimpinan</label>
                  <input
                    type="text"
                    value={formData.penanggungJawab || ''}
                    onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Deskripsi Agenda &amp; Pokok Pembahasan</label>
                  <textarea
                    rows={3}
                    value={formData.deskripsi || ''}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    {editingAgenda ? 'Simpan Perubahan' : 'Tambah Agenda'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* CONFIRM DELETE AGENDA MODAL WITH EXPLICIT MANDATED WARNING TEXT */}
      <ConfirmModal
        isOpen={!!deleteAgendaConfirmObj}
        title="⚠️ Konfirmasi Hapus Agenda Kegiatan"
        message={`Yakin ingin menghapus agenda "${deleteAgendaConfirmObj?.judul}"? Data agenda dan notulensi yang terkait akan ikut terhapus dan tidak dapat dikembalikan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        icon="trash"
        onConfirm={handleDeleteAgendaConfirm}
        onCancel={() => setDeleteAgendaConfirmObj(null)}
      />

    </div>
  );
};
