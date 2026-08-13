import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  UserX,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Camera,
  RefreshCw,
  UserPlus,
  UserMinus,
  CheckSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Member, Gender, EmploymentStatus, MemberStatus, ShiftType, UserAccount, DeletedMemberAudit, AuditLog } from '../types';
import { ConfirmModal } from './ConfirmModal';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { compressImage } from '../lib/imageUtils';
import { ModalPortal } from './ModalPortal';
import { SectionHeader, PrimaryButton, SecondaryButton } from './ui/DesignSystem';
import { CameraCaptureModal } from './CameraCaptureModal';

import { exportWorkbookToExcel } from '../utils/exportAndPrintUtils';
import { getLocalDateISO } from '../utils/dateUtils';
import { saveFirestoreDoc } from '../lib/firebase';
import { AuditService } from '../services/auditService';

const OFFICIAL_HEADERS = [
  'NIK',
  'NAMA',
  'JENISKELAMIN',
  'GEDUNG',
  'LOKASI',
  'DEPARTEMEN',
  'TERHITUNG MULAI BEKERJA',
  'POSISI',
  'Union',
  'ALAMAT'
];

interface SyncPreviewAnalysis {
  batchId: string;
  totalRowsInFile: number;
  newMembers: Member[];
  updatedMembers: Member[];
  reactivatedMembers: Member[];
  setInactiveMembers: Member[];
  errorRows: { rowNum: number; nik?: string; nama?: string; reason: string }[];
  finalMembersList: Member[];
}

interface MembersModuleProps {
  members: Member[];
  auditLogs?: AuditLog[];
  onAddMember: (newMember: Member) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onImportMembers: (importedMembers: Member[]) => void;
  onOpenCardModal?: (member: Member) => void;
  currentUser: UserAccount;
}

