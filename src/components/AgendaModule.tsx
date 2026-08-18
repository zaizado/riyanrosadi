import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Eye,
  History,
  ListTodo,
  CheckSquare,
  Info,
  FileCheck,
  FilePlus,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { 
  OrganizationAgenda, 
  AgendaType, 
  UserAccount, 
  checkIsSuperAdmin, 
  NotulensiAgenda,
  TindakLanjutItem,
  LampiranNotulensiItem,
  NotulensiHistoryItem,
  NotulensiFileItem
} from '../types';
import { getLocalDateISO, getLocalDateTimeISO } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';
import { ModalPortal } from './ModalPortal';
import { SectionHeader, PrimaryButton } from './ui/DesignSystem';
import { exportNotulensiPdf, exportNotulensiDocx } from '../utils/notulensiExport';
import { parseUploadedFile } from '../utils/documentParser';
import { uploadFileToStorage } from '../lib/firebase';
import { AppService } from '../services/appService';
import { AuditService } from '../services/auditService';
import { repositories } from '../repositories';

interface AgendaModuleProps {
  agendas?: OrganizationAgenda[];
  notulensiFiles?: NotulensiFileItem[];
  onAddAgenda: (newAgenda: OrganizationAgenda) => void;
  onUpdateAgenda: (updatedAgenda: OrganizationAgenda) => void;
  onDeleteAgenda: (agendaId: string) => void;
  currentUser: UserAccount;
}

