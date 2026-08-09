import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Gift, 
  QrCode, 
  Camera, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  UserX, 
  FileSpreadsheet, 
  Plus, 
  X, 
  RefreshCw, 
  Download, 
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import { Html5Qrcode } from 'html5-qrcode';
import { SembakoEvent, SembakoClaim, Member, UserAccount, checkIsSuperAdmin } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface SembakoModuleProps {
  sembakoEvents: SembakoEvent[];
  sembakoClaims: SembakoClaim[];
  members: Member[];
  onAddEvent: (newEvent: SembakoEvent, initialClaims: SembakoClaim[]) => void;
  onUpdateClaim: (updatedClaim: SembakoClaim) => void;
  onDeleteEvent?: (eventId: string) => void;
  onDeleteClaim?: (claimId: string) => void;
  currentUser: UserAccount;
}

export const SembakoModule: React.FC<SembakoModuleProps> = ({
  sembakoEvents,
  sembakoClaims,
  members,
  onAddEvent,
  onUpdateClaim,
  onDeleteEvent,
  onDeleteClaim,
  currentUser,
}) => {
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const activeEvent = sembakoEvents.find(e => e.status === 'Aktif') || sembakoEvents[0];
  
  const [selectedEventId, setSelectedEventId] = useState<string>(activeEvent?.id || '');

  useEffect(() => {
    if (sembakoEvents.length > 0 && (!selectedEventId || !sembakoEvents.some(e => e.id === selectedEventId))) {
      const defaultEv = sembakoEvents.find(e => e.status === 'Aktif') || sembakoEvents[0];
      if (defaultEv) {
        setSelectedEventId(defaultEv.id);
      }
    }
  }, [sembakoEvents, selectedEventId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Belum Ambil' | 'Sudah Ambil'>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Scanner & Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [selectedClaimForQrModal, setSelectedClaimForQrModal] = useState<SembakoClaim | null>(null);

  // Deletion modal states
  const [deleteEventConfirmObj, setDeleteEventConfirmObj] = useState<SembakoEvent | null>(null);
  const [deleteClaimConfirmObj, setDeleteClaimConfirmObj] = useState<SembakoClaim | null>(null);
  const [resetClaimConfirmObj, setResetClaimConfirmObj] = useState<SembakoClaim | null>(null);

  // Scan result popup feedback state
  const [scanResultFeedback, setScanResultFeedback] = useState<{
    type: 'success' | 'already_claimed' | 'invalid';
    claim?: SembakoClaim;
    message?: string;
  } | null>(null);

  // Simulation Manual Scan Selector / Input
  const [manualCodeInput, setManualCodeInput] = useState('');

  // New Event Form State
  const [newEventNama, setNewEventNama] = useState('');
  const [newEventTanggal, setNewEventTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [newEventLokasi, setNewEventLokasi] = useState('Sekretariat SBN KASBI PT VCI');
  const [newEventJenisPaket, setNewEventJenisPaket] = useState('Paket Beras 10kg + Minyak Goreng 2L + Gula 1kg');
  const [newEventKeterangan, setNewEventKeterangan] = useState('Khusus Anggota Aktif SBN KASBI PT Victory Chingluh Indonesia.');

  const currentEventObj = sembakoEvents.find(e => e.id === selectedEventId) || activeEvent;

  // Filtered Claims
  const currentClaims = useMemo(() => {
    return sembakoClaims.filter(c => c.eventId === currentEventObj?.id);
  }, [sembakoClaims, currentEventObj?.id]);

  const filteredClaims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return currentClaims.filter((clm) => {
      const matchSearch = !q ||
        clm.namaLengkap.toLowerCase().includes(q) ||
        clm.nomorAnggota.toLowerCase().includes(q) ||
        clm.nik.toLowerCase().includes(q) ||
        clm.departemen.toLowerCase().includes(q) ||
        clm.bagian.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'All' || clm.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [currentClaims, searchQuery, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedEventId, pageSize]);

  // Paginated Claims
  const totalPages = Math.max(1, Math.ceil(filteredClaims.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedClaims = useMemo(() => {
    return filteredClaims.slice(startIndex, startIndex + pageSize);
  }, [filteredClaims, startIndex, pageSize]);

  const totalPenerima = currentClaims.length;
  const totalSudahAmbil = currentClaims.filter(c => c.status === 'Sudah Ambil').length;
  const totalBelumAmbil = totalPenerima - totalSudahAmbil;
  const claimPercentage = totalPenerima > 0 ? Math.round((totalSudahAmbil / totalPenerima) * 100) : 0;

  // Handle Scanning logic (Works for both camera feed & manual input)
  const processQrCodeScan = (scannedToken: string) => {
    if (!currentEventObj) {
      setScanResultFeedback({
        type: 'invalid',
        message: 'Tidak ada event pembagian sembako aktif.'
      });
      return;
    }

    // Search for claim in current event by matching QR code token or member number
    const targetClaim = currentClaims.find(c => 
      c.qrCode === scannedToken || 
      c.nomorAnggota.toLowerCase() === scannedToken.trim().toLowerCase() ||
      c.nik.toLowerCase() === scannedToken.trim().toLowerCase()
    );

    if (!targetClaim) {
      setScanResultFeedback({
        type: 'invalid',
        message: `QR Code '${scannedToken}' tidak ditemukan pada daftar penerima event ini!`
      });
      return;
    }

    if (targetClaim.status === 'Sudah Ambil') {
      // Already claimed anti-duplicate notification
      setScanResultFeedback({
        type: 'already_claimed',
        claim: targetClaim,
        message: `PERINGATAN: Sembako ini sudah diambil sebelumnya pada ${targetClaim.waktuPengambilan} oleh Petugas: ${targetClaim.petugasScan}`
      });
      return;
    }

    // Success claim update
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

    const updatedClaim: SembakoClaim = {
      ...targetClaim,
      status: 'Sudah Ambil',
      waktuPengambilan: formattedTimestamp,
      petugasScan: currentUser.name
    };

    onUpdateClaim(updatedClaim);

    // Trigger Celebration Confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setScanResultFeedback({
      type: 'success',
      claim: updatedClaim,
      message: `BERHASIL! Sembako diserahkan kepada ${updatedClaim.namaLengkap} (${updatedClaim.nomorAnggota}).`
    });
  };

  // HTML5 Camera Scanner Integration
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isScannerOpen) {
      setCameraError(null);
      let scannerInstance: Html5Qrcode | null = null;

      const timeout = setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          scannerInstance = html5QrCode;
          html5QrCodeRef.current = html5QrCode;

          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              processQrCodeScan(decodedText);
              html5QrCode.stop().then(() => {
                setIsScannerOpen(false);
              }).catch(() => {
                setIsScannerOpen(false);
              });
            },
            () => {
              // Ignore frame noise
            }
          ).catch((err) => {
            console.error("Camera error:", err);
            setCameraError("Kamera HP tidak dapat diakses atau izin ditolak. Pastikan memberi izin kamera pada browser HP anda (Chrome/Safari) dan buka melalui Link Mandiri.");
          });
        } catch (e) {
          console.error("Scanner initialization error:", e);
          setCameraError("Gagal menginisialisasi kamera.");
        }
      }, 300);

      return () => {
        clearTimeout(timeout);
        if (scannerInstance) {
          if (scannerInstance.isScanning) {
            scannerInstance.stop().catch(() => {}).then(() => {
              try { scannerInstance?.clear(); } catch (e) {}
            });
          } else {
            try { scannerInstance.clear(); } catch (e) {}
          }
        }
      };
    }
  }, [isScannerOpen]);

  // Create Event Handler
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !newEventNama) return;

    const eventId = `smb-${Date.now()}`;
    const activeMembers = members.filter(m => m.statusKeanggotaan === 'Aktif');

    const newEventObj: SembakoEvent = {
      id: eventId,
      namaEvent: newEventNama,
      tanggal: newEventTanggal,
      lokasi: newEventLokasi,
      jenisPaket: newEventJenisPaket,
      keterangan: newEventKeterangan,
      status: 'Aktif',
      totalPenerima: activeMembers.length,
      totalSudahAmbil: 0
    };

    // Auto-generate claims with unique QR for every active member
    const initialClaimsList: SembakoClaim[] = activeMembers.map((m, idx) => ({
      id: `clm-${Date.now()}-${idx}`,
      eventId,
      memberId: m.id,
      nomorAnggota: m.nomorAnggota,
      nik: m.nik,
      namaLengkap: m.namaLengkap,
      departemen: m.departemen,
      bagian: m.bagian,
      qrCode: `${eventId}:${m.nomorAnggota}:${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'Belum Ambil'
    }));

    onAddEvent(newEventObj, initialClaimsList);
    setSelectedEventId(eventId);
    setIsCreateEventModalOpen(false);

    // Reset Form
    setNewEventNama('');
  };

  // Export Distribution Report
  const handleExportReport = () => {
    if (!currentEventObj) return;

    const exportRows = currentClaims.map((c, idx) => ({
      'No': idx + 1,
      'Nomor Anggota': c.nomorAnggota,
      'NIK': c.nik,
      'Nama Penerima': c.namaLengkap,
      'Departemen': c.departemen,
      'Bagian': c.bagian,
      'Status Pengambilan': c.status,
      'Waktu Pengambilan': c.waktuPengambilan || '-',
      'Petugas Scan': c.petugasScan || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Sembako');
    XLSX.writeFile(workbook, `Laporan_Sembako_${currentEventObj.namaEvent.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-950 text-red-400 border border-red-800/40">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Pembagian Sembako Digital</h1>
            <p className="text-xs text-slate-400">Pengelolaan Distribusi Bantuan Sembako SBN KASBI via QR Code</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <button
              onClick={() => setIsCreateEventModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-red-400" />
              Buat Event Sembako Baru
            </button>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-900/40 flex items-center gap-2 transition-all animate-pulse cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Scan QR Code Kamera
          </button>
        </div>
      </div>

      {/* Select Active Event Card & Distribution Progress Stats */}
      {currentEventObj && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-red-900/40 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-600 text-white rounded uppercase">
                  Event Terpilih
                </span>
                <span className="text-xs text-slate-400">{currentEventObj.tanggal} • {currentEventObj.lokasi}</span>
              </div>
              <h2 className="text-lg font-black text-white">{currentEventObj.namaEvent}</h2>
              <p className="text-xs text-slate-300 mt-0.5">{currentEventObj.jenisPaket}</p>
            </div>

            {/* Event selector dropdown & Delete button */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {sembakoEvents.length > 1 && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Pilih Event Sembako</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    {sembakoEvents.map(e => <option key={e.id} value={e.id}>{e.namaEvent}</option>)}
                  </select>
                </div>
              )}

              {onDeleteEvent && currentEventObj && checkIsSuperAdmin(currentUser) && (
                <div className="pt-4 md:pt-0">
                  <button
                    onClick={() => setDeleteEventConfirmObj(currentEventObj)}
                    className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Hapus Event Sembako yang Sudah Selesai / Arsip (Khusus Super Admin)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Hapus Event Sembako</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold">Total Berhak Penerima</p>
              <p className="text-xl font-black text-white">{totalPenerima}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold">Sudah Mengambil</p>
              <p className="text-xl font-black text-emerald-400">{totalSudahAmbil}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold">Belum Mengambil</p>
              <p className="text-xl font-black text-amber-400">{totalBelumAmbil}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold">Persentase Terdistribusi</p>
              <p className="text-xl font-black text-red-400">{claimPercentage}%</p>
            </div>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${claimPercentage}%` }}
            />
          </div>

        </div>
      )}

      {/* Manual Test Scan & Fast Simulator Toolbar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari penerima berdasarkan Nama, NIK, No. Anggota, atau Departemen..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${statusFilter === 'All' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
            >
              Semua ({totalPenerima})
            </button>
            <button
              onClick={() => setStatusFilter('Belum Ambil')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${statusFilter === 'Belum Ambil' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
            >
              Belum ({totalBelumAmbil})
            </button>
            <button
              onClick={() => setStatusFilter('Sudah Ambil')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${statusFilter === 'Sudah Ambil' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
            >
              Sudah ({totalSudahAmbil})
            </button>

            <button
              onClick={handleExportReport}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Laporan
            </button>
          </div>
        </div>

        {/* Quick Simulator Input Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap hidden sm:inline">Simulasi Scan Manual:</span>
          <input
            type="text"
            value={manualCodeInput}
            onChange={(e) => setManualCodeInput(e.target.value)}
            placeholder="Masukkan No. Anggota (misal SBN-VCI-0004) atau NIK..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <button
            onClick={() => {
              if (!manualCodeInput) return;
              processQrCodeScan(manualCodeInput);
              setManualCodeInput('');
            }}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs"
          >
            Proses Scan
          </button>
        </div>
      </div>

      {/* Recipient Claims Table View */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Penerima Anggota</th>
                <th className="p-3.5">Departemen & Bagian</th>
                <th className="p-3.5">Status Pengambilan</th>
                <th className="p-3.5">Waktu & Petugas Scan</th>
                <th className="p-3.5 text-right">QR Coupon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedClaims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                    Tidak ditemukan data penerima sembako.
                  </td>
                </tr>
              ) : (
                paginatedClaims.map((clm) => (
                  <tr key={clm.id} className="hover:bg-slate-850/60 transition-colors">
                    
                    <td className="p-3.5">
                      <p className="font-bold text-slate-100 text-sm">{clm.namaLengkap}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        <strong className="text-red-400">{clm.nomorAnggota}</strong> • NIK: {clm.nik}
                      </p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-slate-200">{clm.departemen}</p>
                      <p className="text-[11px] text-slate-400">{clm.bagian}</p>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit ${
                        clm.status === 'Sudah Ambil' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}>
                        {clm.status === 'Sudah Ambil' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {clm.status}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {clm.status === 'Sudah Ambil' ? (
                        <div>
                          <p className="font-semibold text-emerald-400">{clm.waktuPengambilan}</p>
                          <p className="text-[10px] text-slate-400">Petugas: {clm.petugasScan}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Belum Dipindai</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {clm.status === 'Belum Ambil' ? (
                          <button
                            onClick={() => processQrCodeScan(clm.qrCode)}
                            className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg border border-red-500/40 text-[11px] font-bold cursor-pointer"
                            title="Simulasi Klaim Sembako"
                          >
                            Klaim Langsung
                          </button>
                        ) : (
                          <button
                            onClick={() => setResetClaimConfirmObj(clm)}
                            className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded-lg text-[10px] font-bold cursor-pointer"
                            title="Reset status ke Belum Ambil"
                          >
                            Reset Klaim
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedClaimForQrModal(clm)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                          title="Tampilkan Kupon QR Code"
                        >
                          <QrCode className="w-4 h-4 text-red-400" />
                        </button>

                        {onDeleteClaim && isSuperAdmin && (
                          <button
                            onClick={() => setDeleteClaimConfirmObj(clm)}
                            className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-400 border border-rose-800/60 transition-colors cursor-pointer"
                            title="Hapus Penerima Sembako"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Tampilkan per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 font-medium">
              Menampilkan {filteredClaims.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + pageSize, filteredClaims.length)} dari {filteredClaims.length} penerima
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-bold text-xs">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* LIVE CAMERA QR SCANNER MODAL */}
      {isScannerOpen && (
        <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-md">
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4 space-y-1">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mx-auto mb-2 border border-red-500/30">
                <Camera className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white">Pemindaian QR Code Sembako</h2>
              <p className="text-xs text-slate-400">Arahkan kamera ke QR Code pada HP Anggota / Kartu Digital SBN</p>
            </div>

            {cameraError && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Petunjuk Akses Kamera HP:</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  {cameraError}
                </p>
                <div className="pt-1 text-[10px] text-amber-400/80 border-t border-amber-500/20 space-y-0.5">
                  <p>1. Tekan <b>"Izinkan / Allow"</b> saat browser HP meminta akses kamera.</p>
                  <p>2. Pastikan membuka via <b>Link Mandiri / Aplikasi Terpasang</b> di HP Anda.</p>
                </div>
              </div>
            )}

            <div id="reader" className="overflow-hidden rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-300 min-h-[200px]" />

            {/* Input Manual / Barcode Scanner Input */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 block">
                Atau Ketik Manual / Gunakan USB Barcode Scanner:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCodeInput.trim()) {
                      processQrCodeScan(manualCodeInput.trim());
                      setManualCodeInput('');
                      setIsScannerOpen(false);
                    }
                  }}
                  placeholder="Ketik NIK, No. Anggota, atau Kode QR..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualCodeInput.trim()) {
                      processQrCodeScan(manualCodeInput.trim());
                      setManualCodeInput('');
                      setIsScannerOpen(false);
                    }
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  Proses
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SCAN FEEDBACK ALERT POPUP MODAL */}
      {scanResultFeedback && (
        <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative text-center space-y-4 max-w-md">
            
            {scanResultFeedback.type === 'success' && (
              <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            )}

            {scanResultFeedback.type === 'already_claimed' && (
              <div className="w-16 h-16 rounded-full bg-amber-950 text-amber-400 border-2 border-amber-500 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <AlertTriangle className="w-10 h-10" />
              </div>
            )}

            {scanResultFeedback.type === 'invalid' && (
              <div className="w-16 h-16 rounded-full bg-rose-950 text-rose-400 border-2 border-rose-500 flex items-center justify-center mx-auto shadow-lg">
                <X className="w-10 h-10" />
              </div>
            )}

            <div>
              <h3 className={`text-lg font-black ${
                scanResultFeedback.type === 'success' ? 'text-emerald-400' :
                scanResultFeedback.type === 'already_claimed' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {scanResultFeedback.type === 'success' ? 'Sembako Berhasil Diambil!' :
                 scanResultFeedback.type === 'already_claimed' ? 'Bantuan Sudah Diterima Sebelumnya!' : 'QR Code Tidak Valid!'}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                {scanResultFeedback.message}
              </p>
            </div>

            {scanResultFeedback.claim && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-left space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold">Detail Anggota Penerima:</p>
                <p className="font-bold text-white">{scanResultFeedback.claim.namaLengkap} ({scanResultFeedback.claim.nomorAnggota})</p>
                <p className="text-slate-300">Dept: {scanResultFeedback.claim.departemen} - Bagian: {scanResultFeedback.claim.bagian}</p>
              </div>
            )}

            <button
              onClick={() => setScanResultFeedback(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Tutup & Lanjutkan Scan
            </button>

          </div>
        </div>
      )}

      {/* MEMBER QR CODE COUPON POPUP MODAL */}
      {selectedClaimForQrModal && (
        <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative text-center space-y-4 max-w-sm">
            <button
              onClick={() => setSelectedClaimForQrModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-3">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-red-600 text-white rounded uppercase">
                Kupon Sembako Digital SBN
              </span>
              <h3 className="text-base font-bold text-white mt-1">{selectedClaimForQrModal.namaLengkap}</h3>
              <p className="text-xs text-slate-400">{selectedClaimForQrModal.nomorAnggota} • NIK: {selectedClaimForQrModal.nik}</p>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
              <QRCodeSVG 
                value={selectedClaimForQrModal.qrCode} 
                size={180} 
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-mono text-[10px] text-slate-400 break-all">{selectedClaimForQrModal.qrCode}</p>
              <p className="text-[11px] text-amber-400 font-semibold">Status: {selectedClaimForQrModal.status}</p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedClaimForQrModal(null)}
                className="w-full py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isCreateEventModalOpen && (
        <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-md">
            <button
              onClick={() => setIsCreateEventModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">Buat Event Distribusi Sembako Baru</h2>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Event Sembako</label>
                <input
                  type="text"
                  value={newEventNama}
                  onChange={(e) => setNewEventNama(e.target.value)}
                  placeholder="Misal: Pembagian Sembako Hari Buruh May Day 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    value={newEventTanggal}
                    onChange={(e) => setNewEventTanggal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Lokasi Pembagian</label>
                  <input
                    type="text"
                    value={newEventLokasi}
                    onChange={(e) => setNewEventLokasi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Rincian Jenis Paket Sembako</label>
                <input
                  type="text"
                  value={newEventJenisPaket}
                  onChange={(e) => setNewEventJenisPaket(e.target.value)}
                  placeholder="Beras 10kg + Minyak + Gula + Terigu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Keterangan / Syarat Pengambilan</label>
                <textarea
                  rows={2}
                  value={newEventKeterangan}
                  onChange={(e) => setNewEventKeterangan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Buat Event & Generate QR All Member
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE EVENT MODAL */}
      <ConfirmModal
        isOpen={!!deleteEventConfirmObj}
        title="Hapus Event Sembako"
        message={`Apakah Anda yakin ingin menghapus Event Sembako "${deleteEventConfirmObj?.namaEvent}" beserta seluruh data klaim anggotanya? Data ini akan dihapus secara permanen.`}
        confirmText="Ya, Hapus Event Permanen"
        cancelText="Batal"
        type="danger"
        icon="trash"
        onConfirm={() => {
          if (deleteEventConfirmObj && onDeleteEvent) {
            onDeleteEvent(deleteEventConfirmObj.id);
            setDeleteEventConfirmObj(null);
          }
        }}
        onCancel={() => setDeleteEventConfirmObj(null)}
      />

      {/* CONFIRM DELETE CLAIM MODAL */}
      <ConfirmModal
        isOpen={!!deleteClaimConfirmObj}
        title="Hapus Penerima Sembako"
        message={`Apakah Anda yakin ingin menghapus ${deleteClaimConfirmObj?.namaLengkap} (${deleteClaimConfirmObj?.nomorAnggota}) dari daftar penerima event ini?`}
        confirmText="Ya, Hapus Penerima"
        cancelText="Batal"
        type="danger"
        icon="trash"
        onConfirm={() => {
          if (deleteClaimConfirmObj && onDeleteClaim) {
            onDeleteClaim(deleteClaimConfirmObj.id);
            setDeleteClaimConfirmObj(null);
          }
        }}
        onCancel={() => setDeleteClaimConfirmObj(null)}
      />

      {/* CONFIRM RESET CLAIM MODAL */}
      <ConfirmModal
        isOpen={!!resetClaimConfirmObj}
        title="Reset Status Klaim Sembako"
        message={`Batalkan / reset status klaim sembako untuk ${resetClaimConfirmObj?.namaLengkap}? Status akan dikembalikan menjadi 'Belum Ambil'.`}
        confirmText="Ya, Reset Klaim"
        cancelText="Batal"
        type="warning"
        icon="warning"
        onConfirm={() => {
          if (resetClaimConfirmObj) {
            onUpdateClaim({
              ...resetClaimConfirmObj,
              status: 'Belum Ambil',
              waktuPengambilan: undefined,
              petugasScan: undefined,
            });
            setResetClaimConfirmObj(null);
          }
        }}
        onCancel={() => setResetClaimConfirmObj(null)}
      />

    </div>
  );
};