export const MembersModule: React.FC<MembersModuleProps> = ({
  members,
  auditLogs = [],
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onImportMembers,
  onOpenCardModal,
  currentUser,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All'); // 'All' | 'Aktif' | 'Tidak Aktif'

  // Table Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modals state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Deletion with Audit Trail Modal State
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('Mengundurkan Diri / Resign');
  const [deleteNotesManual, setDeleteNotesManual] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedAudits, setDeletedAudits] = useState<DeletedMemberAudit[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Synchronize deletedAudits from persistent auditLogs Firestore collection
  useEffect(() => {
    if (auditLogs && auditLogs.length > 0) {
      const extractedAudits: DeletedMemberAudit[] = auditLogs
        .filter(log => log.modul === 'Data Anggota' && log.aksi === 'Hapus Anggota')
        .map(log => {
          if (log.deletedMemberAudit) {
            return log.deletedMemberAudit;
          }
          return {
            id: `del-audit-${log.id}`,
            memberId: 'N/A',
            nomorAnggota: 'N/A',
            nik: 'N/A',
            namaLengkap: log.detail ? log.detail.split('|')[0]?.replace('Hapus Anggota:', '').trim() || log.detail : 'Anggota',
            departemen: 'N/A',
            bagian: 'N/A',
            alasanPenghapusan: 'Hapus Anggota',
            keteranganDetail: log.detail,
            deletedBy: `${log.userNama} (${log.userRole})`,
            deletedAt: log.timestamp
          };
        });
      setDeletedAudits(extractedAudits);
    }
  }, [auditLogs]);

  // Excel Sync Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSavingSync, setIsSavingSync] = useState(false);
  const [previewAnalysis, setPreviewAnalysis] = useState<SyncPreviewAnalysis | null>(null);
  const [previewTab, setPreviewTab] = useState<'summary' | 'new' | 'updated' | 'inactive' | 'reactivated' | 'error'>('summary');
  const [previewPage, setPreviewPage] = useState<number>(1);

  // Import Popup Result Notification
  const [importPopupResult, setImportPopupResult] = useState<{
    addedCount: number;
    updatedCount: number;
    missingCount: number;
    reactivatedCount: number;
    errorCount: number;
  } | null>(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Dynamic Departments list
  const departmentsList = useMemo(() => {
    const defaultDepts = [
      'Assembly',
      'Sewing',
      'Cutting',
      'Bottom',
      'Quality Control',
      'Maintenance',
      'Logistics',
      'HR / GA'
    ];
    const deptSet = new Set<string>(defaultDepts);
    members.forEach(m => {
      if (m.departemen && m.departemen.trim()) {
        deptSet.add(m.departemen.trim());
      }
    });
    return Array.from(deptSet).sort();
  }, [members]);

  // Statistics
  const activeCount = useMemo(() => {
    return members.filter(m => m.statusKeanggotaan === 'Aktif' && !m.isMissingFromExcel).length;
  }, [members]);

  const inactiveCount = useMemo(() => {
    return members.filter(m => m.statusKeanggotaan === 'Tidak Aktif' || m.statusKeanggotaan === 'Non-Aktif' || m.isMissingFromExcel === true).length;
  }, [members]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedStatus, pageSize]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchSearch = !query || 
        (m.namaLengkap && m.namaLengkap.toLowerCase().includes(query)) ||
        (m.nik && m.nik.toLowerCase().includes(query)) ||
        (m.nomorAnggota && m.nomorAnggota.toLowerCase().includes(query)) ||
        (m.bagian && m.bagian.toLowerCase().includes(query)) ||
        (m.departemen && m.departemen.toLowerCase().includes(query)) ||
        (m.nomorHp && m.nomorHp.includes(query));

      const matchDept = selectedDept === 'All' || m.departemen === selectedDept;

      const isMemberInactive = m.statusKeanggotaan === 'Tidak Aktif' || m.statusKeanggotaan === 'Non-Aktif' || m.isMissingFromExcel === true;
      const matchStatus = 
        selectedStatus === 'All' ? true :
        selectedStatus === 'Aktif' ? (m.statusKeanggotaan === 'Aktif' && !m.isMissingFromExcel) :
        selectedStatus === 'Tidak Aktif' ? isMemberInactive : true;

      return matchSearch && matchDept && matchStatus;
    });
  }, [members, searchQuery, selectedDept, selectedStatus]);

  // Paginated Members
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, startIndex, pageSize]);

  // EXPORT EXCEL (Exact 10 Official Headers Compatible with Import)
  const handleExportExcel = () => {
    const exportData = filteredMembers.map(m => ({
      'NIK': String(m.nik || ''),
      'NAMA': m.namaLengkap || '',
      'JENISKELAMIN': m.jenisKelamin || 'Laki-laki',
      'GEDUNG': m.gedung || '-',
      'LOKASI': m.lokasi || '-',
      'DEPARTEMEN': m.departemen || '',
      'TERHITUNG MULAI BEKERJA': m.tanggalBergabung || '',
      'POSISI': m.jabatanKerja || 'OPERATOR',
      'Union': m.unionName || 'SBN-KASBI',
      'ALAMAT': m.alamat || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Force NIK column to string format to preserve leading zero
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: 0 }); // Column 0 is NIK
      if (worksheet[cellRef]) {
        worksheet[cellRef].t = 's'; // string type
        worksheet[cellRef].z = '@';
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Anggota SBN');
    exportWorkbookToExcel(workbook, `Data_Anggota_Resmi_SBN_KASBI_${getLocalDateISO()}.xlsx`);
  };

  // HANDLE FILE UPLOAD FOR EXCEL SYNCHRONIZATION
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);
    setPreviewAnalysis(null);
    setIsProcessingFile(true);

    const fileName = file.name.toLowerCase();

    setTimeout(() => {
      if (fileName.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            analyzeRawImportData(results.data, file.name);
            setIsProcessingFile(false);
          },
          error: (err) => {
            setImportError('Gagal membaca file CSV: ' + err.message);
            setIsProcessingFile(false);
          }
        });
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, raw: false });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd' });
            analyzeRawImportData(data, file.name);
          } catch (err: any) {
            setImportError('Gagal membaca file Excel: ' + (err.message || 'Format file tidak valid'));
          } finally {
            setIsProcessingFile(false);
          }
        };
        reader.onerror = () => {
          setImportError('Gagal membaca file spreadsheet.');
          setIsProcessingFile(false);
        };
        reader.readAsBinaryString(file);
      }
    }, 100);
  };

  // ANALYZE RAW IMPORT DATA & GENERATE PREVIEW ANALYSIS
  const analyzeRawImportData = (rows: any[], fileName: string) => {
    if (!rows || rows.length === 0) {
      setImportError('File Excel/CSV tidak berisi baris data.');
      return;
    }

    // 1. Validate Mandatory Official Headers
    const firstRow = rows[0];
    const rowKeys = Object.keys(firstRow).map(k => k.trim());
    
    const missingHeaders: string[] = [];
    for (const officialHeader of OFFICIAL_HEADERS) {
      const normOfficial = officialHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = rowKeys.some(rk => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === normOfficial);
      if (!found) {
        missingHeaders.push(officialHeader);
      }
    }

    if (missingHeaders.length > 0) {
      setImportError(`Format Header Excel tidak sesuai! Kolom resmi berikut wajib tersedia: ${missingHeaders.join(', ')}. Ditolak untuk menjaga integritas data.`);
      return;
    }

    const batchId = `batch-sync-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const operatorName = currentUser?.name || 'Pengurus SBN';

    const seenNiksInFile = new Set<string>();
    const errorRows: { rowNum: number; nik?: string; nama?: string; reason: string }[] = [];
    
    interface ValidExcelRow {
      rowNum: number;
      nik: string;
      namaLengkap: string;
      jenisKelamin: Gender;
      gedung: string;
      lokasi: string;
      departemen: string;
      tanggalBergabung: string;
      jabatanKerja: string;
      unionName: string;
      alamat: string;
    }

    const validExcelRows: ValidExcelRow[] = [];

    // Helper to get raw cell value
    const getVal = (row: any, headerName: string) => {
      if (row[headerName] !== undefined && row[headerName] !== null) {
        return String(row[headerName]).trim();
      }
      const normHeader = headerName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normHeader);
      if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null) {
        return String(row[matchKey]).trim();
      }
      return '';
    };

    // 2. Process and Validate Rows
    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // Row index in Excel (1-based header is row 1)
      const rawNik = getVal(row, 'NIK');
      const rawNama = getVal(row, 'NAMA');
      const rawGender = getVal(row, 'JENISKELAMIN');
      const rawGedung = getVal(row, 'GEDUNG');
      const rawLokasi = getVal(row, 'LOKASI');
      const rawDept = getVal(row, 'DEPARTEMEN');
      const rawTmk = getVal(row, 'TERHITUNG MULAI BEKERJA');
      const rawPosisi = getVal(row, 'POSISI');
      const rawUnion = getVal(row, 'Union');
      const rawAlamat = getVal(row, 'ALAMAT');

      if (!rawNik) {
        errorRows.push({ rowNum, nama: rawNama, reason: 'NIK Karyawan Kosong' });
        return;
      }

      // NIK Normalization (trim spasi, maintain string)
      const normNik = rawNik.trim();

      if (seenNiksInFile.has(normNik)) {
        errorRows.push({ rowNum, nik: normNik, nama: rawNama, reason: `Duplikat NIK (${normNik}) ditemukan dalam file Excel` });
        return;
      }

      seenNiksInFile.add(normNik);

      if (!rawNama) {
        errorRows.push({ rowNum, nik: normNik, reason: 'NAMA Lengkap Kosong' });
        return;
      }

      // Gender normalization
      const gLower = rawGender.toLowerCase();
      const jenisKelamin: Gender = (gLower.includes('perempuan') || gLower.includes('female') || gLower === 'p' || gLower === 'w') 
        ? 'Perempuan' 
        : 'Laki-laki';

      // Date normalization (DD/MM/YYYY or YYYY-MM-DD)
      let formattedJoinDate = rawTmk;
      if (formattedJoinDate) {
        const parts = formattedJoinDate.split(/[\/\-]/);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            formattedJoinDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else if (parts[0].length === 4) {
            formattedJoinDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        }
      }

      validExcelRows.push({
        rowNum,
        nik: normNik,
        namaLengkap: rawNama,
        jenisKelamin,
        gedung: rawGedung,
        lokasi: rawLokasi,
        departemen: rawDept || 'Assembly',
        tanggalBergabung: formattedJoinDate || getLocalDateISO(),
        jabatanKerja: rawPosisi || 'OPERATOR',
        unionName: rawUnion || 'SBN-KASBI',
        alamat: rawAlamat || '-'
      });
    });

    // 3. Categorize against existing Firestore members database
    const existingMembersByNik = new Map<string, Member>();
    members.forEach(m => {
      if (m.nik && m.nik.trim()) {
        existingMembersByNik.set(m.nik.trim().toLowerCase(), m);
      }
    });

    const excelNiksSet = new Set<string>(validExcelRows.map(r => r.nik.toLowerCase()));

    const newMembers: Member[] = [];
    const updatedMembers: Member[] = [];
    const reactivatedMembers: Member[] = [];
    const setInactiveMembers: Member[] = [];
    const unchangedMembers: Member[] = [];

    validExcelRows.forEach((row, idx) => {
      const normNikLower = row.nik.toLowerCase();
      const existingMbr = existingMembersByNik.get(normNikLower);

      if (!existingMbr) {
        // 🟢 ANGGOTA BARU
        const newMbr: Member = {
          id: row.nik,
          nik: row.nik,
          nomorAnggota: `SBN-VCI-${String(members.length + newMembers.length + 1).padStart(4, '0')}`,
          namaLengkap: row.namaLengkap,
          jenisKelamin: row.jenisKelamin,
          tempatLahir: 'Tangerang',
          tanggalLahir: '',
          alamat: row.alamat,
          nomorHp: '-',
          email: '',
          gedung: row.gedung,
          lokasi: row.lokasi,
          departemen: row.departemen,
          bagian: 'Line',
          jabatanKerja: row.jabatanKerja,
          statusKeanggotaan: 'Aktif',
          tanggalBergabung: row.tanggalBergabung,
          unionName: row.unionName,
          fotoUrl: cheAvatar,
          source: 'management_excel',
          isMissingFromExcel: false,
          isNewFromExcel: true,
          lastImportedAt: nowIso,
          lastImportedBy: operatorName,
          importBatchId: batchId,
          sourceFileName: fileName,
          updatedAt: nowIso,
          updatedBy: operatorName
        };
        newMembers.push(newMbr);
      } else {
        const isCurrentlyInactive = existingMbr.statusKeanggotaan === 'Tidak Aktif' || existingMbr.statusKeanggotaan === 'Non-Aktif' || existingMbr.isMissingFromExcel === true;

        if (isCurrentlyInactive) {
          // 🟡 AKTIF KEMBALI (Reactivated)
          const reactivatedMbr: Member = {
            ...existingMbr,
            nik: row.nik, // Ensure NIK formatting
            namaLengkap: row.namaLengkap,
            jenisKelamin: row.jenisKelamin,
            gedung: row.gedung || existingMbr.gedung,
            lokasi: row.lokasi || existingMbr.lokasi,
            departemen: row.departemen || existingMbr.departemen,
            jabatanKerja: row.jabatanKerja || existingMbr.jabatanKerja,
            tanggalBergabung: row.tanggalBergabung || existingMbr.tanggalBergabung,
            unionName: row.unionName || existingMbr.unionName,
            alamat: row.alamat || existingMbr.alamat,
            statusKeanggotaan: 'Aktif',
            isMissingFromExcel: false,
            isNewFromExcel: false,
            inactiveSince: undefined,
            reactivatedAt: nowIso,
            lastImportedAt: nowIso,
            lastImportedBy: operatorName,
            importBatchId: batchId,
            sourceFileName: fileName,
            updatedAt: nowIso,
            updatedBy: operatorName
          };
          reactivatedMembers.push(reactivatedMbr);
        } else {
          // 🔵 DATA DIPERBARUI or Unchanged
          const isChanged = 
            existingMbr.namaLengkap !== row.namaLengkap ||
            existingMbr.jenisKelamin !== row.jenisKelamin ||
            existingMbr.gedung !== row.gedung ||
            existingMbr.lokasi !== row.lokasi ||
            existingMbr.departemen !== row.departemen ||
            existingMbr.jabatanKerja !== row.jabatanKerja ||
            existingMbr.tanggalBergabung !== row.tanggalBergabung ||
            existingMbr.unionName !== row.unionName ||
            existingMbr.alamat !== row.alamat;

          const updatedMbr: Member = {
            ...existingMbr,
            nik: row.nik,
            namaLengkap: row.namaLengkap,
            jenisKelamin: row.jenisKelamin,
            gedung: row.gedung || existingMbr.gedung,
            lokasi: row.lokasi || existingMbr.lokasi,
            departemen: row.departemen || existingMbr.departemen,
            jabatanKerja: row.jabatanKerja || existingMbr.jabatanKerja,
            tanggalBergabung: row.tanggalBergabung || existingMbr.tanggalBergabung,
            unionName: row.unionName || existingMbr.unionName,
            alamat: row.alamat || existingMbr.alamat,
            statusKeanggotaan: 'Aktif',
            isMissingFromExcel: false,
            isNewFromExcel: false,
            lastImportedAt: nowIso,
            lastImportedBy: operatorName,
            importBatchId: batchId,
            sourceFileName: fileName,
            updatedAt: nowIso,
            updatedBy: operatorName
          };

          if (isChanged) {
            updatedMembers.push(updatedMbr);
          } else {
            unchangedMembers.push(updatedMbr);
          }
        }
      }
    });

    // 🔴 MENJADI TIDAK AKTIF (Members in Firestore but missing in Excel)
    members.forEach(m => {
      const normNikLower = (m.nik || '').toLowerCase().trim();
      if (!excelNiksSet.has(normNikLower)) {
        const isAlreadyInactive = m.statusKeanggotaan === 'Tidak Aktif' || m.statusKeanggotaan === 'Non-Aktif' || m.isMissingFromExcel === true;
        if (!isAlreadyInactive) {
          const inactiveMbr: Member = {
            ...m,
            statusKeanggotaan: 'Tidak Aktif',
            isMissingFromExcel: true,
            isNewFromExcel: false,
            inactiveSince: nowIso,
            lastImportBatchId: batchId,
            lastImportedAt: nowIso,
            updatedAt: nowIso,
            updatedBy: operatorName
          };
          setInactiveMembers.push(inactiveMbr);
        } else {
          unchangedMembers.push(m);
        }
      }
    });

    // Final consolidated members array for Firestore write
    const finalMembersList: Member[] = [
      ...newMembers,
      ...updatedMembers,
      ...reactivatedMembers,
      ...setInactiveMembers,
      ...unchangedMembers
    ];

    setPreviewAnalysis({
      batchId,
      totalRowsInFile: rows.length,
      newMembers,
      updatedMembers,
      reactivatedMembers,
      setInactiveMembers,
      errorRows,
      finalMembersList
    });

    setPreviewTab('summary');
    setPreviewPage(1);
  };

  // EXECUTE SYNCHRONIZATION AFTER USER CONFIRMS IN PREVIEW
  const handleConfirmSync = async () => {
    if (!previewAnalysis) return;

    setIsSavingSync(true);

    try {
      // 1. Save consolidated members list to Firestore
      await onImportMembers(previewAnalysis.finalMembersList);

      const nowIso = new Date().toISOString();
      const operatorName = currentUser?.name || 'Pengurus SBN';

      // 2. Record import history in Firestore
      await saveFirestoreDoc('importHistory', {
        id: previewAnalysis.batchId,
        importBatchId: previewAnalysis.batchId,
        timestamp: nowIso,
        importedAt: nowIso,
        importedBy: operatorName,
        fileName: importFileName,
        sourceFileName: importFileName,
        totalRows: previewAnalysis.totalRowsInFile,
        newMembers: previewAnalysis.newMembers.length,
        updatedMembers: previewAnalysis.updatedMembers.length,
        inactiveMembers: previewAnalysis.setInactiveMembers.length,
        reactivatedMembers: previewAnalysis.reactivatedMembers.length,
        errors: previewAnalysis.errorRows.length,
        status: 'Sukses'
      });

      // 3. Set Popup Result Notification
      setImportPopupResult({
        addedCount: previewAnalysis.newMembers.length,
        updatedCount: previewAnalysis.updatedMembers.length,
        missingCount: previewAnalysis.setInactiveMembers.length,
        reactivatedCount: previewAnalysis.reactivatedMembers.length,
        errorCount: previewAnalysis.errorRows.length
      });

      setIsImportModalOpen(false);
      setPreviewAnalysis(null);
      setImportFileName('');
    } catch (err: any) {
      console.error('Sync execution error:', err);
      setImportError('Gagal melakukan sinkronisasi ke Firestore: ' + (err.message || 'Kesalahan jaringan'));
    } finally {
      setIsSavingSync(false);
    }
  };

  // CONFIRM DELETE MEMBER WITH AUDIT TRAIL
  const handleConfirmDeleteWithAudit = () => {
    if (!memberToDelete) return;

    if (!deleteNotesManual.trim()) {
      setDeleteError('Wajib mengisi Keterangan / Catatan Detail Manual untuk riwayat audit organisasi!');
      return;
    }

    const auditRecord: DeletedMemberAudit = {
      id: `del-audit-${Date.now()}`,
      memberId: memberToDelete.id,
      nomorAnggota: memberToDelete.nomorAnggota,
      nik: memberToDelete.nik,
      namaLengkap: memberToDelete.namaLengkap,
      departemen: memberToDelete.departemen,
      bagian: memberToDelete.bagian,
      alasanPenghapusan: deleteReason,
      keteranganDetail: deleteNotesManual.trim(),
      deletedBy: `${currentUser.name} (${currentUser.role})`,
      deletedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    };

    const updatedAudits = [auditRecord, ...deletedAudits];
    setDeletedAudits(updatedAudits);

    // Save deletion log permanently to Firestore auditLogs collection
    const detailMsg = `Hapus Anggota: ${memberToDelete.namaLengkap} (${memberToDelete.nik}) | Dept: ${memberToDelete.departemen} | Alasan: ${deleteReason} | Detail: ${deleteNotesManual.trim()}`;
    AuditService.createLog(currentUser.name, currentUser.role, 'Data Anggota', 'Hapus Anggota', detailMsg, auditRecord).catch(err => {
      console.warn('Gagal menyimpan audit log hapus anggota ke Firestore:', err);
    });

    // Execute member deletion
    onDeleteMember(memberToDelete.id);

    setMemberToDelete(null);
    setDeleteNotesManual('');
    setDeleteError(null);
  };

  // Add / Edit Member Form State
  const [formData, setFormData] = useState<Partial<Member>>({
    nomorAnggota: '',
    nik: '',
    namaLengkap: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Tangerang',
    tanggalLahir: '1995-01-01',
    alamat: '',
    nomorHp: '',
    email: '',
    departemen: 'Assembly',
    bagian: '',
    jabatanKerja: 'Operator',
    statusKeanggotaan: 'Aktif',
    tanggalBergabung: getLocalDateISO(),
    fotoUrl: cheAvatar
  });

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      nomorAnggota: `SBN-VCI-${String(members.length + 1).padStart(4, '0')}`,
      nik: `VCI-${Math.floor(10000 + Math.random() * 90000)}`,
      namaLengkap: '',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Tangerang',
      tanggalLahir: '',
      alamat: 'Jl. Raya Serang Cikupa, Kabupaten Tangerang',
      nomorHp: '-',
      email: '',
      departemen: departmentsList[0] || 'Assembly',
      bagian: 'Line 01',
      jabatanKerja: 'OPERATOR',
      statusKeanggotaan: 'Aktif',
      tanggalBergabung: getLocalDateISO(),
      fotoUrl: cheAvatar
    });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({ ...member });
    setIsAddEditModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap || !formData.nik) {
      alert('Nama Lengkap dan NIK wajib diisi!');
      return;
    }

    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        ...formData,
        updatedAt: new Date().toISOString()
      } as Member);
    } else {
      const newMbr: Member = {
        id: formData.nik || `mbr-${Date.now()}`,
        nomorAnggota: formData.nomorAnggota || `SBN-VCI-${Math.floor(1000 + Math.random() * 9000)}`,
        nik: formData.nik || `VCI-0000`,
        namaLengkap: formData.namaLengkap || 'Nama',
        jenisKelamin: (formData.jenisKelamin as Gender) || 'Laki-laki',
        tempatLahir: formData.tempatLahir || 'Tangerang',
        tanggalLahir: formData.tanggalLahir || '',
        alamat: formData.alamat || '-',
        nomorHp: formData.nomorHp || '-',
        email: formData.email || '',
        departemen: formData.departemen || 'Assembly',
        bagian: formData.bagian || 'Line',
        jabatanKerja: formData.jabatanKerja || 'OPERATOR',
        statusKeanggotaan: (formData.statusKeanggotaan as MemberStatus) || 'Aktif',
        tanggalBergabung: formData.tanggalBergabung || getLocalDateISO(),
        fotoUrl: formData.fotoUrl || cheAvatar
      };
      onAddMember(newMbr);
    }

    setIsAddEditModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Title Section */}
      <SectionHeader
        icon={Users}
        title="Data Anggota SBN KASBI"
        description={`Pusat Informasi & Database Anggota PT Victory Chingluh Indonesia (${members.length} Terdaftar)`}
        badge="Realtime Sync ⚡"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton
              icon={FileSpreadsheet}
              onClick={() => setIsAuditModalOpen(true)}
              size="sm"
            >
              Audit ({deletedAudits.length})
            </SecondaryButton>
            <SecondaryButton
              icon={Upload}
              onClick={() => {
                setImportError(null);
                setPreviewAnalysis(null);
                setImportFileName('');
                setIsImportModalOpen(true);
              }}
              size="sm"
            >
              Sinkronkan Excel
            </SecondaryButton>
            <SecondaryButton
              icon={Download}
              onClick={handleExportExcel}
              size="sm"
            >
              Export
            </SecondaryButton>
            <PrimaryButton
              icon={Plus}
              onClick={openAddModal}
              size="sm"
            >
              Tambah Anggota
            </PrimaryButton>
          </div>
        }
      />

      {/* STATS CARDS SUMMARY (Requirement 16) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Anggota</p>
            <p className="text-2xl font-black text-white font-mono mt-0.5">{members.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">Terdaftar di Firestore</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Anggota Aktif</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{activeCount}</p>
            <p className="text-[10px] text-emerald-400/80 mt-1">Sesuai Excel Manajemen</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Tidak Aktif</p>
            <p className="text-2xl font-black text-rose-400 font-mono mt-0.5">{inactiveCount}</p>
            <p className="text-[10px] text-rose-400/80 mt-1">Hilang dari Excel / Resign</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-950 border border-rose-800/60 text-rose-400">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar & Multi Filter Toolbar (Requirement 6) */}
      <div className="bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama, NIK, No. Anggota, Dept..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Dept Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Departemen</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500 text-xs"
            >
              <option value="All">Semua Departemen ({departmentsList.length})</option>
              {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Status Keanggotaan Filter (Requirement 6) */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Filter Status Keanggotaan</label>
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setSelectedStatus('All')}
                className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-md transition-colors ${
                  selectedStatus === 'All' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SEMUA
              </button>
              <button
                onClick={() => setSelectedStatus('Aktif')}
                className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-md transition-colors ${
                  selectedStatus === 'Aktif' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                AKTIF
              </button>
              <button
                onClick={() => setSelectedStatus('Tidak Aktif')}
                className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-md transition-colors ${
                  selectedStatus === 'Tidak Aktif' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                TIDAK AKTIF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table View */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Menampilkan <strong className="text-white">{filteredMembers.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, filteredMembers.length)}</strong> dari <strong className="text-white">{filteredMembers.length}</strong> Anggota (Total: {members.length})
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value={15}>15 Per Halaman</option>
              <option value={25}>25 Per Halaman</option>
              <option value={50}>50 Per Halaman</option>
              <option value={100}>100 Per Halaman</option>
              <option value={250}>250 Per Halaman</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Anggota</th>
                <th className="p-3.5">NIK (Resmi Excel)</th>
                <th className="p-3.5">Departemen & Bagian</th>
                <th className="p-3.5">TMK (Terhitung Mulai Kerja)</th>
                <th className="p-3.5">Status Keanggotaan</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    Tidak ditemukan data anggota yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((mbr) => {
                  const isMissing = mbr.isMissingFromExcel || mbr.statusKeanggotaan === 'Tidak Aktif' || mbr.statusKeanggotaan === 'Non-Aktif';
                  const isNew = mbr.isNewFromExcel;

                  return (
                    <tr 
                      key={mbr.id} 
                      className={`transition-colors ${
                        isMissing 
                          ? 'bg-rose-950/30 hover:bg-rose-900/40 border-l-4 border-l-rose-600 font-bold' 
                          : isNew 
                            ? 'bg-emerald-950/20 hover:bg-emerald-900/30 border-l-4 border-l-emerald-500' 
                            : 'hover:bg-slate-850/60'
                      }`}
                    >
                      
                      {/* Member Info (Requirement 6: Red & bold for inactive) */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold shrink-0 ${
                            isMissing ? 'bg-rose-950 border-rose-700 text-rose-300' : 'bg-slate-800 border-slate-700 text-red-400'
                          }`}>
                            {mbr.namaLengkap ? mbr.namaLengkap.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className={`text-sm ${isMissing ? 'font-black text-rose-400 uppercase tracking-wide' : 'font-bold text-slate-100'}`}>
                                {mbr.namaLengkap}
                              </p>
                              {isNew && (
                                <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-600 text-white rounded uppercase shadow">
                                  ✨ Anggota Baru
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] ${isMissing ? 'text-rose-300 font-bold' : 'text-slate-400'}`}>
                              {mbr.jabatanKerja} {mbr.nomorHp && mbr.nomorHp !== '-' ? `• ${mbr.nomorHp}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* NIK (Data dari Excel) */}
                      <td className="p-3.5 font-mono">
                        <p className={`font-black text-sm ${isMissing ? 'text-rose-400' : 'text-emerald-400'}`}>
                          NIK: {mbr.nik}
                        </p>
                      </td>

                      {/* Dept & Section */}
                      <td className="p-3.5">
                        <p className={`font-bold max-w-xs truncate ${isMissing ? 'text-rose-200' : 'text-slate-200'}`} title={mbr.departemen}>
                          {mbr.departemen}
                        </p>
                        <p className={`text-[11px] ${isMissing ? 'text-rose-300' : 'text-slate-400'}`}>{mbr.bagian || '-'}</p>
                      </td>

                      {/* TMK (Terhitung Mulai Kerja) */}
                      <td className="p-3.5 font-mono">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          isMissing 
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800' 
                            : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                        }`}>
                          {mbr.tanggalBergabung || '-'}
                        </span>
                      </td>

                      {/* Membership status badge (Requirement 6: 🔴 TIDAK AKTIF badge) */}
                      <td className="p-3.5">
                        {isMissing ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1 w-fit shadow">
                            <UserX className="w-3 h-3 text-rose-500" />
                            🔴 TIDAK AKTIF
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit shadow">
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            🟢 AKTIF
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedMember(mbr);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Lihat Detail Biodata"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(mbr)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors cursor-pointer"
                            title="Edit Data"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setMemberToDelete(mbr)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950">
            <span>Halaman {currentPage} dari {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                Sebelumnya
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BIODATA DETAIL MODAL (Requirement 9) */}
      {isDetailModalOpen && selectedMember && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-4 sm:p-6 shadow-2xl relative max-w-2xl">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-slate-800">
              <div className="relative group">
                <img
                  src={selectedMember.fotoUrl || cheAvatar}
                  alt={selectedMember.namaLengkap}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                />
                <button 
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer p-1 text-center"
                  onClick={() => setIsCameraModalOpen(true)}
                >
                  <Camera className="w-5 h-5 text-red-400 mb-0.5" />
                  <span>Ubah Foto</span>
                </button>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 text-xs font-mono font-black bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded-lg shadow-sm">
                    NIK (Resmi Excel): {selectedMember.nik}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{selectedMember.namaLengkap}</h2>
                <p className="text-xs text-slate-300 font-semibold">{selectedMember.jabatanKerja} • {selectedMember.departemen} ({selectedMember.bagian || 'Line'})</p>
                
                <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start text-[11px]">
                  <span className={`px-2.5 py-0.5 rounded-full border font-bold ${
                    selectedMember.statusKeanggotaan === 'Aktif' && !selectedMember.isMissingFromExcel 
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}>
                    Status: {selectedMember.statusKeanggotaan === 'Aktif' && !selectedMember.isMissingFromExcel ? '🟢 AKTIF' : '🔴 TIDAK AKTIF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Biodata grid details */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Jenis Kelamin</p>
                <p className="font-bold text-slate-200">{selectedMember.jenisKelamin}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Serikat / Union</p>
                <p className="font-bold text-slate-200">{selectedMember.unionName || 'SBN-KASBI'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Nomor Handphone / WhatsApp</p>
                <p className="font-bold text-slate-200">{selectedMember.nomorHp || '-'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">TMK (Terhitung Mulai Kerja)</p>
                <p className="font-bold text-amber-300 font-mono">{selectedMember.tanggalBergabung || '-'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Gedung / Lokasi</p>
                <p className="font-bold text-slate-200">{selectedMember.gedung || '-'} {selectedMember.lokasi ? `/ ${selectedMember.lokasi}` : ''}</p>
              </div>

              <div className="md:col-span-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Email</p>
                <p className="font-bold text-slate-200">{selectedMember.email || '-'}</p>
              </div>

              <div className="md:col-span-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Alamat Kediaman</p>
                <p className="font-bold text-slate-200 leading-relaxed">{selectedMember.alamat || '-'}</p>
              </div>

              <div className="md:col-span-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Perusahaan Tempat Kerja</p>
                <p className="font-bold text-red-400">PT Victory Chingluh Indonesia</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end items-center">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup Biodata
              </button>
            </div>

          </div>
        </div>
        </ModalPortal>
      )}

      {/* SINKRONISASI EXCEL PREVIEW MODAL (Requirement 3, 10, 11) */}
      {isImportModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-4 sm:p-6 shadow-2xl relative max-w-4xl">
            <button
              onClick={() => {
                if (!isSavingSync) {
                  setIsImportModalOpen(false);
                  setPreviewAnalysis(null);
                }
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Sinkronisasi Data Excel Manajemen</h2>
                <p className="text-xs text-slate-400">Upload file Excel resmi (.xlsx/.xls) atau CSV dari Manajemen PT VCI. NIK digunakan sebagai kunci utama.</p>
              </div>
            </div>

            {/* File Upload Dropzone */}
            <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center space-y-3 mb-4">
              {isProcessingFile ? (
                <div className="py-4 flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs text-emerald-400 font-semibold">Memvalidasi header dan menganalisis baris Excel...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Pilih file Excel resmi (10 Kolom) dari komputer Anda</p>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  />
                  {importFileName && <p className="text-xs text-emerald-400 font-bold">Terpilih: {importFileName}</p>}
                </>
              )}
            </div>

            {importError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2 mb-4">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-200">Gagal Memproses File Excel</p>
                  <p className="text-xs text-rose-300 mt-0.5">{importError}</p>
                </div>
              </div>
            )}

            {/* PREVIEW ANALYSIS REPORT (Requirement 10) */}
            {previewAnalysis && (
              <div className="space-y-4">
                
                {/* 5-Category Summary Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                    <p className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      Anggota Baru
                    </p>
                    <p className="text-xl font-black font-mono text-emerald-300 mt-1">{previewAnalysis.newMembers.length}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-300">
                    <p className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Diperbarui
                    </p>
                    <p className="text-xl font-black font-mono text-blue-300 mt-1">{previewAnalysis.updatedMembers.length}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300">
                    <p className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                      <UserMinus className="w-3.5 h-3.5" />
                      Tidak Aktif
                    </p>
                    <p className="text-xl font-black font-mono text-rose-300 mt-1">{previewAnalysis.setInactiveMembers.length}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-300">
                    <p className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Aktif Kembali
                    </p>
                    <p className="text-xl font-black font-mono text-amber-300 mt-1">{previewAnalysis.reactivatedMembers.length}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Error Baris
                    </p>
                    <p className="text-xl font-black font-mono text-slate-200 mt-1">{previewAnalysis.errorRows.length}</p>
                  </div>
                </div>

                {/* Preview Tabs */}
                <div className="flex border-b border-slate-800 overflow-x-auto text-xs font-bold text-slate-400">
                  <button
                    onClick={() => { setPreviewTab('summary'); setPreviewPage(1); }}
                    className={`py-2 px-3 border-b-2 whitespace-nowrap cursor-pointer ${
                      previewTab === 'summary' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
                    }`}
                  >
                    🟢 Anggota Baru ({previewAnalysis.newMembers.length})
                  </button>
                  <button
                    onClick={() => { setPreviewTab('updated'); setPreviewPage(1); }}
                    className={`py-2 px-3 border-b-2 whitespace-nowrap cursor-pointer ${
                      previewTab === 'updated' ? 'border-blue-500 text-blue-400' : 'border-transparent hover:text-slate-200'
                    }`}
                  >
                    🔵 Diperbarui ({previewAnalysis.updatedMembers.length})
                  </button>
                  <button
                    onClick={() => { setPreviewTab('inactive'); setPreviewPage(1); }}
                    className={`py-2 px-3 border-b-2 whitespace-nowrap cursor-pointer ${
                      previewTab === 'inactive' ? 'border-rose-500 text-rose-400' : 'border-transparent hover:text-slate-200'
                    }`}
                  >
                    🔴 Menjadi Tidak Aktif ({previewAnalysis.setInactiveMembers.length})
                  </button>
                  <button
                    onClick={() => { setPreviewTab('reactivated'); setPreviewPage(1); }}
                    className={`py-2 px-3 border-b-2 whitespace-nowrap cursor-pointer ${
                      previewTab === 'reactivated' ? 'border-amber-500 text-amber-400' : 'border-transparent hover:text-slate-200'
                    }`}
                  >
                    🟡 Aktif Kembali ({previewAnalysis.reactivatedMembers.length})
                  </button>
                  {previewAnalysis.errorRows.length > 0 && (
                    <button
                      onClick={() => { setPreviewTab('error'); setPreviewPage(1); }}
                      className={`py-2 px-3 border-b-2 whitespace-nowrap cursor-pointer ${
                        previewTab === 'error' ? 'border-rose-600 text-rose-500' : 'border-transparent hover:text-slate-200'
                      }`}
                    >
                      ⚠️ Error ({previewAnalysis.errorRows.length})
                    </button>
                  )}
                </div>

                {/* Preview Table Content */}
                <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 sticky top-0 text-[10px] text-slate-400 uppercase">
                      <tr>
                        <th className="p-2">NIK</th>
                        <th className="p-2">Nama Lengkap</th>
                        <th className="p-2">Departemen</th>
                        <th className="p-2">Posisi / Jabatan</th>
                        <th className="p-2">TMK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {previewTab === 'summary' && (
                        previewAnalysis.newMembers.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Tidak ada anggota baru.</td></tr>
                        ) : (
                          previewAnalysis.newMembers.slice((previewPage - 1) * 15, previewPage * 15).map((row) => (
                            <tr key={row.id} className="hover:bg-slate-900/60 text-emerald-300 font-semibold">
                              <td className="p-2 font-mono">{row.nik}</td>
                              <td className="p-2 font-bold">{row.namaLengkap}</td>
                              <td className="p-2">{row.departemen}</td>
                              <td className="p-2">{row.jabatanKerja}</td>
                              <td className="p-2 font-mono text-amber-300">{row.tanggalBergabung}</td>
                            </tr>
                          ))
                        )
                      )}

                      {previewTab === 'updated' && (
                        previewAnalysis.updatedMembers.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Tidak ada perubahan data anggota.</td></tr>
                        ) : (
                          previewAnalysis.updatedMembers.slice((previewPage - 1) * 15, previewPage * 15).map((row) => (
                            <tr key={row.id} className="hover:bg-slate-900/60 text-blue-300">
                              <td className="p-2 font-mono">{row.nik}</td>
                              <td className="p-2 font-bold">{row.namaLengkap}</td>
                              <td className="p-2">{row.departemen}</td>
                              <td className="p-2">{row.jabatanKerja}</td>
                              <td className="p-2 font-mono">{row.tanggalBergabung}</td>
                            </tr>
                          ))
                        )
                      )}

                      {previewTab === 'inactive' && (
                        previewAnalysis.setInactiveMembers.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Tidak ada anggota yang menjadi tidak aktif.</td></tr>
                        ) : (
                          previewAnalysis.setInactiveMembers.slice((previewPage - 1) * 15, previewPage * 15).map((row) => (
                            <tr key={row.id} className="hover:bg-slate-900/60 text-rose-400 font-bold bg-rose-950/20">
                              <td className="p-2 font-mono">{row.nik}</td>
                              <td className="p-2 font-bold">{row.namaLengkap}</td>
                              <td className="p-2">{row.departemen}</td>
                              <td className="p-2">{row.jabatanKerja}</td>
                              <td className="p-2 text-rose-300">🔴 HILANG DI EXCEL BARU</td>
                            </tr>
                          ))
                        )
                      )}

                      {previewTab === 'reactivated' && (
                        previewAnalysis.reactivatedMembers.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Tidak ada anggota aktif kembali.</td></tr>
                        ) : (
                          previewAnalysis.reactivatedMembers.slice((previewPage - 1) * 15, previewPage * 15).map((row) => (
                            <tr key={row.id} className="hover:bg-slate-900/60 text-amber-300 font-bold">
                              <td className="p-2 font-mono">{row.nik}</td>
                              <td className="p-2 font-bold">{row.namaLengkap}</td>
                              <td className="p-2">{row.departemen}</td>
                              <td className="p-2">{row.jabatanKerja}</td>
                              <td className="p-2 text-amber-400">🟡 AKTIF KEMBALI</td>
                            </tr>
                          ))
                        )
                      )}

                      {previewTab === 'error' && (
                        previewAnalysis.errorRows.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Tidak ada error baris.</td></tr>
                        ) : (
                          previewAnalysis.errorRows.slice((previewPage - 1) * 15, previewPage * 15).map((errRow, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/60 text-rose-400 font-semibold">
                              <td className="p-2 font-mono">Baris {errRow.rowNum}</td>
                              <td className="p-2 font-bold">{errRow.nama || '-'}</td>
                              <td colSpan={3} className="p-2 text-rose-300">{errRow.reason}</td>
                            </tr>
                          ))
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Prinsip Sinkronisasi Manajemen Excel</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Data internal serikat (foto, No. HP, email, catatan) <strong>TIDAK HAKUS / DIHAPUS</strong>. Anggota hilang dari Excel akan otomatis diubah status menjadi <strong>🔴 Tidak Aktif</strong> tanpa menghapus dokumen Firestore.
                  </p>
                </div>

              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end space-x-2">
              <button
                disabled={isSavingSync}
                onClick={() => {
                  setIsImportModalOpen(false);
                  setPreviewAnalysis(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                disabled={!previewAnalysis || isSavingSync}
                onClick={handleConfirmSync}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
                  previewAnalysis && !isSavingSync
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSavingSync ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Memproses Batch Write Firestore...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    KONFIRMASI SINKRONISASI ({previewAnalysis?.finalMembersList.length || 0} Data)
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
        </ModalPortal>
      )}

      {/* ADD / EDIT MEMBER FORM MODAL */}
      {isAddEditModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white shadow-2xl relative max-w-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {editingMember ? 'Edit Data Anggota SBN' : 'Tambah Anggota Baru SBN'}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="member-form" onSubmit={handleSaveMember} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nomor Anggota SBN</label>
                  <input
                    type="text"
                    value={formData.nomorAnggota || ''}
                    onChange={(e) => setFormData({ ...formData, nomorAnggota: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                    placeholder="SBN-VCI-0001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">NIK Karyawan PT VCI</label>
                  <input
                    type="text"
                    value={formData.nik || ''}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                    placeholder="VCI-12345"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.namaLengkap || ''}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                    placeholder="Nama Lengkap Anggota"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin || 'Laki-laki'}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as Gender })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nomor Handphone / WA</label>
                  <input
                    type="text"
                    value={formData.nomorHp || ''}
                    onChange={(e) => setFormData({ ...formData, nomorHp: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="08123456789"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Departemen</label>
                  <select
                    value={formData.departemen || 'Assembly'}
                    onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Bagian / Section / Line</label>
                  <input
                    type="text"
                    value={formData.bagian || ''}
                    onChange={(e) => setFormData({ ...formData, bagian: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="Line 04 / Stitching"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Jabatan Kerja</label>
                  <input
                    type="text"
                    value={formData.jabatanKerja || ''}
                    onChange={(e) => setFormData({ ...formData, jabatanKerja: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="Operator / Inspector / Leader"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">TMK (Terhitung Mulai Kerja)</label>
                  <input
                    type="date"
                    value={formData.tanggalBergabung || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalBergabung: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status Keanggotaan</label>
                  <select
                    value={formData.statusKeanggotaan || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, statusKeanggotaan: e.target.value as MemberStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Gedung</label>
                  <input
                    type="text"
                    value={formData.gedung || ''}
                    onChange={(e) => setFormData({ ...formData, gedung: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="Contoh: N1-N4"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Lokasi</label>
                  <input
                    type="text"
                    value={formData.lokasi || ''}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="Contoh: JV / JVB"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Serikat / Union</label>
                  <input
                    type="text"
                    value={formData.unionName || 'SBN-KASBI'}
                    onChange={(e) => setFormData({ ...formData, unionName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Alamat Kediaman</label>
                  <textarea
                    rows={2}
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="Alamat lengkap..."
                  />
                </div>

              </div>

              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-2 shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
                </button>
              </div>
            </form>

          </div>
        </div>
        </ModalPortal>
      )}

      {/* DELETION WITH AUDIT TRAIL MODAL */}
      {memberToDelete && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-rose-800/80 text-white p-6 shadow-2xl relative max-w-lg animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setMemberToDelete(null);
                setDeleteError(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Peringatan Penghapusan Anggota</h3>
                <p className="text-xs text-rose-400 font-bold">Wajib Mengisi Alasan & Keterangan untuk Audit Organisasi</p>
              </div>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Anggota Yang Akan Dihapus:</p>
                <p className="text-sm font-black text-white">{memberToDelete.namaLengkap}</p>
                <p className="text-xs text-slate-300 font-mono">No. KTA: <span className="text-red-400">{memberToDelete.nomorAnggota}</span> | NIK: {memberToDelete.nik}</p>
                <p className="text-xs text-slate-400">{memberToDelete.departemen} - {memberToDelete.bagian || '-'}</p>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {deleteError}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1.5">
                  1. Pilih Alasan Utama Penghapusan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Mengundurkan Diri / Resign">Mengundurkan Diri / Resign dari Perusahaan</option>
                  <option value="Keluar Keanggotaan Serikat">Keluar Keanggotaan Serikat SBN</option>
                  <option value="Pemutusan Hubungan Kerja (PHK)">Pemutusan Hubungan Kerja (PHK)</option>
                  <option value="Pensiun">Pensiun / Habis Kontrak</option>
                  <option value="Meninggal Dunia">Meninggal Dunia</option>
                  <option value="Mogok Kerja / Sanksi Organisasi">Sanksi Organisasi / Pelanggaran AD/ART</option>
                  <option value="Mutasi / Pindah Pabrik">Mutasi / Pindah Pabrik</option>
                  <option value="Lainnya">Lainnya (Tulis Manual di Catatan Detail)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1.5">
                  2. Keterangan / Catatan Detail Manual (Untuk Riwayat Audit) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={deleteNotesManual}
                  onChange={(e) => {
                    setDeleteNotesManual(e.target.value);
                    if (e.target.value.trim()) setDeleteError(null);
                  }}
                  placeholder="Tuliskan keterangan rinci contoh: Resign per tanggal 15 Agustus 2026 berdasarkan SK HRD No. 12/HRD/2026..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                <p><strong>Dihapus Oleh:</strong> {currentUser.name} ({currentUser.role})</p>
                <p><strong>Waktu Pencatatan Audit:</strong> {new Date().toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMemberToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWithAudit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/40"
              >
                <Trash2 className="w-4 h-4" />
                Konfirmasi & Simpan Log Audit
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* AUDIT LOG HISTORY MODAL */}
      {isAuditModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-3xl">
            <button
              onClick={() => setIsAuditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Riwayat Audit Penghapusan Anggota</h3>
                <p className="text-xs text-slate-400">Laporan pertanggungjawaban data anggota yang telah dihapus ({deletedAudits.length} Catatan Log)</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {deletedAudits.length === 0 ? (
                <div className="p-12 text-center text-slate-500 italic space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Belum ada riwayat penghapusan anggota yang tercatat dalam audit.</p>
                </div>
              ) : (
                deletedAudits.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div>
                        <span className="text-sm font-black text-rose-400">{item.namaLengkap}</span>
                        <span className="ml-2 font-mono text-xs text-slate-400">No. KTA: {item.nomorAnggota} | NIK: {item.nik}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {item.deletedAt}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Alasan Utama:</p>
                        <p className="font-bold text-slate-200">{item.alasanPenghapusan}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Petugas / Operator:</p>
                        <p className="font-semibold text-slate-300">{item.deletedBy}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Keterangan / Catatan Detail Manual:</p>
                      <p className="text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 font-sans italic">
                        "{item.keteranganDetail}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Total Dihapus: <strong>{deletedAudits.length} Data</strong></span>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* IMPORT NOTIFICATION RESULT POPUP */}
      {importPopupResult && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-emerald-800/80 text-white p-6 shadow-2xl relative max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-center text-white mb-1">
              Sinkronisasi Excel Manajemen Selesai
            </h3>
            <p className="text-xs text-center text-slate-400 mb-6">
              Data dari file Excel resmi manajemen telah diproses dan disinkronkan ke Firestore.
            </p>

            <div className="space-y-2.5 mb-6 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-between">
                <span className="font-bold text-emerald-300">🟢 Anggota Baru:</span>
                <span className="font-black text-emerald-400 font-mono text-sm">{importPopupResult.addedCount} Data</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-between">
                <span className="font-bold text-blue-300">🔵 Data Diperbarui:</span>
                <span className="font-black text-blue-400 font-mono text-sm">{importPopupResult.updatedCount} Data</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-between">
                <span className="font-bold text-rose-300">🔴 Menjadi Tidak Aktif:</span>
                <span className="font-black text-rose-400 font-mono text-sm">{importPopupResult.missingCount} Data</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-between">
                <span className="font-bold text-amber-300">🟡 Aktif Kembali:</span>
                <span className="font-black text-amber-400 font-mono text-sm">{importPopupResult.reactivatedCount} Data</span>
              </div>

              {importPopupResult.errorCount > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-400">⚠️ Error Baris:</span>
                  <span className="font-black text-slate-300 font-mono text-sm">{importPopupResult.errorCount} Data</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 italic text-center mb-6 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              * Anggota yang tidak ada di Excel resmi secara otomatis diubah status menjadi 🔴 Tidak Aktif tanpa menghapus histori data.
            </p>

            <button
              onClick={() => setImportPopupResult(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
            >
              Mengerti & Lihat Database Anggota
            </button>
          </div>
        </div>
        </ModalPortal>
      )}

      {isCameraModalOpen && selectedMember && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={(base64) => {
            const updated = { ...selectedMember, fotoUrl: base64 };
            setSelectedMember(updated);
            onUpdateMember(updated);
          }}
          title="Ubah Foto Profil"
          facingModeDefault="user"
        />
      )}

    </div>
  );
};