const formatFileSize = (bytes: number | string): string => {
  if (typeof bytes === 'string') return bytes;
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const AgendaModule: React.FC<AgendaModuleProps> = ({
  agendas = [],
  notulensiFiles = [],
  onAddAgenda,
  onUpdateAgenda,
  onDeleteAgenda,
  currentUser,
}) => {
  const [localAgendas, setLocalAgendas] = useState<OrganizationAgenda[]>(agendas);
  const [localNotulensiFiles, setLocalNotulensiFiles] = useState<NotulensiFileItem[]>(notulensiFiles);

  // Scoped on-demand subscription for Agendas & Notulensi with unmount cleanup
  useEffect(() => {
    let isMounted = true;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      repositories.agendas.subscribeRecent(
        agendas,
        (items) => {
          if (isMounted) setLocalAgendas(items);
        },
        (err) => console.warn('Agendas on-demand subscribe warning:', err.message),
        50
      )
    );

    unsubs.push(
      repositories.notulensi.subscribeRecent(
        notulensiFiles,
        (items) => {
          if (isMounted) setLocalNotulensiFiles(items);
        },
        (err) => console.warn('Notulensi on-demand subscribe warning:', err.message),
        50
      )
    );

    return () => {
      isMounted = false;
      unsubs.forEach(fn => { try { fn(); } catch (e) {} });
    };
  }, []);

  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<OrganizationAgenda | null>(null);
  
  // Delete Agenda Modal state
  const [deleteAgendaConfirmObj, setDeleteAgendaConfirmObj] = useState<OrganizationAgenda | null>(null);
  const [isDeletingAgenda, setIsDeletingAgenda] = useState(false);
  
  // Delete Notulensi File Modal state
  const [confirmDeleteNotulensiFileObj, setConfirmDeleteNotulensiFileObj] = useState<NotulensiFileItem | null>(null);
  const [isDeletingNotulensiFile, setIsDeletingNotulensiFile] = useState(false);

  // File Upload State
  const [isUploadingNotulensi, setIsUploadingNotulensi] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [notulensiNotification, setNotulensiNotification] = useState<string | null>(null);
  const [agendaNotification, setAgendaNotification] = useState<string | null>(null);

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
    deadline: getLocalDateISO(new Date(Date.now() + 7 * 86400000)),
    status: 'Belum Dimulai',
    notes: ''
  });

  // Form state for add/edit agenda
  const [formData, setFormData] = useState<Partial<OrganizationAgenda>>({
    judul: '',
    jenis: 'Rapat',
    tanggalWaktu: getLocalDateTimeISO(new Date(Date.now() + 86400000)),
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

  // Helper to extract date & time formatted strings
  const parseDateTimeFields = (dtStr?: string) => {
    if (!dtStr) {
      const now = new Date();
      return {
        tanggal: now.toLocaleDateString('id-ID', { dateStyle: 'full' }),
        waktu: now.toLocaleTimeString('id-ID', { timeStyle: 'short' })
      };
    }
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) {
      const parts = dtStr.split('T');
      return {
        tanggal: parts[0] || dtStr,
        waktu: parts[1] || '00:00'
      };
    }
    return {
      tanggal: d.toLocaleDateString('id-ID', { dateStyle: 'full' }),
      waktu: d.toLocaleTimeString('id-ID', { timeStyle: 'short' })
    };
  };

  // Enhanced Global Search across title, date, participants, discussion content, decisions, files
  const filteredAgendas = localAgendas.filter((agd) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      const matchType = selectedTypeFilter === 'All' || agd.jenis === selectedTypeFilter;
      const matchStatus = statusFilter === 'All' || agd.status === statusFilter;
      return matchType && matchStatus;
    }

    const notulensi = agd.notulensi;
    const files = localNotulensiFiles.filter(f => f.agendaId === agd.id);

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
      (notulensi.keputusanRapat && notulensi.keputusanRapat.some(k => k.toLowerCase().includes(query)))
    ) : false;

    const isMatchInFiles = files.some(f => 
      f.fileName.toLowerCase().includes(query) || 
      f.uploadedByName.toLowerCase().includes(query)
    );

    const matchType = selectedTypeFilter === 'All' || agd.jenis === selectedTypeFilter;
    const matchStatus = statusFilter === 'All' || agd.status === statusFilter;

    return (isMatchInAgenda || isMatchInNotulensi || isMatchInFiles) && matchType && matchStatus;
  });

  const handleOpenAdd = () => {
    if (!isSuperAdmin) return;
    setEditingAgenda(null);
    setFormData({
      judul: '',
      jenis: 'Rapat',
      tanggalWaktu: getLocalDateTimeISO(new Date(Date.now() + 86400000)),
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

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !formData.judul) return;

    const nowIso = new Date().toISOString();
    const dtInfo = parseDateTimeFields(formData.tanggalWaktu);

    try {
      if (editingAgenda) {
        const updated: OrganizationAgenda = {
          ...editingAgenda,
          ...formData,
          tanggal: dtInfo.tanggal,
          waktu: dtInfo.waktu,
          updatedAt: nowIso,
          updatedBy: currentUser.name
        } as OrganizationAgenda;

        await onUpdateAgenda(updated);

        if (selectedAgenda && selectedAgenda.id === updated.id) {
          setSelectedAgenda(updated);
        }
        setAgendaNotification(`Agenda "${updated.judul}" berhasil diperbarui.`);
      } else {
        const newAgd: OrganizationAgenda = {
          id: `agd-${Date.now()}`,
          judul: formData.judul || 'Agenda Baru',
          jenis: (formData.jenis as AgendaType) || 'Rapat',
          tanggalWaktu: formData.tanggalWaktu || nowIso,
          tanggal: dtInfo.tanggal,
          waktu: dtInfo.waktu,
          lokasi: formData.lokasi || 'Sekretariat',
          penanggungJawab: formData.penanggungJawab || currentUser.name,
          deskripsi: formData.deskripsi || '',
          daftarPeserta: formData.daftarPeserta || ['Pengurus Harian SBN KASBI'],
          status: (formData.status as any) || 'Akan Datang',
          notifikasiTerkirim: true,
          createdAt: nowIso,
          createdBy: currentUser.name,
          updatedAt: nowIso,
          updatedBy: currentUser.name
        };

        await onAddAgenda(newAgd);

        setAgendaNotification(`Agenda "${newAgd.judul}" berhasil dibuat.`);
      }

      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save agenda:', err);
      alert('Gagal menyimpan agenda: ' + (err?.message || 'Kesalahan jaringan/database'));
    }
  };

  // Delete Agenda Confirm Handler
  const handleDeleteAgendaConfirm = async () => {
    if (!deleteAgendaConfirmObj) return;

    const target = deleteAgendaConfirmObj;
    setIsDeletingAgenda(true);

    try {
      // 1. Delete agenda from Firestore (triggers deterministic audit log in App.tsx)
      await onDeleteAgenda(target.id);

      // 2. Cleanup all associated notulensi files from Storage & Firestore
      const filesToDelete = notulensiFiles.filter(f => f.agendaId === target.id);
      for (const fileItem of filesToDelete) {
        try {
          await AppService.deleteNotulensiFile(fileItem);
        } catch (err) {
          console.warn("Storage cleanup warning during agenda delete:", err);
        }
      }

      setAgendaNotification('Agenda berhasil dihapus.');
      if (selectedAgenda && selectedAgenda.id === target.id) {
        setSelectedAgenda(null);
      }
      setDeleteAgendaConfirmObj(null);
    } catch (err) {
      console.error("Gagal menghapus agenda:", err);
      setAgendaNotification('Agenda gagal dihapus. Silakan coba lagi.');
    } finally {
      setIsDeletingAgenda(false);
    }
  };

  // Open Integrated Agenda Detail Modal
  const handleOpenAgendaDetail = (agenda: OrganizationAgenda, initialTab: 'info' | 'participants' | 'minutes' | 'followup' | 'attachments' = 'minutes') => {
    setSelectedAgenda(agenda);
    setActiveTab(initialTab);
    setNotulensiNotification(null);

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

  // Upload Notulensi File to Firebase Storage
  const handleUploadNotulensiToStorage = async (file: File) => {
    if (!selectedAgenda) return;

    // Validate extension
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.csv', '.json', '.md'];
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    const isValidExtension = validExtensions.includes(ext) || 
      file.type.includes('pdf') || 
      file.type.includes('word') || 
      file.type.includes('text');

    if (!isValidExtension) {
      setNotulensiNotification(`⚠️ Format file "${file.name}" tidak didukung. Harap unggah file PDF, DOC, DOCX, atau TXT.`);
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setNotulensiNotification(`⚠️ Ukuran file "${file.name}" melebihi batas maksimal 20MB.`);
      return;
    }

    setIsUploadingNotulensi(true);
    setUploadStatusMsg("Mengupload notulensi...");
    setNotulensiNotification(null);

    try {
      const storagePath = `notulensi/${selectedAgenda.id}/${Date.now()}_${file.name}`;
      const uploadRes = await uploadFileToStorage(storagePath, file);

      const fileItem: NotulensiFileItem = {
        id: `notulfile-${Date.now()}`,
        agendaId: selectedAgenda.id,
        fileName: file.name,
        fileType: file.type || ext.replace('.', ''),
        fileSize: formatFileSize(file.size),
        storagePath: uploadRes.storagePath,
        downloadUrl: uploadRes.downloadUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.name,
        updatedAt: new Date().toISOString()
      };

      await AppService.addNotulensiFile(fileItem);

      await AuditService.createLog(
        currentUser.name,
        currentUser.role,
        'Agenda',
        'Upload Notulensi',
        `Mengunggah file notulensi "${file.name}" (${fileItem.fileSize}) untuk agenda "${selectedAgenda.judul}"`
      );

      // Extract text as fallback to populate editor form
      try {
        const parsed = await parseUploadedFile(file);
        if (parsed.rawText && parsed.rawText.length > 10) {
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
          setIsEditingMinutes(true);
        }
      } catch (e) {
        console.warn("Parsing text fallback error:", e);
      }

      setNotulensiNotification(`✅ File notulensi "${file.name}" berhasil diunggah ke Firebase Storage.`);
    } catch (err: any) {
      console.error("Gagal mengunggah file notulensi:", err);
      setNotulensiNotification(`❌ File notulensi gagal diunggah: ${err?.message || 'Silakan coba lagi.'}`);
    } finally {
      setIsUploadingNotulensi(false);
      setUploadStatusMsg('');
    }
  };

  // Delete Notulensi File Confirm Handler
  const handleDeleteNotulensiFileConfirm = async () => {
    if (!confirmDeleteNotulensiFileObj || !selectedAgenda) return;

    const targetFile = confirmDeleteNotulensiFileObj;
    setIsDeletingNotulensiFile(true);
    setNotulensiNotification("Menghapus notulensi...");

    try {
      await AppService.deleteNotulensiFile(targetFile);

      await AuditService.createLog(
        currentUser.name,
        currentUser.role,
        'Agenda',
        'Hapus Notulensi',
        `Menghapus file notulensi "${targetFile.fileName}" dari agenda "${selectedAgenda.judul}"`
      );

      setNotulensiNotification(`File notulensi berhasil dihapus.`);
      setConfirmDeleteNotulensiFileObj(null);
    } catch (err: any) {
      console.error("Gagal menghapus file notulensi:", err);
      setNotulensiNotification(`Gagal menghapus file notulensi. Silakan coba lagi.`);
    } finally {
      setIsDeletingNotulensiFile(false);
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

  // Save Notulensi Form Data to Firestore Agenda Doc
  const handleSaveNotulensi = async (e: React.FormEvent) => {
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
      history: [historyItem, ...(existingNotulensi?.history || [])],
      createdBy: existingNotulensi?.createdBy || currentUser.name,
      createdAt: existingNotulensi?.createdAt || now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updatedAgenda: OrganizationAgenda = {
      ...selectedAgenda,
      notulensi: newNotulensiObj,
      updatedAt: now,
      updatedBy: currentUser.name
    };

    onUpdateAgenda(updatedAgenda);
    setSelectedAgenda(updatedAgenda);
    setIsEditingMinutes(false);

    await AuditService.createLog(
      currentUser.name,
      currentUser.role,
      'Agenda',
      'Simpan Notulensi Text',
      `Menyimpan risalah notulensi rapat untuk agenda "${selectedAgenda.judul}".`
    );

    setNotulensiNotification('Catatan notulensi berhasil disimpan ke Firestore!');
  };

  // Convert Decision Point to Tindak Lanjut Task
  const handleConvertDecisionToTask = (decisionText: string) => {
    if (!selectedAgenda || !selectedAgenda.notulensi) return;

    const newTask: TindakLanjutItem = {
      id: `tl-${Date.now()}`,
      task: decisionText,
      pic: selectedAgenda.notulensi.pimpinanRapat || selectedAgenda.penanggungJawab,
      deadline: getLocalDateISO(new Date(Date.now() + 7 * 86400000)),
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
      deadline: getLocalDateISO(new Date(Date.now() + 7 * 86400000)),
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
        title="INFORMASI AGENDA & KEGIATAN SERIKAT"
        description="Sistem Terintegrasi Agenda Rapat, Risalah Notulensi Realtime, Storage Dokumen & Tindak Lanjut"
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

      {/* Global Notification Banner */}
      {agendaNotification && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {agendaNotification}
          </span>
          <button onClick={() => setAgendaNotification(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTER & GLOBAL SEARCH BAR */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari agenda, notulensi, file, keputusan, kata kunci..."
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
            const currentFiles = localNotulensiFiles.filter(f => f.agendaId === agd.id);
            const hasNotulensiText = !!agd.notulensi;
            const hasFiles = currentFiles.length > 0;

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

                  {/* Notulensi & File Indicators */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {hasFiles ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-lg">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {currentFiles.length} File Notulensi Terunggah
                      </span>
                    ) : hasNotulensiText ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ✓ Notulensi Text Tersedia
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-slate-950 text-slate-400 border border-slate-800 rounded-lg">
                        <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        Belum Ada Notulensi
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

                    {/* MANDATED "📥 IMPORT NOTULENSI" BUTTON FOR AGENDA STATUS "BERJALAN" */}
                    {agd.status === 'Berjalan' && (
                      <button
                        onClick={() => handleOpenAgendaDetail(agd, 'attachments')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer shadow-lg transition-colors animate-pulse"
                        title="Import File Notulensi untuk Agenda Berjalan"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        📥 IMPORT NOTULENSI
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
                  Risalah Text
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('attachments')}
                  className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'attachments' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  File Notulensi Storage ({notulensiFiles.filter(f => f.agendaId === selectedAgenda.id).length})
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
              </div>

              {/* Notification Banner Inside Modal */}
              {notulensiNotification && (
                <div className="p-3 bg-slate-950 border border-emerald-700/80 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
                  <span>{notulensiNotification}</span>
                  <button onClick={() => setNotulensiNotification(null)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
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
                        <span className="text-slate-500 block text-[10px]">WAKTU AGENDA</span>
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

              {/* TAB 3: NOTULENSI RISALAH TEXT */}
              {activeTab === 'minutes' && (
                <div className="space-y-4 text-xs">

                  {/* Actions Header bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      {!isEditingMinutes ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingMinutes(true)}
                          disabled={!isSuperAdmin}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Risalah Text
                        </button>
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
                          Export PDF
                        </button>

                        <button
                          type="button"
                          onClick={() => exportNotulensiDocx(selectedAgenda, selectedAgenda.notulensi!)}
                          className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export DOCX
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
                          {(selectedAgenda.notulensi.keputusanRapat && selectedAgenda.notulensi.keputusanRapat.length > 0) ? (
                            <div className="space-y-2">
                              {selectedAgenda.notulensi.keputusanRapat.map((kep, idx) => (
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

                      </div>
                    ) : (
                      <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
                        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">Belum ada risalah text yang dibuat untuk agenda ini.</p>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setIsEditingMinutes(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            ✍️ Input Risalah Text
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    /* EDITING / FORM MODE */
                    <form onSubmit={handleSaveNotulensi} className="space-y-4">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                        <h3 className="font-bold text-white text-sm">Form Risalah &amp; Notulensi Rapat</h3>

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
                          💾 Simpan Risalah ke Firestore
                        </button>
                      </div>
                    </form>
                  )}

                </div>
              )}

              {/* TAB 4: FILE NOTULENSI FIREBASE STORAGE */}
              {activeTab === 'attachments' && (
                <div className="space-y-4 text-xs">
                  
                  {/* Upload Box */}
                  <div className="p-5 bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
                    <Upload className="w-8 h-8 text-blue-400 mx-auto" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Unggah File Notulensi Resmi ke Firebase Storage</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Format didukung: PDF, DOC, DOCX, TXT (Maksimal 20MB)</p>
                    </div>

                    <input
                      type="file"
                      id="notulensiStorageInput"
                      accept=".pdf,.doc,.docx,.txt,.rtf,.csv,.json,.md"
                      disabled={isUploadingNotulensi}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadNotulensiToStorage(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    <div>
                      <label
                        htmlFor="notulensiStorageInput"
                        className={`inline-flex items-center gap-2 px-5 py-2.5 ${
                          isUploadingNotulensi ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg'
                        } font-black rounded-xl text-xs transition-colors`}
                      >
                        {isUploadingNotulensi ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            {uploadStatusMsg || 'Mengupload notulensi...'}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            📥 IMPORT / UNGGAH FILE NOTULENSI
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* List of Files from Firestore `notulensi` collection */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-emerald-400" />
                      Daftar Dokumen Notulensi Terunggah ({localNotulensiFiles.filter(f => f.agendaId === selectedAgenda.id).length})
                    </h4>

                    {localNotulensiFiles.filter(f => f.agendaId === selectedAgenda.id).length > 0 ? (
                      localNotulensiFiles.filter(f => f.agendaId === selectedAgenda.id).map((att) => (
                        <div key={att.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 overflow-hidden text-slate-300">
                            <div className="p-2 bg-blue-950/80 border border-blue-800/60 text-blue-400 rounded-lg shrink-0 mt-0.5">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate space-y-0.5">
                              <p className="font-bold text-white truncate text-xs">{att.fileName}</p>
                              <p className="text-[10px] text-slate-400 flex flex-wrap gap-x-3">
                                <span>Ukuran: <strong className="text-slate-200">{att.fileSize}</strong></span>
                                <span>Pengunggah: <strong className="text-emerald-400">{att.uploadedByName || 'Pengurus'}</strong></span>
                                <span>Waktu: <strong className="text-slate-300">{new Date(att.uploadedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* LIHAT BUTTON */}
                            <a
                              href={att.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              title="Lihat dokumen di tab baru"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              LIHAT
                            </a>

                            {/* DOWNLOAD BUTTON */}
                            <a
                              href={att.downloadUrl}
                              download={att.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                              title="Unduh file notulensi"
                            >
                              <Download className="w-3.5 h-3.5" />
                              DOWNLOAD
                            </a>

                            {/* HAPUS BUTTON */}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteNotulensiFileObj(att)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Hapus file notulensi ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs italic space-y-1">
                        <Paperclip className="w-8 h-8 text-slate-700 mx-auto" />
                        <p>Belum ada file notulensi yang diunggah ke Storage untuk agenda ini.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 5: TINDAK LANJUT KEPUTUSAN (PROGRESS TRACKING) */}
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

      {/* MANDATED CONFIRM DELETE AGENDA MODAL WITH EXACT SPECIFICATION */}
      {deleteAgendaConfirmObj && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
            <div className="mobile-modal-card bg-slate-900 border border-rose-900/60 text-white p-6 shadow-2xl relative max-w-md w-full space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-rose-950 text-rose-400 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Konfirmasi Hapus Agenda</h3>
                  <p className="text-xs text-slate-300 mt-1">Apakah Anda yakin ingin menghapus agenda ini?</p>
                </div>
              </div>

              {/* Detail Agenda yang akan dihapus */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div>
                  <span className="text-slate-500 block text-[10px]">JUDUL AGENDA</span>
                  <strong className="text-white text-sm">{deleteAgendaConfirmObj.judul}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">TANGGAL</span>
                    <span className="text-slate-200 font-semibold">
                      {deleteAgendaConfirmObj.tanggal || parseDateTimeFields(deleteAgendaConfirmObj.tanggalWaktu).tanggal}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">WAKTU</span>
                    <span className="text-slate-200 font-semibold">
                      {deleteAgendaConfirmObj.waktu || parseDateTimeFields(deleteAgendaConfirmObj.tanggalWaktu).waktu}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isDeletingAgenda}
                  onClick={() => setDeleteAgendaConfirmObj(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  disabled={isDeletingAgenda}
                  onClick={handleDeleteAgendaConfirm}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg"
                >
                  {isDeletingAgenda ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      MENGHAPUS...
                    </>
                  ) : (
                    'HAPUS AGENDA'
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* CONFIRM DELETE NOTULENSI FILE MODAL */}
      {confirmDeleteNotulensiFileObj && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
            <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-md w-full space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-rose-950 text-rose-400 rounded-xl shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Konfirmasi Hapus File Notulensi</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Yakin ingin menghapus file notulensi "<strong className="text-white">{confirmDeleteNotulensiFileObj.fileName}</strong>"?
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                File akan dihapus permanen dari Firebase Storage dan data referensi di Firestore akan dibersihkan.
              </p>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isDeletingNotulensiFile}
                  onClick={() => setConfirmDeleteNotulensiFileObj(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  disabled={isDeletingNotulensiFile}
                  onClick={handleDeleteNotulensiFileConfirm}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg"
                >
                  {isDeletingNotulensiFile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      MENGHAPUS...
                    </>
                  ) : (
                    'HAPUS FILE'
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
};
