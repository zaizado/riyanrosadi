import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Calendar, 
  Plus, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  DollarSign, 
  Receipt, 
  Building2, 
  Tag, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { FinanceDailyRecord, DailyExpenseItem, UserAccount } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface FinanceModuleProps {
  records: FinanceDailyRecord[];
  currentUser: UserAccount;
  onSaveRecord: (record: FinanceDailyRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  records,
  currentUser,
  onSaveRecord,
  onDeleteRecord
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthYear, setSelectedMonthYear] = useState(''); // YYYY-MM
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<FinanceDailyRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Quick Add Expense Item Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilterType, setExportFilterType] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'semua'>('bulanan');
  const [exportSelectedDate, setExportSelectedDate] = useState(todayStr);
  const [exportSelectedMonth, setExportSelectedMonth] = useState(todayStr.slice(0, 7)); // YYYY-MM
  const [exportSelectedYear, setExportSelectedYear] = useState(todayStr.slice(0, 4));

  // Sort records chronologically by date ascending to calculate cascade balances properly
  const sortedRecordsAsc = useMemo(() => {
    return [...records].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [records]);

  // Compute cascading balances (saldoAwal of T = saldoAkhir of T-1)
  const cascadedRecordsMap = useMemo(() => {
    const map = new Map<string, {
      record: FinanceDailyRecord;
      calculatedSaldoAwal: number;
      calculatedTotalPengeluaran: number;
      calculatedSaldoAkhir: number;
    }>();

    let previousSaldoAkhir = 0;

    sortedRecordsAsc.forEach((rec, idx) => {
      // If it's the very first record and saldoAwal is manually set, respect it
      let saldoAwal = rec.saldoAwal;
      if (idx > 0) {
        saldoAwal = previousSaldoAkhir;
      }

      const totalPengeluaran = (rec.pengeluaranItems || []).reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
      const saldoAkhir = saldoAwal + (Number(rec.uangCosMasuk) || 0) - totalPengeluaran;

      map.set(rec.id, {
        record: rec,
        calculatedSaldoAwal: saldoAwal,
        calculatedTotalPengeluaran: totalPengeluaran,
        calculatedSaldoAkhir: saldoAkhir
      });

      previousSaldoAkhir = saldoAkhir;
    });

    return map;
  }, [sortedRecordsAsc]);

  // Helper to get previous day's ending balance
  const getLatestEndingBalanceBeforeDate = (dateStr: string): number => {
    const priorRecords = sortedRecordsAsc.filter(r => r.tanggal < dateStr);
    if (priorRecords.length === 0) return 0;
    const lastPrior = priorRecords[priorRecords.length - 1];
    const computed = cascadedRecordsMap.get(lastPrior.id);
    return computed ? computed.calculatedSaldoAkhir : 0;
  };

  // Form state for creating/editing daily record
  const [formData, setFormData] = useState<{
    id?: string;
    tanggal: string;
    saldoAwal: number;
    uangCosMasuk: number;
    keteranganCos: string;
    pengeluaranItems: DailyExpenseItem[];
    catatanHarian: string;
    isManualSaldoAwal: boolean;
  }>({
    tanggal: todayStr,
    saldoAwal: getLatestEndingBalanceBeforeDate(todayStr),
    uangCosMasuk: 0,
    keteranganCos: '',
    pengeluaranItems: [],
    catatanHarian: '',
    isManualSaldoAwal: false
  });

  // Expense Item Sub-form State (inside record modal)
  const [expenseForm, setExpenseForm] = useState<{
    waktu: string;
    nominal: string;
    keterangan: string;
    kategori: string;
    penerimaNota: string;
  }>({
    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    nominal: '',
    keterangan: '',
    kategori: 'Operasional',
    penerimaNota: ''
  });

  // Top summary calculations
  const topMetrics = useMemo(() => {
    let totalMasukCos = 0;
    let totalPengeluaranAll = 0;

    sortedRecordsAsc.forEach(r => {
      totalMasukCos += Number(r.uangCosMasuk) || 0;
      const computed = cascadedRecordsMap.get(r.id);
      if (computed) {
        totalPengeluaranAll += computed.calculatedTotalPengeluaran;
      }
    });

    // Current latest balance
    let currentBalance = 0;
    if (sortedRecordsAsc.length > 0) {
      const lastRec = sortedRecordsAsc[sortedRecordsAsc.length - 1];
      const computedLast = cascadedRecordsMap.get(lastRec.id);
      currentBalance = computedLast ? computedLast.calculatedSaldoAkhir : 0;
    }

    return {
      totalMasukCos,
      totalPengeluaranAll,
      currentBalance,
      totalDaysRecorded: records.length
    };
  }, [sortedRecordsAsc, cascadedRecordsMap, records]);

  // Filtered Records (descending for display)
  const displayRecordsList = useMemo(() => {
    return [...sortedRecordsAsc].reverse().filter(rec => {
      const computed = cascadedRecordsMap.get(rec.id);
      const searchLower = searchTerm.toLowerCase().trim();

      const matchesSearch = !searchLower || (
        rec.tanggal.includes(searchLower) ||
        (rec.keteranganCos && rec.keteranganCos.toLowerCase().includes(searchLower)) ||
        (rec.catatanHarian && rec.catatanHarian.toLowerCase().includes(searchLower)) ||
        rec.pengeluaranItems.some(i => 
          i.keterangan.toLowerCase().includes(searchLower) || 
          i.kategori.toLowerCase().includes(searchLower) ||
          (i.penerimaNota && i.penerimaNota.toLowerCase().includes(searchLower))
        )
      );

      const matchesMonthYear = !selectedMonthYear || rec.tanggal.startsWith(selectedMonthYear);

      return matchesSearch && matchesMonthYear;
    });
  }, [sortedRecordsAsc, cascadedRecordsMap, searchTerm, selectedMonthYear]);

  // Pagination
  const totalPages = Math.ceil(displayRecordsList.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayRecordsList.slice(start, start + itemsPerPage);
  }, [displayRecordsList, currentPage]);

  // Open modal for NEW daily record
  const handleOpenAddRecord = (targetDate = todayStr) => {
    const existing = records.find(r => r.tanggal === targetDate);
    if (existing) {
      // Edit existing
      handleOpenEditRecord(existing);
      return;
    }

    const defaultSaldoAwal = getLatestEndingBalanceBeforeDate(targetDate);

    setFormData({
      tanggal: targetDate,
      saldoAwal: defaultSaldoAwal,
      uangCosMasuk: 0,
      keteranganCos: 'Penerimaan COS Bulanan Anggota',
      pengeluaranItems: [],
      catatanHarian: '',
      isManualSaldoAwal: false
    });

    setExpenseForm({
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      nominal: '',
      keterangan: '',
      kategori: 'Operasional',
      penerimaNota: ''
    });

    setIsRecordModalOpen(true);
  };

  // Open modal for EDITING daily record
  const handleOpenEditRecord = (record: FinanceDailyRecord) => {
    const computed = cascadedRecordsMap.get(record.id);
    const saldoAwalToUse = computed ? computed.calculatedSaldoAwal : record.saldoAwal;

    setFormData({
      id: record.id,
      tanggal: record.tanggal,
      saldoAwal: saldoAwalToUse,
      uangCosMasuk: record.uangCosMasuk,
      keteranganCos: record.keteranganCos || '',
      pengeluaranItems: [...record.pengeluaranItems],
      catatanHarian: record.catatanHarian || '',
      isManualSaldoAwal: false
    });

    setExpenseForm({
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      nominal: '',
      keterangan: '',
      kategori: 'Operasional',
      penerimaNota: ''
    });

    setIsRecordModalOpen(true);
  };

  // When date changes in form, update default saldoAwal automatically
  const handleDateChangeInForm = (newDateStr: string) => {
    const defaultSaldoAwal = getLatestEndingBalanceBeforeDate(newDateStr);
    setFormData(prev => ({
      ...prev,
      tanggal: newDateStr,
      saldoAwal: prev.isManualSaldoAwal ? prev.saldoAwal : defaultSaldoAwal
    }));
  };

  // Add Expense item inside form
  const handleAddExpenseItem = () => {
    const nom = parseFloat(expenseForm.nominal.replace(/[^0-9]/g, '')) || 0;
    if (nom <= 0) {
      alert('Masukkan nominal pengeluaran yang valid (> 0)');
      return;
    }
    if (!expenseForm.keterangan.trim()) {
      alert('Masukkan keterangan pengeluaran');
      return;
    }

    const newItem: DailyExpenseItem = {
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      waktu: expenseForm.waktu || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      nominal: nom,
      keterangan: expenseForm.keterangan.trim(),
      kategori: expenseForm.kategori,
      penerimaNota: expenseForm.penerimaNota.trim() || '-',
      updatedBy: currentUser.name
    };

    setFormData(prev => ({
      ...prev,
      pengeluaranItems: [...prev.pengeluaranItems, newItem]
    }));

    // Reset expense item input
    setExpenseForm({
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      nominal: '',
      keterangan: '',
      kategori: 'Operasional',
      penerimaNota: ''
    });
  };

  // Remove expense item
  const handleRemoveExpenseItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      pengeluaranItems: prev.pengeluaranItems.filter(i => i.id !== itemId)
    }));
  };

  // Save record
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tanggal) {
      alert('Pilih tanggal transaksi');
      return;
    }

    const recordToSave: FinanceDailyRecord = {
      id: formData.id || `fin-${formData.tanggal}`,
      tanggal: formData.tanggal,
      saldoAwal: Number(formData.saldoAwal) || 0,
      uangCosMasuk: Number(formData.uangCosMasuk) || 0,
      keteranganCos: formData.keteranganCos.trim(),
      pengeluaranItems: formData.pengeluaranItems,
      catatanHarian: formData.catatanHarian.trim(),
      updatedBy: `${currentUser.name} (${currentUser.role})`,
      updatedAt: new Date().toISOString()
    };

    onSaveRecord(recordToSave);
    setIsRecordModalOpen(false);
  };

  // Format currency Helper
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Export to Excel Function
  const handleExportExcel = () => {
    let recordsToExport: FinanceDailyRecord[] = [];
    let periodLabel = '';

    if (exportFilterType === 'harian') {
      recordsToExport = sortedRecordsAsc.filter(r => r.tanggal === exportSelectedDate);
      periodLabel = `Harian - Tanggal ${exportSelectedDate}`;
    } else if (exportFilterType === 'mingguan') {
      // 7 days window ending on selected date
      const endDt = new Date(exportSelectedDate);
      const startDt = new Date(endDt);
      startDt.setDate(startDt.getDate() - 6);

      const startStr = startDt.toISOString().slice(0, 10);
      const endStr = endDt.toISOString().slice(0, 10);

      recordsToExport = sortedRecordsAsc.filter(r => r.tanggal >= startStr && r.tanggal <= endStr);
      periodLabel = `Mingguan (${startStr} s.d. ${endStr})`;
    } else if (exportFilterType === 'bulanan') {
      recordsToExport = sortedRecordsAsc.filter(r => r.tanggal.startsWith(exportSelectedMonth));
      periodLabel = `Bulanan - Periode ${exportSelectedMonth}`;
    } else if (exportFilterType === 'tahunan') {
      recordsToExport = sortedRecordsAsc.filter(r => r.tanggal.startsWith(exportSelectedYear));
      periodLabel = `Tahunan - Tahun ${exportSelectedYear}`;
    } else {
      recordsToExport = [...sortedRecordsAsc];
      periodLabel = 'Semua Periode Transaksi';
    }

    if (recordsToExport.length === 0) {
      alert(`Tidak ada data keuangan untuk periode terpilih (${periodLabel}).`);
      return;
    }

    // Build Excel Data rows
    const excelRows: any[] = [];

    // Title rows
    excelRows.push(['SERIKAT BURUH NUSANTARA (SBN) PT VICTORY CHINGLUH INDONESIA']);
    excelRows.push(['LAPORAN KEUANGAN, KAS & COS BULANAN ORGANISASI']);
    excelRows.push([`Periode Laporan: ${periodLabel}`]);
    excelRows.push([`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`]);
    excelRows.push([]); // blank line

    // Table Header
    excelRows.push([
      'NO',
      'TANGGAL',
      'SALDO AWAL (RP)',
      'UANG COS MASUK (RP)',
      'KETERANGAN COS',
      'TOTAL PEMASUKAN (RP)',
      'RINCIAN PENGELUARAN HARIAN',
      'TOTAL PENGELUARAN (RP)',
      'SALDO AKHIR (RP)',
      'CATATAN / PETUGAS'
    ]);

    let grandTotalCos = 0;
    let grandTotalKeluar = 0;

    recordsToExport.forEach((rec, index) => {
      const computed = cascadedRecordsMap.get(rec.id);
      const saldoAwal = computed ? computed.calculatedSaldoAwal : rec.saldoAwal;
      const totalPengeluaran = computed ? computed.calculatedTotalPengeluaran : 0;
      const saldoAkhir = computed ? computed.calculatedSaldoAkhir : (saldoAwal + rec.uangCosMasuk - totalPengeluaran);
      const totalPemasukan = saldoAwal + rec.uangCosMasuk;

      grandTotalCos += rec.uangCosMasuk;
      grandTotalKeluar += totalPengeluaran;

      // Format expense list string
      const expenseListText = (rec.pengeluaranItems || []).map(item => 
        `• [${item.waktu}] ${item.keterangan} (${item.kategori}) - Rp ${item.nominal.toLocaleString('id-ID')}`
      ).join('\n') || '- Tidak ada pengeluaran -';

      excelRows.push([
        index + 1,
        rec.tanggal,
        saldoAwal,
        rec.uangCosMasuk,
        rec.keteranganCos || '-',
        totalPemasukan,
        expenseListText,
        totalPengeluaran,
        saldoAkhir,
        `${rec.catatanHarian || ''} (Diupdate: ${rec.updatedBy || 'Admin'})`
      ]);
    });

    // Total summary row at bottom
    excelRows.push([]);
    excelRows.push([
      'TOTAL',
      `Total ${recordsToExport.length} Hari`,
      '-',
      grandTotalCos,
      'Total Uang COS Masuk',
      '-',
      'Total Pengeluaran Keseluruhan',
      grandTotalKeluar,
      recordsToExport.length > 0 ? (cascadedRecordsMap.get(recordsToExport[recordsToExport.length - 1].id)?.calculatedSaldoAkhir || 0) : 0,
      'Laporan Resmi Divisi Keuangan SBN'
    ]);

    // Create Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);

    // Set Column Widths
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 14 }, // Tanggal
      { wch: 18 }, // Saldo Awal
      { wch: 20 }, // Uang COS
      { wch: 30 }, // Keterangan COS
      { wch: 22 }, // Total Pemasukan
      { wch: 55 }, // Rincian Pengeluaran
      { wch: 22 }, // Total Keluar
      { wch: 20 }, // Saldo Akhir
      { wch: 35 }  // Catatan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan SBN');

    // Download File
    const fileName = `Laporan_Keuangan_SBN_VCI_${exportFilterType}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* ------------------- HEADER TITLE ------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl shadow-lg shadow-amber-900/30">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                DIVISI DANA DAN KEUANGAN
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                Kas & COS SBN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pencatatan Saldo Awal, Uang COS Masuk, Pengeluaran Harian & Reorganisasi Kas Otomatis
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Laporan Excel</span>
          </button>

          <button
            onClick={() => handleOpenAddRecord(todayStr)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-900/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Transaksi Hari Ini</span>
          </button>
        </div>
      </div>

      {/* ------------------- TOP SUMMARY METRICS (Bagian Atas) ------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Akhir Saat Ini */}
        <div className="bg-slate-900/90 border border-amber-500/40 p-5 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
              Saldo Saat Ini (Kas Terkini)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-1 font-mono tracking-tight">
            {formatRupiah(topMetrics.currentBalance)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-300/80 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Saldo akhir otomatis terakumulasi</span>
          </div>
        </div>

        {/* Card 2: Total Uang COS Masuk */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Uang COS Masuk
            </span>
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
            {formatRupiah(topMetrics.totalMasukCos)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Akomodasi COS bulanan & iuran anggota
          </p>
        </div>

        {/* Card 3: Total Pengeluaran */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Uang Keluar
            </span>
            <div className="p-2 rounded-xl bg-rose-950 text-rose-400 border border-rose-800/60">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1 font-mono tracking-tight">
            {formatRupiah(topMetrics.totalPengeluaranAll)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Operasional, aksi, konsumsi & bantuan
          </p>
        </div>

        {/* Card 4: Hari Transaksi Tercatat */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Log Transaksi Harian
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-blue-400 border border-slate-700">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-1 font-mono tracking-tight">
            {topMetrics.totalDaysRecorded} <span className="text-sm font-normal text-slate-400">Hari</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Rekam jejak kas organisasi SBN
          </p>
        </div>

      </div>

      {/* ------------------- FILTER & SEARCH BAR ------------------- */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari transaksi berdasarkan tanggal, rincian pengeluaran, atau keterangan..."
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => {
                setSelectedMonthYear(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            />
            {selectedMonthYear && (
              <button
                onClick={() => setSelectedMonthYear('')}
                className="text-slate-400 hover:text-white ml-1"
                title="Reset Bulan"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleOpenAddRecord(todayStr)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Tanggal Baru</span>
          </button>
        </div>
      </div>

      {/* ------------------- TABLE OF DAILY RECORDS ------------------- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-white">Buku Jurnal Kas & COS Harian</h3>
          </div>
          <span className="text-xs text-slate-400">
            Total {displayRecordsList.length} Tanggal Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="p-3.5 min-w-[120px]">Tanggal</th>
                <th className="p-3.5 min-w-[130px]">Saldo Awal</th>
                <th className="p-3.5 min-w-[150px]">Uang COS Masuk</th>
                <th className="p-3.5 min-w-[140px]">Total Pemasukan</th>
                <th className="p-3.5 min-w-[260px]">Pengeluaran Hari Ini</th>
                <th className="p-3.5 min-w-[130px]">Saldo Akhir</th>
                <th className="p-3.5 text-right min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                    <Coins className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    Belum ada data jurnal keuangan harian. Klik "Input Transaksi Hari Ini" untuk menambah data.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => {
                  const computed = cascadedRecordsMap.get(rec.id);
                  const saldoAwal = computed ? computed.calculatedSaldoAwal : rec.saldoAwal;
                  const totalPengeluaran = computed ? computed.calculatedTotalPengeluaran : 0;
                  const saldoAkhir = computed ? computed.calculatedSaldoAkhir : (saldoAwal + rec.uangCosMasuk - totalPengeluaran);
                  const totalPemasukan = saldoAwal + rec.uangCosMasuk;

                  const isToday = rec.tanggal === todayStr;

                  return (
                    <tr 
                      key={rec.id} 
                      className={`hover:bg-slate-850/60 transition-colors ${
                        isToday ? 'bg-amber-950/20 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      {/* Tanggal */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white font-mono text-xs">{rec.tanggal}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Diupdate oleh {rec.updatedBy || 'Admin'}
                        </p>
                      </td>

                      {/* Saldo Awal */}
                      <td className="p-3.5 font-mono text-slate-300 font-semibold">
                        {formatRupiah(saldoAwal)}
                      </td>

                      {/* Uang COS Masuk */}
                      <td className="p-3.5 font-mono">
                        <p className="text-emerald-400 font-extrabold">+ {formatRupiah(rec.uangCosMasuk)}</p>
                        {rec.keteranganCos && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[140px]" title={rec.keteranganCos}>
                            {rec.keteranganCos}
                          </p>
                        )}
                      </td>

                      {/* Total Pemasukan (Saldo Awal + COS) */}
                      <td className="p-3.5 font-mono text-blue-300 font-bold bg-slate-950/40">
                        {formatRupiah(totalPemasukan)}
                      </td>

                      {/* Pengeluaran Hari Ini */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-extrabold text-rose-400 text-xs">
                              - {formatRupiah(totalPengeluaran)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                              {rec.pengeluaranItems.length} Item
                            </span>
                          </div>

                          {/* Preview item list */}
                          {rec.pengeluaranItems.length > 0 && (
                            <div className="space-y-0.5">
                              {rec.pengeluaranItems.slice(0, 2).map((item) => (
                                <p key={item.id} className="text-[10px] text-slate-400 truncate max-w-[240px]" title={`${item.keterangan} (Rp ${item.nominal.toLocaleString('id-ID')})`}>
                                  • <span className="text-slate-300">{item.keterangan}</span> ({formatRupiah(item.nominal)})
                                </p>
                              ))}
                              {rec.pengeluaranItems.length > 2 && (
                                <p className="text-[9px] text-amber-400 font-bold italic">
                                  + {rec.pengeluaranItems.length - 2} item pengeluaran lainnya...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Saldo Akhir Hari Ini */}
                      <td className="p-3.5 font-mono">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300 font-black text-xs inline-block">
                          {formatRupiah(saldoAkhir)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedRecordForDetail(rec)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Lihat Detail Transaksi & Rincian Pengeluaran"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditRecord(rec)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
                            title="Edit Transaksi Hari Ini"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(rec.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Tanggal Transaksi Ini"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Halaman {currentPage} dari {totalPages}</span>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------- MODAL FORM: CREATE / EDIT DAILY RECORD ------------------- */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-white p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsRecordModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {formData.id ? 'Edit Transaksi Keuangan Harian' : 'Input Transaksi Keuangan Hari Ini'}
                </h3>
                <p className="text-xs text-slate-400">Pencatatan Saldo Awal, COS Masuk, & Item Pengeluaran Harian</p>
              </div>
            </div>

            <form onSubmit={handleSaveForm} className="py-4 space-y-4 text-xs">
              
              {/* Date & Saldo Awal row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Tanggal Transaksi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => handleDateChangeInForm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-bold">
                      1. Saldo Awal (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, isManualSaldoAwal: !p.isManualSaldoAwal }))}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      {formData.isManualSaldoAwal ? '🔒 Pakai Otomatis dari Kemarin' : '✏️ Override Manual'}
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    readOnly={!formData.isManualSaldoAwal}
                    value={formData.saldoAwal}
                    onChange={(e) => setFormData(p => ({ ...p, saldoAwal: Number(e.target.value) || 0 }))}
                    className={`w-full border rounded-xl p-2.5 font-mono text-sm font-bold focus:outline-none ${
                      formData.isManualSaldoAwal 
                        ? 'bg-slate-950 border-amber-500 text-amber-300' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formData.isManualSaldoAwal 
                      ? '⚠️ Mengisi saldo awal manual' 
                      : '✓ Diisi otomatis dari saldo akhir tanggal sebelumnya'}
                  </p>
                </div>
              </div>

              {/* Uang COS Masuk & Keterangan */}
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-400 uppercase text-[11px] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> 2. Uang COS / Pemasukan Kas Hari Ini
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Nominal Uang COS Masuk (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.uangCosMasuk}
                      onChange={(e) => setFormData(p => ({ ...p, uangCosMasuk: Number(e.target.value) || 0 }))}
                      placeholder="Contoh: 2500000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-emerald-300 font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Keterangan COS / Sumber Pemasukan
                    </label>
                    <input
                      type="text"
                      value={formData.keteranganCos}
                      onChange={(e) => setFormData(p => ({ ...p, keteranganCos: e.target.value }))}
                      placeholder="Contoh: COS Anggota Shift 1 & 2 Juli 2026"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">TOTAL PEMASUKAN HARI INI (Saldo Awal + COS):</span>
                  <span className="text-blue-300 font-mono text-sm">
                    {formatRupiah((Number(formData.saldoAwal) || 0) + (Number(formData.uangCosMasuk) || 0))}
                  </span>
                </div>
              </div>

              {/* 3. SECTION PENGELUARAN HARIAN */}
              <div className="p-3.5 bg-rose-950/30 border border-rose-800/50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-rose-400 uppercase text-[11px] flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" /> 3. Menu Pengeluaran Harian
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Total: <strong className="text-rose-300 font-mono">{formatRupiah(formData.pengeluaranItems.reduce((s, i) => s + i.nominal, 0))}</strong>
                  </span>
                </div>

                {/* Sub-form Input Item Pengeluaran */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    + Form Tambah Item Pengeluaran Hari Ini:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <input
                        type="time"
                        value={expenseForm.waktu}
                        onChange={(e) => setExpenseForm(p => ({ ...p, waktu: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <select
                        value={expenseForm.kategori}
                        onChange={(e) => setExpenseForm(p => ({ ...p, kategori: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                      >
                        <option value="Operasional">Operasional (Bensin/Tol/ATK)</option>
                        <option value="Advokasi & Aksi">Advokasi & Aksi Industrial</option>
                        <option value="Konsumsi & Rapat">Konsumsi & Rapat Konsolidasi</option>
                        <option value="Atribut / Baju / Spanduk">Atribut / Spanduk / Kaos</option>
                        <option value="Bantuan Anggota">Bantuan & Santunan Anggota</option>
                        <option value="Lainnya">Lain-lain</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Nominal Keluar (Rp)"
                        value={expenseForm.nominal}
                        onChange={(e) => setExpenseForm(p => ({ ...p, nominal: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-rose-300 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Keterangan pengeluaran (misal: Bensin Xpander ke Pemda)..."
                      value={expenseForm.keterangan}
                      onChange={(e) => setExpenseForm(p => ({ ...p, keterangan: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Penerima / Toko / Kwitansi (Opsional)"
                        value={expenseForm.penerimaNota}
                        onChange={(e) => setExpenseForm(p => ({ ...p, penerimaNota: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddExpenseItem}
                        className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                </div>

                {/* List items added */}
                {formData.pengeluaranItems.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {formData.pengeluaranItems.map((item, idx) => (
                      <div key={item.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400">{item.waktu}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-amber-300">
                              {item.kategori}
                            </span>
                            <span className="font-bold text-slate-200">{item.keterangan}</span>
                          </div>
                          {item.penerimaNota && item.penerimaNota !== '-' && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Nota / Receiver: {item.penerimaNota}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-400">
                            - {formatRupiah(item.nominal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExpenseItem(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Hapus Item Ini"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saldo Akhir Live Preview */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between font-black text-xs">
                <span className="text-amber-300 uppercase">PREVIEW SALDO AKHIR HARI INI:</span>
                <span className="text-amber-400 font-mono text-base">
                  {formatRupiah(
                    ((Number(formData.saldoAwal) || 0) + (Number(formData.uangCosMasuk) || 0)) - 
                    formData.pengeluaranItems.reduce((s, i) => s + i.nominal, 0)
                  )}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Catatan Harian Pengurus (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.catatanHarian}
                  onChange={(e) => setFormData(p => ({ ...p, catatanHarian: e.target.value }))}
                  placeholder="Catatan verifikasi kas, penerimaan kuitansi, atau info penting..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-900/40"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Transaksi Keuangan</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------- MODAL DETAIL RECORD ------------------- */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl text-white p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedRecordForDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Rincian Keuangan Tanggal {selectedRecordForDetail.tanggal}</h3>
                <p className="text-xs text-slate-400">Jurnal resmi laporan kas Divisi Keuangan SBN</p>
              </div>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Saldo Awal:</p>
                  <p className="text-sm font-bold text-slate-200">
                    {formatRupiah(cascadedRecordsMap.get(selectedRecordForDetail.id)?.calculatedSaldoAwal || selectedRecordForDetail.saldoAwal)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Uang COS Masuk:</p>
                  <p className="text-sm font-bold text-emerald-400">
                    + {formatRupiah(selectedRecordForDetail.uangCosMasuk)}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between font-mono font-bold">
                <span className="text-amber-300">SALDO AKHIR HARI INI:</span>
                <span className="text-amber-400 text-base font-black">
                  {formatRupiah(cascadedRecordsMap.get(selectedRecordForDetail.id)?.calculatedSaldoAkhir || 0)}
                </span>
              </div>

              <div>
                <p className="font-bold text-slate-300 mb-2 uppercase text-[11px] flex items-center justify-between">
                  <span>Rincian Item Pengeluaran ({selectedRecordForDetail.pengeluaranItems.length}):</span>
                  <span className="text-rose-400 font-mono">
                    Total: {formatRupiah(cascadedRecordsMap.get(selectedRecordForDetail.id)?.calculatedTotalPengeluaran || 0)}
                  </span>
                </p>

                {selectedRecordForDetail.pengeluaranItems.length === 0 ? (
                  <p className="p-4 text-center text-slate-500 italic bg-slate-950 rounded-xl border border-slate-800">
                    Tidak ada item pengeluaran pada tanggal ini.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {selectedRecordForDetail.pengeluaranItems.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-200">{item.keterangan}</span>
                          <span className="text-rose-400 font-mono">- {formatRupiah(item.nominal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">{item.kategori}</span>
                          <span>Waktu: {item.waktu} {item.penerimaNota ? `• Nota: ${item.penerimaNota}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedRecordForDetail.catatanHarian && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-0.5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Catatan Harian Pengurus:</p>
                  <p className="text-slate-300 italic">"{selectedRecordForDetail.catatanHarian}"</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- MODAL EKSPOR EXCEL SELECTION ------------------- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-white p-6 shadow-2xl relative">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Ekspor Laporan Keuangan Excel</h3>
                <p className="text-xs text-slate-400">Pilih Opsi Filter Periode Laporan Keuangan</p>
              </div>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  1. Pilih Rentang Periode Laporan:
                </label>
                <select
                  value={exportFilterType}
                  onChange={(e: any) => setExportFilterType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="harian">Laporan Harian (Tanggal Spesifik)</option>
                  <option value="mingguan">Laporan Mingguan (7 Hari)</option>
                  <option value="bulanan">Laporan Bulanan (Per Bulan)</option>
                  <option value="tahunan">Laporan Tahunan (Per Tahun)</option>
                  <option value="semua">Semua Periode Transaksi</option>
                </select>
              </div>

              {exportFilterType === 'harian' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Pilih Tanggal Laporan:
                  </label>
                  <input
                    type="date"
                    value={exportSelectedDate}
                    onChange={(e) => setExportSelectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {exportFilterType === 'mingguan' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Pilih Tanggal Akhir Minggu (7 hari mundur):
                  </label>
                  <input
                    type="date"
                    value={exportSelectedDate}
                    onChange={(e) => setExportSelectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {exportFilterType === 'bulanan' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Pilih Bulan & Tahun:
                  </label>
                  <input
                    type="month"
                    value={exportSelectedMonth}
                    onChange={(e) => setExportSelectedMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {exportFilterType === 'tahunan' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Pilih Tahun:
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2050"
                    value={exportSelectedYear}
                    onChange={(e) => setExportSelectedYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-emerald-400">✓ Format File Output:</p>
                <p>• Header resmi Serikat Buruh Nusantara PT Victory Chingluh Indonesia</p>
                <p>• Rincian Saldo Awal, COS Masuk, Pengeluaran, & Saldo Akhir</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/40"
              >
                <Download className="w-4 h-4" />
                <span>Download File Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- CONFIRM DELETE MODAL ------------------- */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Hapus Tanggal Transaksi Keuangan"
        message="Apakah Anda yakin ingin menghapus catatan transaksi keuangan pada tanggal ini? Penyesuaian saldo pada tanggal setelahnya akan otomatis dikalkulasi ulang."
        confirmText="Ya, Hapus Data"
        cancelText="Batal"
        type="danger"
        icon="trash"
        onConfirm={() => {
          if (deleteConfirmId) {
            onDeleteRecord(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

    </div>
  );
};
