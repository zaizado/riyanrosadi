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
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Camera
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Member, Gender, EmploymentStatus, MemberStatus, ShiftType, UserAccount, DeletedMemberAudit } from '../types';
import { ConfirmModal } from './ConfirmModal';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { compressImage } from '../lib/imageUtils';

interface MembersModuleProps {
  members: Member[];
  onAddMember: (newMember: Member) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onImportMembers: (importedMembers: Member[]) => void;
  onOpenCardModal?: (member: Member) => void;
  currentUser: UserAccount;
}

export const MembersModule: React.FC<MembersModuleProps> = ({
  members,
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
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedStatusKerja, setSelectedStatusKerja] = useState<string>('All');
  const [selectedShift, setSelectedShift] = useState<string>('All');

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
  const [deletedAudits, setDeletedAudits] = useState<DeletedMemberAudit[]>(() => {
    try {
      const saved = localStorage.getItem('sbn_vci_deleted_member_audits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Excel / CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<Partial<Member>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importPage, setImportPage] = useState<number>(1);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  // Import Notification Popup Result
  const [importPopupResult, setImportPopupResult] = useState<{
    addedCount: number;
    missingCount: number;
    unchangedCount: number;
  } | null>(null);

  // Dynamic Departments list for dropdowns
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedStatus, selectedStatusKerja, selectedShift, pageSize]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchSearch = !query || 
        m.namaLengkap.toLowerCase().includes(query) ||
        m.nik.toLowerCase().includes(query) ||
        m.nomorAnggota.toLowerCase().includes(query) ||
        m.bagian.toLowerCase().includes(query) ||
        m.departemen.toLowerCase().includes(query) ||
        m.nomorHp.includes(query);

      const matchDept = selectedDept === 'All' || m.departemen === selectedDept;
      const matchStatus = selectedStatus === 'All' || m.statusKeanggotaan === selectedStatus;
      const matchStatusKerja = selectedStatusKerja === 'All' || m.statusKerja === selectedStatusKerja;
      const matchShift = selectedShift === 'All' || m.shift === selectedShift;

      return matchSearch && matchDept && matchStatus && matchStatusKerja && matchShift;
    });
  }, [members, searchQuery, selectedDept, selectedStatus, selectedStatusKerja, selectedShift]);

  // Paginated Members
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, startIndex, pageSize]);

  // Export to Excel XLSX
  const handleExportExcel = () => {
    const exportData = filteredMembers.map(m => ({
      'Nomor Anggota': m.nomorAnggota,
      'NIK': m.nik,
      'Nama Lengkap': m.namaLengkap,
      'Jenis Kelamin': m.jenisKelamin,
      'Tempat Lahir': m.tempatLahir,
      'Tanggal Lahir': m.tanggalLahir,
      'Alamat': m.alamat,
      'Nomor HP': m.nomorHp,
      'Email': m.email,
      'Departemen': m.departemen,
      'Bagian': m.bagian,
      'Jabatan Kerja': m.jabatanKerja,
      'Shift': m.shift,
      'Status Kerja': m.statusKerja,
      'Status Keanggotaan': m.statusKeanggotaan,
      'Tanggal Bergabung': m.tanggalBergabung,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Anggota SBN');
    XLSX.writeFile(workbook, `Data_Anggota_SBN_KASBI_VCI_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Handle File Upload for Import (Excel / CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);
    setIsProcessingFile(true);

    const fileName = file.name.toLowerCase();
    
    setTimeout(() => {
      if (fileName.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            processRawImportData(results.data);
            setIsProcessingFile(false);
          },
          error: (err) => {
            setImportError('Gagal membaca file CSV: ' + err.message);
            setIsProcessingFile(false);
          }
        });
      } else {
        // Excel file (.xlsx, .xls)
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            processRawImportData(data);
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
    }, 50);
  };

  const processRawImportData = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setImportError('File spreadsheet tidak berisi data.');
      return;
    }

    const parsedMembers: Partial<Member>[] = rows.map((row, idx) => {
      const getVal = (keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]).trim();
          }
        }
        return '';
      };

      const nik = getVal(['Employee ID', 'NIK', 'nik', 'Nik', 'NIP', 'No Karyawan', 'ID Karyawan']);
      const nama = getVal(['Full name', 'Nama Lengkap', 'Nama', 'nama', 'Nama_Lengkap', 'Name', 'Full Name']);
      const genderRaw = getVal(['Gender', 'Jenis Kelamin', 'JK', 'Sex']);
      const dept = getVal(['Department', 'Departemen', 'Dept', 'Organizational unit']);
      const gedung = getVal(['Gedung', 'Location', 'Bagian', 'Line', 'Section']);
      const position = getVal(['Position', 'Jabatan Kerja', 'Jabatan', 'Role']);
      const joinDate = getVal(['Chingluh employment date', 'Tanggal Bergabung', 'Tgl Masuk', 'Tgl Bergabung']);
      const addr1 = getVal(['Home Addr.(Chinese)', 'Alamat 1']);
      const addr2 = getVal(['Permanent Address', 'Alamat 2', 'Alamat', 'Address']);
      const alamatClean = addr2 || addr1 || 'Tangerang';

      const nomorAnggota = getVal(['Nomor Anggota', 'No Anggota', 'nomorAnggota', 'ID Anggota']) || `SBN-VCI-${String(members.length + idx + 1).padStart(4, '0')}`;

      const isFemale = genderRaw.toLowerCase().includes('female') || genderRaw.toLowerCase().includes('perempuan') || genderRaw.toLowerCase() === 'p';
      const genderClean: Gender = isFemale ? 'Perempuan' : 'Laki-laki';

      return {
        id: `mbr-imp-${Date.now()}-${idx}`,
        nomorAnggota,
        nik: nik || `VCI-${idx + 100}`,
        namaLengkap: nama || `Anggota Tanpa Nama ${idx + 1}`,
        jenisKelamin: genderClean,
        tempatLahir: getVal(['Tempat Lahir', 'Tempat_Lahir']) || 'Tangerang',
        tanggalLahir: getVal(['Tanggal Lahir', 'Tgl Lahir']) || '',
        alamat: alamatClean,
        nomorHp: getVal(['Nomor HP', 'No HP', 'Handphone', 'Phone']) || '-',
        email: getVal(['Email', 'email']) || '',
        departemen: dept || (gedung || 'Produksi'),
        bagian: gedung || 'Line',
        jabatanKerja: position || 'OPERATOR',
        shift: (getVal(['Shift', 'shift']) as ShiftType) || 'Shift 1',
        statusKerja: (getVal(['Status Kerja', 'Status_Kerja']) as EmploymentStatus) || 'PKWTT',
        statusKeanggotaan: (getVal(['Status Keanggotaan', 'Status']) as MemberStatus) || 'Aktif',
        tanggalBergabung: joinDate || new Date().toISOString().slice(0, 10),
        fotoUrl: cheAvatar
      };
    });

    setImportPreviewData(parsedMembers);
    setImportPage(1);
  };

  const handleConfirmImport = () => {
    if (importPreviewData.length === 0) return;

    // Build set of NIKs from the imported file
    const excelNiksSet = new Set<string>();
    importPreviewData.forEach(item => {
      if (item.nik && String(item.nik).trim()) {
        excelNiksSet.add(String(item.nik).trim().toLowerCase());
      }
    });

    // 1. Check existing members
    // Rule: "ketika data sudah ada (biarkan jangan dirubah 1 pun)"
    // Rule: "jika ada pengurangan maka buatlah anggota yang sudah tidak tersedia datanya dari excel terbaru menjadi berwarna merah bold"
    let missingCount = 0;
    let unchangedCount = 0;

    const updatedExistingMembers: Member[] = members.map(m => {
      const mNik = (m.nik || '').trim().toLowerCase();
      const isPresentInExcel = mNik && excelNiksSet.has(mNik);

      if (isPresentInExcel) {
        unchangedCount++;
        return {
          ...m,
          isMissingFromExcel: false,
          isNewFromExcel: false
        };
      } else {
        missingCount++;
        return {
          ...m,
          isMissingFromExcel: true,
          isNewFromExcel: false
        };
      }
    });

    // 2. Identify NEW members from Excel
    // Rule: "jika ada penambahan data maka tampilkan di paling atas dengan pop up (.... penambahan anggota baru)"
    const existingNiksSet = new Set(members.map(m => (m.nik || '').trim().toLowerCase()));
    const newMembersFromExcel: Member[] = [];

    importPreviewData.forEach((imp, idx) => {
      const impNik = (imp.nik || '').trim().toLowerCase();
      if (!impNik || !existingNiksSet.has(impNik)) {
        newMembersFromExcel.push({
          id: imp.id || `mbr-new-${Date.now()}-${idx}`,
          nomorAnggota: imp.nomorAnggota || `SBN-VCI-${String(members.length + newMembersFromExcel.length + 1).padStart(4, '0')}`,
          nik: imp.nik || `VCI-${idx + 100}`,
          namaLengkap: imp.namaLengkap || 'Anggota Baru',
          jenisKelamin: imp.jenisKelamin || 'Laki-laki',
          tempatLahir: imp.tempatLahir || 'Tangerang',
          tanggalLahir: imp.tanggalLahir || '',
          alamat: imp.alamat || '-',
          nomorHp: imp.nomorHp || '-',
          email: imp.email || '',
          departemen: imp.departemen || 'Assembly',
          bagian: imp.bagian || 'Line',
          jabatanKerja: imp.jabatanKerja || 'OPERATOR',
          shift: imp.shift || 'Shift 1',
          statusKerja: imp.statusKerja || 'PKWTT',
          statusKeanggotaan: imp.statusKeanggotaan || 'Aktif',
          tanggalBergabung: imp.tanggalBergabung || new Date().toISOString().slice(0, 10),
          fotoUrl: imp.fotoUrl || cheAvatar,
          updatedAt: new Date().toISOString(),
          isNewFromExcel: true,
          isMissingFromExcel: false
        });
      }
    });

    // Put NEW members at the VERY TOP
    const finalMembersList = [...newMembersFromExcel, ...updatedExistingMembers];

    onImportMembers(finalMembersList);

    // Trigger Popup Result
    setImportPopupResult({
      addedCount: newMembersFromExcel.length,
      missingCount: missingCount,
      unchangedCount: unchangedCount
    });

    setIsImportModalOpen(false);
    setImportPreviewData([]);
    setImportFileName('');
  };

  // Confirm Delete Member with Mandatory Reason & Manual Notes for Audit Trail
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
    try {
      localStorage.setItem('sbn_vci_deleted_member_audits', JSON.stringify(updatedAudits));
    } catch (err) {
      console.error('Gagal menyimpan audit log ke localStorage:', err);
    }

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
    shift: 'Shift 1',
    statusKerja: 'PKWTT',
    statusKeanggotaan: 'Aktif',
    tanggalBergabung: new Date().toISOString().slice(0, 10),
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
      shift: 'Shift 1',
      statusKerja: 'PKWTT',
      statusKeanggotaan: 'Aktif',
      tanggalBergabung: new Date().toISOString().slice(0, 10),
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
        id: `mbr-${Date.now()}`,
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
        shift: (formData.shift as ShiftType) || 'Shift 1',
        statusKerja: (formData.statusKerja as EmploymentStatus) || 'PKWTT',
        statusKeanggotaan: (formData.statusKeanggotaan as MemberStatus) || 'Aktif',
        tanggalBergabung: formData.tanggalBergabung || new Date().toISOString().slice(0, 10),
        fotoUrl: formData.fotoUrl || cheAvatar
      };
      onAddMember(newMbr);
    }

    setIsAddEditModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-950 text-red-400 border border-red-800/40 shrink-0">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white leading-snug">Data Anggota SBN KASBI</h1>
              <p className="text-xs text-slate-400">Pusat Informasi & Database Anggota PT Victory Chingluh Indonesia ({members.length} Terdaftar)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer relative"
            title="Lihat Riwayat Audit & Alasan Penghapusan Anggota"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-400" />
            <span>Audit Penghapusan ({deletedAudits.length})</span>
            {deletedAudits.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="Import dari Excel / CSV"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Import Excel/CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="Export ke file Excel XLSX"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Export Excel
          </button>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-md shadow-red-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Anggota
          </button>
        </div>
      </div>

      {/* Search Bar & Multi Filter Toolbar */}
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

          {/* Status Keanggotaan Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Status Keanggotaan</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500 text-xs"
            >
              <option value="All">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Non-Aktif</option>
              <option value="Penangguhan">Penangguhan</option>
              <option value="Cuti">Cuti</option>
            </select>
          </div>

          {/* Status Kerja Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Status Kerja</label>
            <select
              value={selectedStatusKerja}
              onChange={(e) => setSelectedStatusKerja(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500 text-xs"
            >
              <option value="All">Semua Status Kerja</option>
              <option value="PKWTT">PKWTT (Tetap)</option>
              <option value="PKWT">PKWT (Kontrak)</option>
              <option value="Outsourcing">Outsourcing</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500 text-xs"
            >
              <option value="All">Semua Shift</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3</option>
              <option value="Non-Shift">Non-Shift</option>
            </select>
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
                <th className="p-3.5">NIK (Data Excel)</th>
                <th className="p-3.5">Departemen & Bagian</th>
                <th className="p-3.5">Status Kerja & Shift</th>
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
                  const isMissing = mbr.isMissingFromExcel;
                  const isNew = mbr.isNewFromExcel;

                  return (
                    <tr 
                      key={mbr.id} 
                      className={`transition-colors ${
                        isMissing 
                          ? 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-600' 
                          : isNew 
                            ? 'bg-emerald-950/20 hover:bg-emerald-900/30 border-l-4 border-l-emerald-500' 
                            : 'hover:bg-slate-850/60'
                      }`}
                    >
                      
                      {/* Member Info */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold shrink-0 ${
                            isMissing ? 'bg-rose-950 border-rose-700 text-rose-300' : 'bg-slate-800 border-slate-700 text-red-400'
                          }`}>
                            {mbr.namaLengkap ? mbr.namaLengkap.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className={`text-sm ${isMissing ? 'font-black text-rose-400 font-extrabold uppercase tracking-wide' : 'font-bold text-slate-100'}`}>
                                {mbr.namaLengkap}
                              </p>
                              {isMissing && (
                                <span className="px-2 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded uppercase shadow">
                                  ⚠️ Tidak Ada di Excel Terbaru
                                </span>
                              )}
                              {isNew && (
                                <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-600 text-white rounded uppercase shadow">
                                  ✨ Anggota Baru
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] ${isMissing ? 'text-rose-300 font-bold' : 'text-slate-400'}`}>
                              {mbr.jabatanKerja} {mbr.nomorHp !== '-' ? `• ${mbr.nomorHp}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* NIK (Data dari Excel) */}
                      <td className="p-3.5 font-mono">
                        <p className={`font-black text-sm ${isMissing ? 'text-rose-400 font-black' : 'text-emerald-400'}`}>
                          NIK: {mbr.nik}
                        </p>
                      </td>

                      {/* Dept & Section */}
                      <td className="p-3.5">
                        <p className={`font-bold max-w-xs truncate ${isMissing ? 'text-rose-200' : 'text-slate-200'}`} title={mbr.departemen}>
                          {mbr.departemen}
                        </p>
                        <p className={`text-[11px] ${isMissing ? 'text-rose-300' : 'text-slate-400'}`}>{mbr.bagian}</p>
                      </td>

                      {/* Work Status & Shift */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border mr-1.5 ${
                          isMissing ? 'bg-rose-900/60 text-rose-200 border-rose-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {mbr.statusKerja}
                        </span>
                        <span className={`text-[11px] ${isMissing ? 'text-rose-300' : 'text-slate-400'}`}>{mbr.shift}</span>
                      </td>

                      {/* Membership status */}
                      <td className="p-3.5">
                        {isMissing ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 w-fit shadow">
                            <UserX className="w-3 h-3" />
                            Dihapus di Excel
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit ${
                            mbr.statusKeanggotaan === 'Aktif' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                              : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          }`}>
                            {mbr.statusKeanggotaan === 'Aktif' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {mbr.statusKeanggotaan}
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
                            title="Edit Data Anggota"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setMemberToDelete(mbr);
                              setDeleteReason('Mengundurkan Diri / Resign');
                              setDeleteNotesManual('');
                              setDeleteError(null);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Anggota & Catat Audit"
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-950">
            <span className="text-slate-400">
              Halaman <strong className="text-white">{currentPage}</strong> dari <strong className="text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors flex items-center gap-1 font-semibold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center space-x-1 px-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors flex items-center gap-1 font-semibold text-xs"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MEMBER DETAIL BIODATA MODAL */}
      {isDetailModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white p-6 shadow-2xl relative">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-slate-800">
              <div className="relative group cursor-pointer shrink-0">
                <img
                  src={selectedMember.fotoUrl || cheAvatar}
                  alt={selectedMember.namaLengkap}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-red-600 shadow-xl bg-black"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = cheAvatar;
                  }}
                />
                <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer p-1 text-center">
                  <Camera className="w-6 h-6 text-red-400 mb-0.5" />
                  <span>Ubah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const base64 = await compressImage(file, 350, 350, 0.75);
                        const updated = { ...selectedMember, fotoUrl: base64 };
                        setSelectedMember(updated);
                        onUpdateMember(updated);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 text-xs font-mono font-black bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded-lg shadow-sm">
                    NIK (Excel): {selectedMember.nik}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{selectedMember.namaLengkap}</h2>
                <p className="text-xs text-slate-300 font-semibold">{selectedMember.jabatanKerja} • {selectedMember.departemen} ({selectedMember.bagian})</p>
                
                <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Status: {selectedMember.statusKeanggotaan}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Kerja: {selectedMember.statusKerja}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {selectedMember.shift}
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
                <p className="text-[10px] text-slate-400 font-semibold">Tempat / Tanggal Lahir</p>
                <p className="font-bold text-slate-200">{selectedMember.tempatLahir}{selectedMember.tanggalLahir ? `, ${selectedMember.tanggalLahir}` : ''}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Nomor Handphone / WhatsApp</p>
                <p className="font-bold text-slate-200">{selectedMember.nomorHp}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Email</p>
                <p className="font-bold text-slate-200">{selectedMember.email || '-'}</p>
              </div>

              <div className="md:col-span-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Alamat Kediaman</p>
                <p className="font-bold text-slate-200 leading-relaxed">{selectedMember.alamat}</p>
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
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* IMPORT EXCEL / CSV MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto text-white p-6 shadow-2xl relative">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Import Data Anggota Spreadsheet</h2>
                <p className="text-xs text-slate-400">Upload file Excel (.xlsx / .xls) atau CSV (.csv). Sistem mendukung format Google Sheet resmi.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center space-y-3 mb-4">
              {isProcessingFile ? (
                <div className="py-4 flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs text-emerald-400 font-semibold">Membaca data file spreadsheet...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Pilih file spreadsheet dari komputer Anda</p>
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
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {importError}
              </div>
            )}

            {/* Preview table */}
            {importPreviewData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold">Pratinjau Data Impor ({importPreviewData.length} Baris Data Ditemukan):</span>
                  <span className="text-[11px] text-emerald-400">✓ Format tervalidasi</span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 sticky top-0 text-[10px] text-slate-400 uppercase">
                      <tr>
                        <th className="p-2">No. Anggota</th>
                        <th className="p-2">NIK</th>
                        <th className="p-2">Nama Lengkap</th>
                        <th className="p-2">Departemen</th>
                        <th className="p-2">Bagian</th>
                        <th className="p-2">Jabatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {importPreviewData.slice((importPage - 1) * 20, importPage * 20).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-2 font-mono text-red-400">{row.nomorAnggota}</td>
                          <td className="p-2">{row.nik}</td>
                          <td className="p-2 font-bold">{row.namaLengkap}</td>
                          <td className="p-2 max-w-xs truncate">{row.departemen}</td>
                          <td className="p-2">{row.bagian}</td>
                          <td className="p-2">{row.jabatanKerja}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Import preview pagination */}
                {importPreviewData.length > 20 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Menampilkan {((importPage - 1) * 20) + 1} - {Math.min(importPage * 20, importPreviewData.length)} dari {importPreviewData.length} data
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={importPage === 1}
                        onClick={() => setImportPage(prev => Math.max(1, prev - 1))}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <span>Halaman {importPage} dari {Math.ceil(importPreviewData.length / 20)}</span>
                      <button
                        disabled={importPage === Math.ceil(importPreviewData.length / 20)}
                        onClick={() => setImportPage(prev => Math.min(Math.ceil(importPreviewData.length / 20), prev + 1))}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode Pengolahan Data Impor */}
                <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <p className="font-bold text-slate-200">Metode Pengolahan Data Impor:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${importMode === 'replace' ? 'bg-red-950/80 border-red-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        checked={importMode === 'replace'} 
                        onChange={() => setImportMode('replace')}
                        className="mt-0.5 accent-red-500 shrink-0" 
                      />
                      <div>
                        <p className="font-bold text-red-400">Ganti Total / Reset Data (Default)</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Menghapus seluruh {members.length} data lama dan menggantikan murni dengan {importPreviewData.length} data baru agar tidak tumpang tindih.</p>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${importMode === 'merge' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        checked={importMode === 'merge'} 
                        onChange={() => setImportMode('merge')}
                        className="mt-0.5 accent-slate-400 shrink-0" 
                      />
                      <div>
                        <p className="font-bold text-slate-200">Gabungkan (Merge) dengan Data Lama</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Mempertahankan data lama dan memperbarui/menambahkan data berdasarkan NIK yang sama.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreviewData([]);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>

              <button
                disabled={importPreviewData.length === 0}
                onClick={handleConfirmImport}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer ${
                  importPreviewData.length > 0 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Konfirmasi & Impor {importPreviewData.length} Data
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT MEMBER FORM MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">
              {editingMember ? 'Edit Data Anggota SBN' : 'Tambah Anggota Baru SBN'}
            </h2>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
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
                  <label className="block text-slate-400 mb-1 font-semibold">Shift Kerja</label>
                  <select
                    value={formData.shift || 'Shift 1'}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as ShiftType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Shift 1">Shift 1</option>
                    <option value="Shift 2">Shift 2</option>
                    <option value="Shift 3">Shift 3</option>
                    <option value="Non-Shift">Non-Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status Kerja</label>
                  <select
                    value={formData.statusKerja || 'PKWTT'}
                    onChange={(e) => setFormData({ ...formData, statusKerja: e.target.value as EmploymentStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="PKWTT">PKWTT (Tetap)</option>
                    <option value="PKWT">PKWT (Kontrak)</option>
                    <option value="Outsourcing">Outsourcing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status Keanggotaan</label>
                  <select
                    value={formData.statusKeanggotaan || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, statusKeanggotaan: e.target.value as MemberStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                    <option value="Penangguhan">Penangguhan</option>
                    <option value="Cuti">Cuti</option>
                  </select>
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

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end space-x-2">
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
      )}

      {/* DELETION WITH AUDIT TRAIL MODAL (Requirement 5) */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl w-full max-w-lg text-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
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
                <p className="text-xs text-slate-400">{memberToDelete.departemen} - {memberToDelete.bagian}</p>
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
      )}

      {/* AUDIT LOG HISTORY MODAL */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col text-white p-6 shadow-2xl relative">
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
      )}

      {/* IMPORT NOTIFICATION RESULT POPUP (Requirement 4) */}
      {importPopupResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-800/80 rounded-2xl w-full max-w-md text-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-center text-white mb-1">
              {importPopupResult.addedCount > 0 
                ? `${importPopupResult.addedCount} Penambahan Anggota Baru!`
                : 'Sinkronisasi Excel Selesai'
              }
            </h3>
            <p className="text-xs text-center text-slate-400 mb-6">
              Data dari file Excel terbaru telah diproses dan disesuaikan secara otomatis.
            </p>

            <div className="space-y-2.5 mb-6 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-between">
                <span className="font-bold text-emerald-300">✨ Penambahan Anggota Baru:</span>
                <span className="font-black text-emerald-400 font-mono text-sm">+{importPopupResult.addedCount} Data</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-300">🔒 Data Tetap (Tidak Berubah):</span>
                <span className="font-black text-slate-200 font-mono text-sm">{importPopupResult.unchangedCount} Data</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-between">
                <span className="font-bold text-rose-300">⚠️ Tidak Ada di Excel (Merah Bold):</span>
                <span className="font-black text-rose-400 font-mono text-sm">{importPopupResult.missingCount} Data</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center mb-6 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              * Anggota baru langsung ditampilkan di paling atas daftar. Anggota yang tidak ada di Excel terbaru ditandai warna merah bold.
            </p>

            <button
              onClick={() => setImportPopupResult(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
            >
              Mengerti & Lihat Data Anggota
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
