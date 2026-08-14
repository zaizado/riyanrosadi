import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Calendar, 
  Plus, 
  FileText,
  Lock,
  ShieldCheck,
  FileCheck,
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
  Info,
  DollarSign, 
  Receipt, 
  Building2, 
  Tag, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import * as XLSX from 'xlsx';
import { FinanceDailyRecord, DailyExpenseItem, UserAccount, checkIsSuperAdmin } from '../types';
import { getLocalDateISO } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';
import { ModalPortal } from './ModalPortal';
import { generateEncryptedFinancePDF } from '../utils/pdfGenerator';

// Robust helper to parse any numeric string or formatted number with dots/commas into integer
export const parseRupiahNum = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

interface FinanceChartProps {
  data: Array<{
    monthKey: string;
    monthLabel: string;
    Pendapatan: number;
    Pengeluaran: number;
    Selisih: number;
  }>;
}

const FinanceChart = React.memo<FinanceChartProps>(({ data }) => {
  const formatRupiahTooltip = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pendapatan = payload.find((p: any) => p.dataKey === 'Pendapatan')?.value || 0;
      const pengeluaran = payload.find((p: any) => p.dataKey === 'Pengeluaran')?.value || 0;
      const selisih = pendapatan - pengeluaran;

      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[210px]">
          <p className="font-extrabold text-amber-300 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>Periode:</span>
            <span className="text-white font-mono">{label}</span>
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="font-sans text-slate-300">Uang COS / Masuk:</span>
              <span className="font-bold">{formatRupiahTooltip(pendapatan)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-400">
              <span className="font-sans text-slate-300">Total Pengeluaran:</span>
              <span className="font-bold">{formatRupiahTooltip(pengeluaran)}</span>
            </div>
            <div className="border-t border-slate-800/80 pt-1 flex items-center justify-between">
              <span className="font-sans text-slate-400 font-semibold">Surplus / Defisit:</span>
              <span className={`font-black ${selisih >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selisih >= 0 ? '+' : ''}{formatRupiahTooltip(selisih)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-56 flex flex-col items-center justify-center text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-slate-800/60 p-6">
        <BarChart3 className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
        <p className="font-semibold text-slate-400">Belum ada rekam transaksi keuangan</p>
        <p className="text-[11px] text-slate-500 mt-1">Grafik batang bulanan akan terbentuk otomatis setelah transaksi kas diinput.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="monthLabel" 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            tickFormatter={(val) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Jt`;
              if (val >= 1000) return `${(val / 1000).toFixed(0)}R`;
              return val;
            }}
          />
          <Tooltip content={<CustomChartTooltip />} />
          <Bar dataKey="Pendapatan" name="Uang COS / Masuk" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={38} />
          <Bar dataKey="Pengeluaran" name="Total Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

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
  const todayStr = useMemo(() => getLocalDateISO(), []);

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
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [exportFilterType, setExportFilterType] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'semua'>('bulanan');
  const [exportSelectedDate, setExportSelectedDate] = useState(todayStr);
  const [exportSelectedMonth, setExportSelectedMonth] = useState(todayStr.slice(0, 7)); // YYYY-MM
  const [exportSelectedYear, setExportSelectedYear] = useState(todayStr.slice(0, 4));
  const [enableEncryptionPassword, setEnableEncryptionPassword] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');

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
      let saldoAwal = parseRupiahNum(rec.saldoAwal);
      if (idx > 0) {
        saldoAwal = previousSaldoAkhir;
      }

      const totalPengeluaran = (rec.pengeluaranItems || []).reduce(
        (sum, item) => sum + parseRupiahNum(item.nominal),
        0
      );
      const uangCos = parseRupiahNum(rec.uangCosMasuk);
      const saldoAkhir = saldoAwal + uangCos - totalPengeluaran;

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
      totalMasukCos += parseRupiahNum(r.uangCosMasuk);
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

  const isSuperAdmin = checkIsSuperAdmin(currentUser);

  // Monthly Chart Aggregation (Pendapatan vs Pengeluaran Bulanan)
  const monthlyChartData = useMemo(() => {
    const monthMap = new Map<string, { pendapatan: number; pengeluaran: number; monthKey: string; monthLabel: string }>();

    sortedRecordsAsc.forEach(rec => {
      if (!rec.tanggal) return;
      const monthKey = rec.tanggal.slice(0, 7); // YYYY-MM
      const computed = cascadedRecordsMap.get(rec.id);
      const pengeluaran = computed ? computed.calculatedTotalPengeluaran : 0;
      const pendapatan = parseRupiahNum(rec.uangCosMasuk);

      if (!monthMap.has(monthKey)) {
        const [year, month] = monthKey.split('-');
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
          'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        const monthIdx = parseInt(month, 10) - 1;
        const monthName = monthNames[monthIdx] || month;
        const label = `${monthName} ${year}`;

        monthMap.set(monthKey, {
          monthKey,
          monthLabel: label,
          pendapatan: 0,
          pengeluaran: 0
        });
      }

      const current = monthMap.get(monthKey)!;
      current.pendapatan += pendapatan;
      current.pengeluaran += pengeluaran;
    });

    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    if (sortedMonths.length === 0) {
      return [];
    }

    return sortedMonths.map(item => ({
      ...item,
      Pendapatan: item.pendapatan,
      Pengeluaran: item.pengeluaran,
      Selisih: item.pendapatan - item.pengeluaran,
    }));
  }, [sortedRecordsAsc, cascadedRecordsMap]);

  // Custom Recharts Tooltip Component
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pendapatan = payload.find((p: any) => p.dataKey === 'Pendapatan')?.value || 0;
      const pengeluaran = payload.find((p: any) => p.dataKey === 'Pengeluaran')?.value || 0;
      const selisih = pendapatan - pengeluaran;

      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[210px]">
          <p className="font-extrabold text-amber-300 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>Periode:</span>
            <span className="text-white font-mono">{label}</span>
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="font-sans text-slate-300">Uang COS / Masuk:</span>
              <span className="font-bold">{formatRupiah(pendapatan)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-400">
              <span className="font-sans text-slate-300">Total Pengeluaran:</span>
              <span className="font-bold">{formatRupiah(pengeluaran)}</span>
            </div>
            <div className="border-t border-slate-800/80 pt-1 flex items-center justify-between">
              <span className="font-sans text-slate-400 font-semibold">Surplus / Defisit:</span>
              <span className={`font-black ${selisih >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selisih >= 0 ? '+' : ''}{formatRupiah(selisih)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
    const dayNum = parseInt((newDateStr || '').split('-')[2], 10);
    setFormData(prev => ({
      ...prev,
      tanggal: newDateStr,
      saldoAwal: prev.isManualSaldoAwal ? prev.saldoAwal : defaultSaldoAwal,
      uangCosMasuk: dayNum === 10 ? prev.uangCosMasuk : 0
    }));
  };

  // Format number helper for input fields with dots (e.g. 100.000)
  const formatNumberWithDots = (val: number | string): string => {
    if (val === '' || val === null || val === undefined) return '';
    const numStr = String(val).replace(/[^0-9]/g, '');
    if (!numStr) return '';
    return parseInt(numStr, 10).toLocaleString('id-ID');
  };

  // Add Expense item inside form
  const handleAddExpenseItem = () => {
    const nom = parseRupiahNum(expenseForm.nominal);
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

    // Ensure all existing items have numeric nominals
    let finalExpenseItems = (formData.pengeluaranItems || []).map(item => ({
      ...item,
      nominal: parseRupiahNum(item.nominal)
    }));

    // Auto-append pending expense item if user filled the expense input but forgot to click "+ Tambah"
    const pendingNominal = parseRupiahNum(expenseForm.nominal);
    if (pendingNominal > 0 && expenseForm.keterangan.trim()) {
      finalExpenseItems.push({
        id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        waktu: expenseForm.waktu || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        nominal: pendingNominal,
        keterangan: expenseForm.keterangan.trim(),
        kategori: expenseForm.kategori,
        penerimaNota: expenseForm.penerimaNota.trim() || '-',
        updatedBy: currentUser.name
      });
    }

    const dayNum = parseInt((formData.tanggal || '').split('-')[2], 10);
    const isCosAllowed = dayNum === 10;
    const finalUangCos = isCosAllowed ? parseRupiahNum(formData.uangCosMasuk) : 0;

    const recordToSave: FinanceDailyRecord = {
      id: formData.id || `fin-${formData.tanggal}`,
      tanggal: formData.tanggal,
      saldoAwal: parseRupiahNum(formData.saldoAwal),
      uangCosMasuk: finalUangCos,
      keteranganCos: isCosAllowed ? formData.keteranganCos.trim() : (formData.keteranganCos || 'Bukan Tanggal 10 (Tanpa COS)').trim(),
      pengeluaranItems: finalExpenseItems,
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

  // Export to PDF Function (Terenkripsi & Terverifikasi)
  const handleExportPDF = () => {
    let recordsToExport: FinanceDailyRecord[] = [];
    let periodLabel = '';

    if (exportFilterType === 'harian') {
      recordsToExport = sortedRecordsAsc.filter(r => r.tanggal === exportSelectedDate);
      periodLabel = `Harian - Tanggal ${exportSelectedDate}`;
    } else if (exportFilterType === 'mingguan') {
      const endDt = new Date(exportSelectedDate);
      const startDt = new Date(endDt);
      startDt.setDate(startDt.getDate() - 6);

      const startStr = getLocalDateISO(startDt);
      const endStr = getLocalDateISO(endDt);

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

    generateEncryptedFinancePDF({
      records: recordsToExport,
      cascadedMap: cascadedRecordsMap,
      periodLabel,
      currentUser,
      enableEncryptionPassword,
      userPassword: pdfPassword
    });

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
                DIVISI DANA DAN USAHA
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pencatatan Saldo Awal, Uang COS Masuk, Pengeluaran Harian & Reorganisasi Kas Otomatis
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer border border-rose-500/40"
          >
            <FileText className="w-4 h-4 text-rose-200" />
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Ekspor PDF Terenkripsi</span>
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

      {/* ------------------- GRAFIK BATANG PENDAPATAN VS PENGELUARAN (Super Admin) ------------------- */}
      {isSuperAdmin && (
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-wide">
                    Grafik Batang Pendapatan vs Pengeluaran Bulanan
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                    Super Admin Analytics
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Perbandingan visual Uang COS Masuk (Pendapatan) dan Pengeluaran Harian per periode bulan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block shadow-xs shadow-emerald-500/50"></span>
                <span className="text-slate-300 font-bold">Uang COS / Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block shadow-xs shadow-rose-500/50"></span>
                <span className="text-slate-300 font-bold">Pengeluaran</span>
              </div>
            </div>
          </div>

          <FinanceChart data={monthlyChartData} />
        </div>
      )}

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
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white shadow-2xl relative max-w-2xl">
            
            {/* Header - Fixed top */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {formData.id ? 'Edit Transaksi Keuangan Harian' : 'Input Transaksi Keuangan Hari Ini'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Pencatatan Saldo Awal, COS Masuk, & Item Pengeluaran Harian</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body - Scrollable */}
            <form id="daily-transaction-form" onSubmit={handleSaveForm} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
              
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
                    type="text"
                    inputMode="numeric"
                    required
                    readOnly={!formData.isManualSaldoAwal}
                    value={formatNumberWithDots(formData.saldoAwal)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setFormData(p => ({ ...p, saldoAwal: raw ? parseInt(raw, 10) : 0 }));
                    }}
                    placeholder="0"
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
                  <span className="font-extrabold uppercase text-[11px] flex items-center gap-1.5 text-emerald-400">
                    <TrendingUp className="w-4 h-4" /> 2. Uang COS / Pemasukan Kas
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border bg-emerald-900/60 text-emerald-300 border-emerald-700/50">
                    ✓ Pemasukan Kas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Nominal Uang COS Masuk (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberWithDots(formData.uangCosMasuk)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setFormData(p => ({ ...p, uangCosMasuk: raw ? parseInt(raw, 10) : 0 }));
                      }}
                      placeholder="Contoh: 2.500.000"
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
                      placeholder="Contoh: COS Anggota Bulan Ini"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">TOTAL PEMASUKAN HARI INI (Saldo Awal + COS):</span>
                  <span className="text-blue-300 font-mono text-sm">
                    {formatRupiah(parseRupiahNum(formData.saldoAwal) + parseRupiahNum(formData.uangCosMasuk))}
                  </span>
                </div>
              </div>

              {/* 3. SECTION PENGELUARAN HARIAN & LIVE CALCULATIONS */}
              {(() => {
                const pendingExpense = parseRupiahNum(expenseForm.nominal);
                const addedExpenses = formData.pengeluaranItems.reduce((s, i) => s + parseRupiahNum(i.nominal), 0);
                const totalExpensesLive = addedExpenses + pendingExpense;
                const liveSaldoAwal = parseRupiahNum(formData.saldoAwal);
                const liveUangCos = parseRupiahNum(formData.uangCosMasuk);
                const liveSaldoAkhir = liveSaldoAwal + liveUangCos - totalExpensesLive;

                return (
                  <>
                    <div className="p-3.5 bg-rose-950/30 border border-rose-800/50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-rose-400 uppercase text-[11px] flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4" /> 3. Menu Pengeluaran Harian
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Total Pengeluaran: <strong className="text-rose-300 font-mono text-xs font-bold">{formatRupiah(totalExpensesLive)}</strong>
                        </span>
                      </div>

                      {/* Sub-form Input Item Pengeluaran */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          + Form Tambah Item Pengeluaran Hari Ini (Otomatis Tanda Titik):
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                              type="text"
                              inputMode="numeric"
                              placeholder="Nominal Keluar (Rp)"
                              value={expenseForm.nominal}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                const formatted = raw ? parseInt(raw, 10).toLocaleString('id-ID') : '';
                                setExpenseForm(p => ({ ...p, nominal: formatted }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddExpenseItem();
                                }
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-rose-300 font-bold text-xs placeholder:text-rose-900/60 focus:outline-none focus:border-rose-500"
                            />
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Keterangan pengeluaran (Tekan Enter untuk menyimpan item)..."
                            value={expenseForm.keterangan}
                            onChange={(e) => setExpenseForm(p => ({ ...p, keterangan: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddExpenseItem();
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                      </div>

                      {/* List items added */}
                      {formData.pengeluaranItems.length > 0 && (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {formData.pengeluaranItems.map((item) => (
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
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between font-black text-xs shadow-inner">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-300 uppercase tracking-wide">PREVIEW SALDO AKHIR HARI INI:</span>
                        {pendingExpense > 0 && (
                          <span className="text-[10px] font-normal text-rose-300 italic">
                            (Berkurang -{formatRupiah(pendingExpense)} dari input)
                          </span>
                        )}
                      </div>
                      <span className="text-amber-400 font-mono text-lg tracking-tight">
                        {formatRupiah(liveSaldoAkhir)}
                      </span>
                    </div>
                  </>
                );
              })()}

            </form>

            {/* Footer - Fixed bottom */}
            <div className="p-4 sm:p-5 pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 bg-slate-900 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="daily-transaction-form"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-900/40"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Transaksi Keuangan</span>
              </button>
            </div>

          </div>
        </div>
        </ModalPortal>
      )}

      {/* ------------------- MODAL DETAIL RECORD ------------------- */}
      {selectedRecordForDetail && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-4 sm:p-6 shadow-2xl relative max-w-xl">
            <button
              onClick={() => setSelectedRecordForDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white z-10"
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
        </ModalPortal>
      )}

      {/* ------------------- MODAL EKSPOR LAPORAN PDF TERENKRIPSI ------------------- */}
      {isExportModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-4 sm:p-6 shadow-2xl relative max-w-lg">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Ekspor PDF Terenkripsi</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    Transparan
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Dokumen Resmi & Proteksi Laporan Divisi Dana & Usaha</p>
              </div>
            </div>

            <div className="py-4 space-y-4 text-xs">
              
              {/* Filter Periode */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  1. Pilih Rentang Periode Laporan:
                </label>
                <select
                  value={exportFilterType}
                  onChange={(e: any) => setExportFilterType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Security Details for PDF */}
              <div className="p-3.5 bg-slate-950 border border-rose-900/50 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Fitur Keamanan & Transparansi PDF:</span>
                </div>
                
                <div className="space-y-1 text-[11px] text-slate-300 pl-1">
                  <p className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>SHA-256 Digital Fingerprint:</strong> Kode hash otomatis untuk verifikasi keaslian dokumen.</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Segel Watermark & Read-Only:</strong> Mencegah modifikasi isi/angka laporan oleh pihak luar.</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Kolom Pengesahan Resmi:</strong> Tanda tangan Ketua, Bendahara/Divisi Dana & Sekretaris.</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={enableEncryptionPassword}
                      onChange={(e) => setEnableEncryptionPassword(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Gunakan Password Proteksi PDF</span>
                  </label>
                </div>

                {enableEncryptionPassword && (
                  <div className="pt-1">
                    <input
                      type="password"
                      placeholder="Masukkan password/PIN untuk buka PDF..."
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Kosongkan jika hanya ingin enkripsi Read-Only tanpa password pembuka.</p>
                  </div>
                )}
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
                onClick={handleExportPDF}
                className="px-5 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-all bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-rose-950/50"
              >
                <FileText className="w-4 h-4" />
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Download PDF Terenkripsi</span>
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
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
