import React, { useState } from 'react';
import { 
  X, 
  HeartPulse, 
  User, 
  Users, 
  MapPin, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Car, 
  Coins, 
  ShieldCheck, 
  FileCheck, 
  MessageSquare, 
  Share2, 
  Send, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowRight,
  Info,
  CheckSquare,
  Square,
  Activity,
  BedDouble,
  Home
} from 'lucide-react';
import { 
  SickVisit, 
  SickVisitStatus, 
  UserAccount, 
  SickVisitLog, 
  TransportasiType, 
  HasilPendampinganType,
  WilayahTujuan
} from '../../types';
import { AkomodasiCalculatorCard } from './AkomodasiCalculatorCard';
import { hitungAkomodasiSOP } from '../../utils/sickVisitUtils';
import { getLocalDateISO } from '../../utils/dateUtils';

interface SickVisitDetailModalProps {
  visit: SickVisit;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedVisit: SickVisit, actionName: string, auditDetail: string) => void;
  onDelete?: (id: string) => void;
  currentUser: UserAccount;
  onRequestVehicle?: (draft: any) => void;
}

type TabType = 'ringkasan' | 'koordinasi' | 'penugasan' | 'pelaksanaan' | 'hasil' | 'akomodasi' | 'log';

export const SickVisitDetailModal: React.FC<SickVisitDetailModalProps> = ({
  visit,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  currentUser,
  onRequestVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ringkasan');

  // Local state for editing/action inputs
  // Koordinasi State
  const [dikoordinasikanDengan, setDikoordinasikanDengan] = useState(visit.dikoordinasikanDengan || 'Ketua & Sekretaris PTP');
  const [catatanKoordinasi, setCatatanKoordinasi] = useState(visit.catatanKoordinasi || '');
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Penugasan State
  const [petugas1, setPetugas1] = useState(visit.petugas1 || currentUser.name);
  const [petugas2, setPetugas2] = useState(visit.petugas2 || '');
  const [isMenggunakanKoorlap, setIsMenggunakanKoorlap] = useState(visit.isMenggunakanKoorlap || false);
  const [alasanPenggunaanKoorlap, setAlasanPenggunaanKoorlap] = useState(visit.alasanPenggunaanKoorlap || '');
  const [transportasi, setTransportasi] = useState<TransportasiType>(visit.transportasi || 'Mobil Operasional');
  const [kendaraanOperasional, setKendaraanOperasional] = useState(visit.kendaraanOperasionalDigunakan || 'Mitsubishi Xpander (B 1928 SBN)');
  const [alasanGrab, setAlasanGrab] = useState(visit.alasanGrab || '');
  const [catatanPenugasan, setCatatanPenugasan] = useState(visit.catatanPenugasan || '');

  // Pelaksanaan State
  const [waktuBerangkat, setWaktuBerangkat] = useState(visit.waktuBerangkat || '');
  const [waktuTiba, setWaktuTiba] = useState(visit.waktuTiba || '');
  const [catatanPelaksanaan, setCatatanPelaksanaan] = useState(visit.catatanPelaksanaan || '');
  const [checklistBantuan, setChecklistBantuan] = useState({
    administrasiRs: visit.checklistBantuan?.administrasiRs ?? true,
    prosesPendaftaran: visit.checklistBantuan?.prosesPendaftaran ?? true,
    koordinasiRsKeluarga: visit.checklistBantuan?.koordinasiRsKeluarga ?? true,
  });

  // Hasil State
  const [hasilPendampingan, setHasilPendampingan] = useState<HasilPendampinganType>(visit.hasilPendampingan || 'Belum Ditentukan');
  const [ruangPerawatan, setRuangPerawatan] = useState(visit.ruangPerawatan || '');
  const [catatanHasil, setCatatanHasil] = useState(visit.catatanHasil || '');

  // Penjemputan State (Tahap 10)
  const [isButuhPenjemputan, setIsButuhPenjemputan] = useState(visit.penjemputanPascaRawatInap?.isDibutuhkan ?? false);
  const [tanggalPenjemputan, setTanggalPenjemputan] = useState(visit.penjemputanPascaRawatInap?.tanggalPenjemputan || '');
  const [petugasPenjemputan, setPetugasPenjemputan] = useState(visit.penjemputanPascaRawatInap?.petugasPenjemputan || '');
  const [transportasiPenjemputan, setTransportasiPenjemputan] = useState<TransportasiType>(visit.penjemputanPascaRawatInap?.transportasi || 'Mobil Operasional');
  const [statusPenjemputan, setStatusPenjemputan] = useState<'Belum Dijemput' | 'Sudah Dijemput' | 'Tidak Membutuhkan Penjemputan'>(
    visit.penjemputanPascaRawatInap?.status || 'Belum Dijemput'
  );
  const [catatanPenjemputan, setCatatanPenjemputan] = useState(visit.penjemputanPascaRawatInap?.catatan || '');

  // Akomodasi & Gratifikasi & Laporan PTP State
  const [isLuarJamKerja, setIsLuarJamKerja] = useState(visit.akomodasi?.isLuarJamKerja || false);
  const [pernyataanBebasGratifikasi, setPernyataanBebasGratifikasi] = useState(visit.pernyataanBebasGratifikasi || false);
  const [sudahLaporGrupPtp, setSudahLaporGrupPtp] = useState(visit.sudahLaporGrupPtp || false);

  // Log Baru State
  const [newLogCatatan, setNewLogCatatan] = useState('');
  const [newLogKondisi, setNewLogKondisi] = useState('');

  if (!isOpen) return null;

  const countPetugasCurrent = [petugas1, petugas2].filter(Boolean).length || 1;
  const isLuarMitra = !visit.isRsKerjaSama;
  const wilayahRs = (visit.akomodasi?.wilayah || 'Tangerang') as WilayahTujuan;

  // Real-time calculated accommodation for preview
  const liveAkomodasi = hitungAkomodasiSOP({
    lokasiAwal: visit.lokasiAwal || visit.jenisLokasi || 'Tempat tinggal anggota',
    transportasi,
    wilayah: wilayahRs,
    jumlahPetugas: countPetugasCurrent,
    isLuarJamKerja,
    isLuarRsKerjaSama: isLuarMitra
  });

  const safeUpdate = async (updated: SickVisit, actionName: string, auditDetail: string) => {
    try {
      await onUpdate(updated, actionName, auditDetail);
    } catch (err: any) {
      console.error('Failed to update sick visit:', err);
      alert('Gagal memperbarui pendampingan sakit: ' + (err?.message || 'Kesalahan jaringan/database'));
    }
  };

  // Action: Simpan Koordinasi / Ajukan Persetujuan
  const handleSaveKoordinasi = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SickVisit = {
      ...visit,
      dikoordinasikanDengan,
      catatanKoordinasi,
      status: 'Menunggu Koordinasi',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    };
    safeUpdate(updated, 'COORDINATE', `Koordinasi pendampingan diajukan kepada: ${dikoordinasikanDengan}`);
  };

  // Action: Setujui Pendampingan (Tahap 5)
  const handleApprove = () => {
    const updated: SickVisit = {
      ...visit,
      status: 'Disetujui',
      disetujuiOleh: currentUser.name,
      tanggalDisetujui: getLocalDateISO(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: getLocalDateISO(),
          penulis: currentUser.name,
          catatan: `Pendampingan DISETUJUI oleh ${currentUser.name}. Siap untuk penugasan petugas pendamping.`,
          kondisiTerbaru: visit.deskripsiKondisi || 'Disetujui',
          tahap: 'Persetujuan'
        },
        ...visit.riwayatKunjungan
      ]
    };
    safeUpdate(updated, 'APPROVE', `Pendampingan sakit ${visit.nomorPendampingan} DISETUJUI`);
  };

  // Action: Tolak Pendampingan (Tahap 5)
  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasanPenolakan.trim()) {
      alert('Alasan penolakan wajib diisi!');
      return;
    }
    const updated: SickVisit = {
      ...visit,
      status: 'Ditolak',
      alasanPenolakan: alasanPenolakan.trim(),
      ditolakOleh: currentUser.name,
      tanggalDitolak: getLocalDateISO(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: getLocalDateISO(),
          penulis: currentUser.name,
          catatan: `Pendampingan DITOLAK oleh ${currentUser.name}. Alasan: ${alasanPenolakan.trim()}`,
          kondisiTerbaru: 'Ditolak',
          tahap: 'Penolakan'
        },
        ...visit.riwayatKunjungan
      ]
    };
    safeUpdate(updated, 'REJECT', `Pendampingan ${visit.nomorPendampingan} ditolak. Alasan: ${alasanPenolakan}`);
    setShowRejectForm(false);
  };

  // Action: Penugasan Petugas (Tahap 6 & 7)
  const handleSavePenugasan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!petugas1.trim()) {
      alert('Petugas 1 wajib diisi!');
      return;
    }

    if (isMenggunakanKoorlap && !alasanPenggunaanKoorlap.trim()) {
      alert('Alasan penggunaan Koorlap wajib diisi sesuai SOP!');
      return;
    }

    if (transportasi === 'Grab' && !alasanGrab.trim()) {
      alert('Alasan penggunaan Grab wajib diisi (kondisi mendesak & mobil tidak tersedia)!');
      return;
    }

    const calculatedAkomodasi = hitungAkomodasiSOP({
      lokasiAwal: visit.lokasiAwal || 'Tempat tinggal anggota',
      transportasi,
      wilayah: wilayahRs,
      jumlahPetugas: [petugas1, petugas2].filter(Boolean).length || 1,
      isLuarJamKerja,
      isLuarRsKerjaSama: isLuarMitra
    });

    const updated: SickVisit = {
      ...visit,
      status: 'Ditugaskan',
      petugas1: petugas1.trim(),
      petugas2: petugas2.trim() || undefined,
      ditugaskanOleh: currentUser.name,
      waktuPenugasan: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      catatanPenugasan: catatanPenugasan.trim() || undefined,
      isMenggunakanKoorlap,
      alasanPenggunaanKoorlap: isMenggunakanKoorlap ? alasanPenggunaanKoorlap.trim() : undefined,
      transportasi,
      kendaraanOperasionalDigunakan: transportasi === 'Mobil Operasional' ? kendaraanOperasional : undefined,
      alasanGrab: transportasi === 'Grab' ? alasanGrab.trim() : undefined,
      pengurusPenanggungJawab: petugas1.trim(),
      akomodasi: calculatedAkomodasi,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: getLocalDateISO(),
          penulis: currentUser.name,
          catatan: `Penugasan petugas: ${[petugas1, petugas2].filter(Boolean).join(', ')} menggunakan ${transportasi}.`,
          kondisiTerbaru: 'Ditugaskan',
          tahap: 'Penugasan'
        },
        ...visit.riwayatKunjungan
      ]
    };
    safeUpdate(updated, 'ASSIGN', `Penugasan petugas untuk kasus ${visit.nomorPendampingan}`);
  };

  // Action: Mulai Pendampingan & Simpan Pelaksanaan (Tahap 8)
  const handleSavePelaksanaan = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SickVisit = {
      ...visit,
      status: 'Dalam Pendampingan',
      waktuBerangkat: waktuBerangkat || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      waktuTiba,
      catatanPelaksanaan: catatanPelaksanaan.trim(),
      checklistBantuan,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: getLocalDateISO(),
          penulis: currentUser.name,
          catatan: `Pelaksanaan pendampingan di RS: ${catatanPelaksanaan.trim() || 'Petugas tiba di RS & mendampingi pasien.'}`,
          kondisiTerbaru: 'Dalam Pendampingan',
          tahap: 'Pelaksanaan Lapangan'
        },
        ...visit.riwayatKunjungan
      ]
    };
    safeUpdate(updated, 'UPDATE_PROGRESS', `Update pelaksanaan pendampingan di ${visit.rumahSakitTujuan || visit.lokasi}`);
  };

  // Action: Simpan Hasil Pendampingan (Tahap 9)
  const handleSaveHasil = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasilPendampingan === 'Belum Ditentukan') {
      alert('Pilih hasil pendampingan: RAWAT INAP atau DIPULANGKAN!');
      return;
    }

    const updated: SickVisit = {
      ...visit,
      hasilPendampingan,
      waktuHasil: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      ruangPerawatan: hasilPendampingan === 'RAWAT INAP' ? ruangPerawatan.trim() : undefined,
      catatanHasil: catatanHasil.trim(),
      petugasPenyelesaiAwal: currentUser.name,
      penjemputanPascaRawatInap: hasilPendampingan === 'RAWAT INAP' ? {
        isDibutuhkan: true,
        status: 'Belum Dijemput',
        catatan: 'Menunggu jadwal kepulangan pasien dari rawat inap.'
      } : undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: getLocalDateISO(),
          penulis: currentUser.name,
          catatan: `Hasil Pendampingan: ${hasilPendampingan}. ${ruangPerawatan ? `Ruang: ${ruangPerawatan}. ` : ''}${catatanHasil}`,
          kondisiTerbaru: hasilPendampingan,
          tahap: 'Hasil Pendampingan'
        },
        ...visit.riwayatKunjungan
      ]
    };
    safeUpdate(updated, 'HOSPITAL_RESULT', `Pencatatan hasil pendampingan: ${hasilPendampingan}`);
  };

  // Action: Simpan Penjemputan Pasca Rawat Inap (Tahap 10)
  const handleSavePenjemputan = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SickVisit = {
      ...visit,
      penjemputanPascaRawatInap: {
        isDibutuhkan: isButuhPenjemputan,
        tanggalPenjemputan,
        petugasPenjemputan,
        transportasi: transportasiPenjemputan,
        status: statusPenjemputan,
        catatan: catatanPenjemputan.trim(),
        updatedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: getLocalDateISO(),
          penulis: currentUser.name,
          catatan: `Update Penjemputan Pasca Rawat Inap: Status ${statusPenjemputan}. Petugas: ${petugasPenjemputan || '-'}, Transport: ${transportasiPenjemputan}.`,
          kondisiTerbaru: `Penjemputan: ${statusPenjemputan}`,
          tahap: 'Penjemputan Pasca Rawat Inap'
        },
        ...visit.riwayatKunjungan
      ]
    };
    safeUpdate(updated, 'PICKUP_UPDATE', `Update penjemputan pasca rawat inap (${statusPenjemputan})`);
  };

  // Action: Selesaikan Pendampingan (Tahap 12 & 13)
  const handleSelesaikanKasus = () => {
    if (!pernyataanBebasGratifikasi) {
      alert('Wajib mencentang deklarasi integritas bebas gratifikasi sebelum menyelesaikan pendampingan!');
      return;
    }

    const calculatedAkomodasi = hitungAkomodasiSOP({
      lokasiAwal: visit.lokasiAwal || 'Tempat tinggal anggota',
      transportasi: visit.transportasi || 'Mobil Operasional',
      wilayah: wilayahRs,
      jumlahPetugas: [visit.petugas1, visit.petugas2].filter(Boolean).length || 1,
      isLuarJamKerja,
      isLuarRsKerjaSama: isLuarMitra
    });

    const updated: SickVisit = {
      ...visit,
      status: 'Selesai',
      akomodasi: calculatedAkomodasi,
      pernyataanBebasGratifikasi: true,
      pernyataanOleh: currentUser.name,
      waktuPernyataan: new Date().toISOString(),
      sudahLaporGrupPtp,
      waktuLaporGrupPtp: sudahLaporGrupPtp ? new Date().toISOString() : undefined,
      pelaporGrupPtp: sudahLaporGrupPtp ? currentUser.name : undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: getLocalDateISO(),
          penulis: currentUser.name,
          catatan: `Pendampingan dinyatakan SELESAI oleh ${currentUser.name}. Deklarasi bebas gratifikasi telah dikonfirmasi sesuai SOP.`,
          kondisiTerbaru: 'Selesai',
          tahap: 'Penyelesaian Final'
        },
        ...visit.riwayatKunjungan
      ]
    };

    safeUpdate(updated, 'COMPLETE', `Pendampingan sakit ${visit.nomorPendampingan} SELESAI & Deklarasi Gratifikasi diverifikasi`);
  };

  // Action: Tambah Log Baru
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogCatatan.trim()) return;

    const newLogItem: SickVisitLog = {
      id: `slog-${Date.now()}`,
      tanggal: getLocalDateISO(),
      penulis: currentUser.name,
      catatan: newLogCatatan.trim(),
      kondisiTerbaru: newLogKondisi.trim() || 'Perkembangan Kondisi',
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    const updated: SickVisit = {
      ...visit,
      riwayatKunjungan: [newLogItem, ...visit.riwayatKunjungan],
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    };

    safeUpdate(updated, 'LOG_ENTRY', `Menambahkan log kunjungan untuk kasus ${visit.nomorPendampingan}`);
    setNewLogCatatan('');
    setNewLogKondisi('');
  };

  return (
    <div className="mobile-modal-backdrop z-50">
      <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-4xl max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-950 text-red-400 border border-red-800/50">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                  {visit.nomorPendampingan}
                </span>
                <h2 className="text-lg font-black text-white">
                  {visit.jenisPasien === 'Keluarga' && visit.namaPasien ? visit.namaPasien : visit.namaAnggota}
                </h2>
                {visit.isUrgent && (
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-black uppercase">
                    URGENT RS
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Anggota: <strong>{visit.namaAnggota}</strong> ({visit.nikAnggota}) • {visit.departemen} • Hubungan: <span className="text-amber-400 font-semibold">{visit.hubunganPasien || 'Anggota Sendiri'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SOP Workflow Step Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-slate-800 scrollbar-thin shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'ringkasan' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            1. Ringkasan Kasus
          </button>

          <button
            onClick={() => setActiveTab('koordinasi')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'koordinasi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            2. Koordinasi & Persetujuan
          </button>

          <button
            onClick={() => setActiveTab('penugasan')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'penugasan' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            3. Penugasan & Transport
          </button>

          <button
            onClick={() => setActiveTab('pelaksanaan')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pelaksanaan' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            4. Pelaksanaan RS
          </button>

          <button
            onClick={() => setActiveTab('hasil')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'hasil' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            5. Hasil & Penjemputan
          </button>

          <button
            onClick={() => setActiveTab('akomodasi')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'akomodasi' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            6. Akomodasi & Selesai
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'log' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Log Kunjungan ({visit.riwayatKunjungan?.length || 0})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          
          {/* TAB 1: RINGKASAN */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-4">
              
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Status Workflow SOP</span>
                  <span className="text-base font-black text-rose-400">{visit.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    visit.statusVerifikasiPasien === 'Valid SOP' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    Hubungan: {visit.statusVerifikasiPasien || 'Valid SOP'}
                  </span>

                  {visit.isRsKerjaSama && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">
                      RS Mitra Kerja Sama
                    </span>
                  )}
                </div>
              </div>

              {/* Data Pasien & Kondisi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-rose-400" />
                    <span>Identitas Pasien & Anggota</span>
                  </h4>
                  <div className="space-y-1.5 text-slate-300">
                    <p><span className="text-slate-500">Nama Pasien:</span> <strong className="text-white">{visit.namaPasien || visit.namaAnggota}</strong></p>
                    <p><span className="text-slate-500">Hubungan:</span> <strong className="text-amber-400">{visit.hubunganPasien || 'Anggota Sendiri'}</strong></p>
                    <p><span className="text-slate-500">Nama Anggota:</span> {visit.namaAnggota} ({visit.nikAnggota})</p>
                    <p><span className="text-slate-500">Departemen:</span> {visit.departemen}</p>
                    <p><span className="text-slate-500">No. WhatsApp/HP:</span> {visit.nomorHp || '-'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Lokasi & Rumah Sakit</span>
                  </h4>
                  <div className="space-y-1.5 text-slate-300">
                    <p><span className="text-slate-500">Rumah Sakit:</span> <strong className="text-white">{visit.rumahSakitTujuan || visit.lokasi}</strong></p>
                    <p><span className="text-slate-500">Alamat RS:</span> {visit.alamatRs || '-'}</p>
                    <p><span className="text-slate-500">Titik Awal:</span> {visit.lokasiAwal || visit.jenisLokasi || 'Tempat tinggal'}</p>
                    {visit.catatanLokasiLain && (
                      <p><span className="text-slate-500">Catatan Lokasi:</span> <span className="text-amber-300">{visit.catatanLokasiLain}</span></p>
                    )}
                    <p><span className="text-slate-500">Waktu Keberangkatan:</span> {visit.waktuKeberangkatan || 'Segera'}</p>
                  </div>
                </div>
              </div>

              {/* Kondisi & Catatan */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-red-400" />
                  <span>Kondisi & Kebutuhan Pendampingan (SOP Tahap 2)</span>
                </h4>
                <p className="text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  {visit.deskripsiKondisi || visit.diagnosaSingkat || visit.catatanAwal}
                </p>
              </div>

              {/* Ringkasan Penugasan & Akomodasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Petugas & Transportasi</span>
                  </h4>
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-500">Petugas 1:</span> <strong className="text-white">{visit.petugas1 || visit.pengurusPenanggungJawab || '-'}</strong></p>
                    {visit.petugas2 && <p><span className="text-slate-500">Petugas 2:</span> <strong className="text-white">{visit.petugas2}</strong></p>}
                    <p><span className="text-slate-500">Transportasi:</span> <strong className="text-emerald-400">{visit.transportasi || '-'}</strong></p>
                    {visit.kendaraanOperasionalDigunakan && (
                      <p><span className="text-slate-500">Mobil:</span> {visit.kendaraanOperasionalDigunakan}</p>
                    )}
                    {visit.alasanGrab && (
                      <p><span className="text-slate-500">Alasan Grab:</span> <span className="text-amber-300">{visit.alasanGrab}</span></p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-amber-400" />
                    <span>Hasil & Pasca Rawat Inap</span>
                  </h4>
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-500">Hasil:</span> <strong className="text-white">{visit.hasilPendampingan || 'Belum Ditentukan'}</strong></p>
                    {visit.ruangPerawatan && <p><span className="text-slate-500">Ruang:</span> {visit.ruangPerawatan}</p>}
                    <p><span className="text-slate-500">Penjemputan:</span> {visit.penjemputanPascaRawatInap?.status || 'Tidak Membutuhkan Penjemputan'}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: KOORDINASI & PERSETUJUAN (TAHAP 5) */}
          {activeTab === 'koordinasi' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-950/30 rounded-2xl border border-blue-800/40 text-blue-200 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5 text-blue-300">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Alur Koordinasi & Persetujuan (SOP Tahap 5)</span>
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  SOP mengatur adanya koordinasi dengan Ketua, Sekretaris, atau Wakil Ketua sebelum penugasan petugas dilakukan.
                </p>
              </div>

              {/* Status Persetujuan */}
              {visit.status === 'Disetujui' && (
                <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/50 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-300">Pendampingan Telah Disetujui</h4>
                    <p className="text-slate-300 text-xs">
                      Disetujui oleh <strong>{visit.disetujuiOleh}</strong> pada {visit.tanggalDisetujui || '-'}.
                    </p>
                  </div>
                </div>
              )}

              {visit.status === 'Ditolak' && (
                <div className="p-4 bg-red-950/40 rounded-2xl border border-red-800/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <XCircle className="w-5 h-5" />
                    <span>Pendampingan Ditolak</span>
                  </div>
                  <p className="text-slate-300">
                    Ditolak oleh <strong>{visit.ditolakOleh}</strong> pada {visit.tanggalDitolak || '-'}.
                  </p>
                  <p className="text-xs text-red-300 bg-red-950/70 p-2.5 rounded-xl border border-red-900/60">
                    <strong>Alasan Penolakan:</strong> {visit.alasanPenolakan}
                  </p>
                </div>
              )}

              {/* Form Koordinasi */}
              <form onSubmit={handleSaveKoordinasi} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white">Catatan Koordinasi dengan Pimpinan</h4>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Dikoordinasikan Kepada:</label>
                  <input
                    type="text"
                    value={dikoordinasikanDengan}
                    onChange={(e) => setDikoordinasikanDengan(e.target.value)}
                    placeholder="Contoh: Ketua PTP (Awaludin) & Sekretaris (Heri Fadli)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Catatan / Arahan Koordinasi:</label>
                  <textarea
                    rows={3}
                    value={catatanKoordinasi}
                    onChange={(e) => setCatatanKoordinasi(e.target.value)}
                    placeholder="Tuliskan hasil arahan atau konfirmasi koordinasi..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer"
                  >
                    Simpan Catatan Koordinasi
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(true)}
                      className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold transition-all cursor-pointer"
                    >
                      Tolak Pendampingan
                    </button>

                    <button
                      type="button"
                      onClick={handleApprove}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Setujui Pendampingan (SOP)
                    </button>
                  </div>
                </div>
              </form>

              {/* Form Penolakan jika dibuka */}
              {showRejectForm && (
                <form onSubmit={handleReject} className="p-4 bg-red-950/30 rounded-2xl border border-red-800/60 space-y-3">
                  <h4 className="font-bold text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Konfirmasi Penolakan Pendampingan</span>
                  </h4>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Alasan Penolakan Sesuai SOP <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={alasanPenolakan}
                      onChange={(e) => setAlasanPenolakan(e.target.value)}
                      placeholder="Sebutkan alasan penolakan (misal: bukan anggota/keluarga inti yang ditanggung, penanganan mandiri telah selesai, dll)..."
                      className="w-full bg-slate-950 border border-red-800/60 rounded-xl p-2 text-white"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                    >
                      Konfirmasi Tolak
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: PENUGASAN & TRANSPORTASI (TAHAP 6 & 7) */}
          {activeTab === 'penugasan' && (
            <form onSubmit={handleSavePenugasan} className="space-y-4">
              <div className="p-4 bg-purple-950/30 rounded-2xl border border-purple-800/40 text-purple-200 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Penugasan Petugas & Transportasi (SOP Tahap 6 & 7)</span>
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Petugas berasal dari Pengurus PTP / Struktur Organisasi. Penugasan Koorlap hanya bila memenuhi kondisi tertentu sesuai SOP.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Petugas 1 (Wajib) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={petugas1}
                      onChange={(e) => setPetugas1(e.target.value)}
                      placeholder="Nama petugas 1..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Petugas 2 (Opsional / Pendamping ke-2)
                    </label>
                    <input
                      type="text"
                      value={petugas2}
                      onChange={(e) => setPetugas2(e.target.value)}
                      placeholder="Nama petugas 2 (jika ada)..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                {/* Menggunakan Koorlap Checkbox */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={isMenggunakanKoorlap}
                      onChange={(e) => setIsMenggunakanKoorlap(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Menggunakan Koorlap sebagai Petugas Pendamping</span>
                  </label>

                  {isMenggunakanKoorlap && (
                    <div className="pt-1">
                      <label className="block text-amber-400 mb-1 font-semibold">
                        Alasan Penggunaan Koorlap Sesuai SOP <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={alasanPenggunaanKoorlap}
                        onChange={(e) => setAlasanPenggunaanKoorlap(e.target.value)}
                        placeholder="Contoh: Seluruh pengurus PTP sedang bertugas mediasi advokasi..."
                        className="w-full bg-slate-950 border border-amber-800/60 rounded-xl p-2 text-white"
                        required={isMenggunakanKoorlap}
                      />
                    </div>
                  )}
                </div>

                {/* Transportasi */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-slate-400 font-semibold">Pilihan Transportasi SOP</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Mobil Operasional', label: '🚗 Mobil Organisasi' },
                      { id: 'Motor Pribadi', label: '🛵 Motor Pribadi' },
                      { id: 'Grab', label: '🚕 Grab / Taksi Online' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTransportasi(t.id as TransportasiType)}
                        className={`p-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                          transportasi === t.id
                            ? 'bg-purple-950 border-purple-600 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {transportasi === 'Mobil Operasional' && (
                    <div className="pt-2 space-y-2">
                      <label className="block text-slate-400 mb-1 font-semibold">Kendaraan Operasional Digunakan</label>
                      <input
                        type="text"
                        value={kendaraanOperasional}
                        onChange={(e) => setKendaraanOperasional(e.target.value)}
                        placeholder="Mitsubishi Xpander / Daihatsu Xenia"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      />
                      {onRequestVehicle && (
                        <div className="p-3 bg-indigo-950/50 border border-indigo-800/60 rounded-xl flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 text-xs text-indigo-200">
                            <Car className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>
                              {visit.nomorLogKendaraan ? (
                                <span>Terhubung ke Log: <strong className="font-mono text-white">{visit.nomorLogKendaraan}</strong></span>
                              ) : (
                                <span>Butuh peminjaman mobil untuk kunjungan ini?</span>
                              )}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onRequestVehicle({
                                sickVisitId: visit.id,
                                nomorPendampingan: visit.nomorPendampingan,
                                kegiatan: `Pendampingan Sakit: ${visit.namaPasien || visit.namaAnggota} (${visit.hubunganPasien || 'Anggota'})`,
                                tujuan: visit.rumahSakitTujuan || visit.lokasi || 'Rumah Sakit',
                                keteranganSingkat: `Pendampingan sakit ${visit.namaAnggota} (${visit.nikAnggota}) di ${visit.rumahSakitTujuan || visit.lokasi}. Petugas: ${petugas1}${petugas2 ? ', ' + petugas2 : ''}.`,
                                tanggalMulai: visit.tanggal || new Date().toISOString().split('T')[0],
                                isUrgent: visit.isUrgensi || false,
                                alasanUrgensi: visit.isUrgensi ? (visit.alasanUrgensi || 'Pendampingan darurat anggota sakit') : undefined,
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <span>🚗 Buka di Menu Kendaraan</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {transportasi === 'Grab' && (
                    <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/50 space-y-1.5">
                      <label className="block text-amber-300 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Alasan Penggunaan Grab Sesuai SOP <span className="text-red-400">*</span></span>
                      </label>
                      <input
                        type="text"
                        value={alasanGrab}
                        onChange={(e) => setAlasanGrab(e.target.value)}
                        placeholder="SOP: Kondisi urgent/mendesak dan Mobil Operasional sedang tidak tersedia..."
                        className="w-full bg-slate-950 border border-amber-800/60 rounded-xl p-2 text-white"
                        required={transportasi === 'Grab'}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Catatan Tambahan Penugasan</label>
                  <input
                    type="text"
                    value={catatanPenugasan}
                    onChange={(e) => setCatatanPenugasan(e.target.value)}
                    placeholder="Catatan koordinasi petugas..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              {/* Preview Kalkulator Akomodasi */}
              <AkomodasiCalculatorCard akomodasi={liveAkomodasi} />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Car className="w-4 h-4" />
                  Konfirmasi Penugasan & Berangkat (SOP)
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: PELAKSANAAN RS (TAHAP 8) */}
          {activeTab === 'pelaksanaan' && (
            <form onSubmit={handleSavePelaksanaan} className="space-y-4">
              <div className="p-4 bg-rose-950/30 rounded-2xl border border-rose-800/40 text-rose-200 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5 text-rose-300">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span>Pelaksanaan Pendampingan di RS (SOP Tahap 8)</span>
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Catat waktu keberangkatan, waktu tiba di RS, dan checklist pendampingan administrasi / IGD.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Waktu Berangkat</label>
                    <input
                      type="text"
                      value={waktuBerangkat}
                      onChange={(e) => setWaktuBerangkat(e.target.value)}
                      placeholder="Contoh: 09.30 WIB"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Waktu Tiba di RS</label>
                    <input
                      type="text"
                      value={waktuTiba}
                      onChange={(e) => setWaktuTiba(e.target.value)}
                      placeholder="Contoh: 10.15 WIB"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                {/* Checklist Bantuan SOP */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-bold">Checklist Bantuan Pendampingan SOP:</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={checklistBantuan.administrasiRs}
                        onChange={(e) => setChecklistBantuan({ ...checklistBantuan, administrasiRs: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Membantu administrasi dan kelengkapan BPJS/Asuransi Rumah Sakit</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={checklistBantuan.prosesPendaftaran}
                        onChange={(e) => setChecklistBantuan({ ...checklistBantuan, prosesPendaftaran: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Membantu proses pendaftaran / rujukan IGD & poliklinik</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={checklistBantuan.koordinasiRsKeluarga}
                        onChange={(e) => setChecklistBantuan({ ...checklistBantuan, koordinasiRsKeluarga: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Membantu koordinasi dengan pihak Rumah Sakit & Keluarga Anggota</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Catatan Lapangan Pelaksanaan</label>
                  <textarea
                    rows={3}
                    value={catatanPelaksanaan}
                    onChange={(e) => setCatatanPelaksanaan(e.target.value)}
                    placeholder="Tuliskan situasi penanganan di RS..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-lg shadow-rose-900/40 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Catatan Pelaksanaan RS
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: HASIL & PENJEMPUTAN (TAHAP 9 & 10) */}
          {activeTab === 'hasil' && (
            <div className="space-y-4">
              
              {/* Hasil Pendampingan (Tahap 9) */}
              <form onSubmit={handleSaveHasil} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-amber-400" />
                    <span>Hasil Pendampingan (SOP Tahap 9)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">SOP-09</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHasilPendampingan('RAWAT INAP')}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      hasilPendampingan === 'RAWAT INAP'
                        ? 'bg-amber-950 border-amber-500 text-white font-bold shadow-lg shadow-amber-950/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <BedDouble className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                    <p className="text-xs font-black">A. RAWAT INAP</p>
                    <p className="text-[10px] text-slate-400">Pasien diopname di RS</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasilPendampingan('DIPULANGKAN')}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      hasilPendampingan === 'DIPULANGKAN'
                        ? 'bg-blue-950 border-blue-500 text-white font-bold shadow-lg shadow-blue-950/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Home className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <p className="text-xs font-black">B. DIPULANGKAN</p>
                    <p className="text-[10px] text-slate-400">Pasien rawat jalan / pulang</p>
                  </button>
                </div>

                {/* SOP Guidance Banner based on outcome */}
                {hasilPendampingan === 'RAWAT INAP' && (
                  <div className="p-3.5 bg-amber-950/40 rounded-xl border border-amber-800/60 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <Info className="w-4 h-4 text-amber-400" />
                      <span>PANDUAN SOP (RAWAT INAP):</span>
                    </div>
                    <p className="text-slate-200 text-xs">
                      "Petugas melakukan koordinasi kembali dengan Ketua/Sekretaris sesuai SOP untuk melaporkan perkembangan rawat inap dan rencana pemantauan."
                    </p>
                    <div className="pt-2">
                      <label className="block text-slate-400 mb-1 font-semibold">Ruang Perawatan / Kamar (Jika sudah ada)</label>
                      <input
                        type="text"
                        value={ruangPerawatan}
                        onChange={(e) => setRuangPerawatan(e.target.value)}
                        placeholder="Contoh: Gedung Anggrek Kamar 302"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      />
                    </div>
                  </div>
                )}

                {hasilPendampingan === 'DIPULANGKAN' && (
                  <div className="p-3.5 bg-blue-950/40 rounded-xl border border-blue-800/60 space-y-1">
                    <div className="flex items-center gap-2 text-blue-300 font-bold">
                      <Info className="w-4 h-4 text-blue-400" />
                      <span>PANDUAN SOP (DIPULANGKAN):</span>
                    </div>
                    <p className="text-slate-200 text-xs">
                      "Antarkan pasien ke tempat tinggal anggota atau koordinasikan penjemputan keluarga secara aman."
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Catatan Hasil & Rekomendasi</label>
                  <textarea
                    rows={2}
                    value={catatanHasil}
                    onChange={(e) => setCatatanHasil(e.target.value)}
                    placeholder="Catatan hasil dokter / tindakan medis singkat..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all cursor-pointer"
                  >
                    Simpan Hasil Pendampingan
                  </button>
                </div>
              </form>

              {/* Tindakan Lanjutan: Penjemputan Pasca Rawat Inap (Tahap 10) */}
              <form onSubmit={handleSavePenjemputan} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span>Tindakan Lanjutan: Penjemputan Pasca Rawat Inap (SOP Tahap 10)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">SOP-10</span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-bold">
                    <input
                      type="checkbox"
                      checked={isButuhPenjemputan}
                      onChange={(e) => setIsButuhPenjemputan(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Membutuhkan Penjemputan Saat Pasien Keluar dari Rawat Inap</span>
                  </label>

                  {isButuhPenjemputan && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Tgl Penjemputan</label>
                          <input
                            type="date"
                            value={tanggalPenjemputan}
                            onChange={(e) => setTanggalPenjemputan(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Petugas Penjemput</label>
                          <input
                            type="text"
                            value={petugasPenjemputan}
                            onChange={(e) => setPetugasPenjemputan(e.target.value)}
                            placeholder="Nama petugas..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Status Penjemputan</label>
                          <select
                            value={statusPenjemputan}
                            onChange={(e) => setStatusPenjemputan(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                          >
                            <option value="Belum Dijemput">Belum Dijemput</option>
                            <option value="Sudah Dijemput">Sudah Dijemput</option>
                            <option value="Tidak Membutuhkan Penjemputan">Tidak Membutuhkan</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Catatan Penjemputan</label>
                        <input
                          type="text"
                          value={catatanPenjemputan}
                          onChange={(e) => setCatatanPenjemputan(e.target.value)}
                          placeholder="Catatan kondisi kepulangan..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-all cursor-pointer"
                  >
                    Simpan Data Penjemputan Pasca Rawat Inap
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 6: AKOMODASI & GRATIFIKASI & PENYELESAIAN (TAHAP 11, 12, 13) */}
          {activeTab === 'akomodasi' && (
            <div className="space-y-4">
              
              {/* Rincian Akomodasi Kalkulator */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>Perhitungan Akomodasi SOP SBN KASBI 2026–2029 (Tahap 11)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">SOP-11</span>
                </div>

                {/* Opsi Penyesuaian Lembur / Luar Jam */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={isLuarJamKerja}
                      onChange={(e) => setIsLuarJamKerja(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Melebihi Jam Kerja Normal / Malam Hari (+Rp25.000 jika bukan RS Mitra)</span>
                  </label>

                  <span className="text-[11px] text-slate-400">
                    RS: {visit.isRsKerjaSama ? 'RS Mitra' : 'Bukan Mitra Kerja Sama'}
                  </span>
                </div>

                <AkomodasiCalculatorCard akomodasi={liveAkomodasi} />
              </div>

              {/* TAHAP 13: STATUS LAPORAN GRUP PTP */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <span>Laporan ke Grup Koordinasi PTP (SOP Tahap 13)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">SOP-13</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold pt-1">
                  <input
                    type="checkbox"
                    checked={sudahLaporGrupPtp}
                    onChange={(e) => setSudahLaporGrupPtp(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sudah Melaporkan Rincian Pendampingan ke Grup WhatsApp Koordinasi PTP</span>
                </label>
                {visit.sudahLaporGrupPtp && (
                  <p className="text-[11px] text-emerald-400">
                    ✓ Dilaporkan oleh {visit.pelaporGrupPtp || 'Petugas'} pada {visit.waktuLaporGrupPtp ? new Date(visit.waktuLaporGrupPtp).toLocaleString('id-ID') : '-'}
                  </p>
                )}
              </div>

              {/* TAHAP 12: DEKLARASI BEBAS GRATIFIKASI */}
              <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border-2 border-emerald-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Deklarasi Integritas Bebas Gratifikasi (SOP Tahap 12)</span>
                  </h4>
                  <span className="text-[10px] text-emerald-500 font-mono font-bold">WAJIB SOP</span>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-200 leading-relaxed italic text-xs">
                  "Saya menyatakan tidak meminta dan tidak menerima gratifikasi atau pemberian dalam bentuk apa pun dari anggota terkait kegiatan pendampingan ini."
                </div>

                <label className="flex items-center gap-3 p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 cursor-pointer text-slate-200 font-bold hover:bg-emerald-950/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={pernyataanBebasGratifikasi}
                    onChange={(e) => setPernyataanBebasGratifikasi(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Saya menyatakan benar dan memegang teguh integritas organisasi.</span>
                </label>

                {visit.pernyataanBebasGratifikasi && (
                  <p className="text-[10px] text-emerald-400">
                    ✓ Pernyataan telah dikonfirmasi oleh <strong>{visit.pernyataanOleh}</strong> pada {visit.waktuPernyataan ? new Date(visit.waktuPernyataan).toLocaleString('id-ID') : '-'}
                  </p>
                )}
              </div>

              {/* Action Button: Selesaikan Pendampingan */}
              {visit.status !== 'Selesai' && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSelesaikanKasus}
                    disabled={!pernyataanBebasGratifikasi}
                    className={`px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer ${
                      pernyataanBebasGratifikasi
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-emerald-950/50'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Selesaikan Pendampingan (SOP Final)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: LOG KUNJUNGAN & CATATAN */}
          {activeTab === 'log' && (
            <div className="space-y-4">
              
              {/* Form Tambah Log */}
              <form onSubmit={handleAddLog} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>Tambah Log / Catatan Perkembangan Baru</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Kondisi / Status Singkat</label>
                    <input
                      type="text"
                      value={newLogKondisi}
                      onChange={(e) => setNewLogKondisi(e.target.value)}
                      placeholder="Contoh: Sudah selesai rontgen / Pasien stabil"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Petugas Pencatat</label>
                    <input
                      type="text"
                      value={currentUser.name}
                      disabled
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Uraian Catatan Lapangan</label>
                  <textarea
                    rows={2}
                    value={newLogCatatan}
                    onChange={(e) => setNewLogCatatan(e.target.value)}
                    placeholder="Tuliskan rincian situasi terkini..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all cursor-pointer"
                  >
                    Simpan Log Perkembangan
                  </button>
                </div>
              </form>

              {/* Timeline Log */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-300">Riwayat Catatan & Workflow:</h4>
                {visit.riwayatKunjungan && visit.riwayatKunjungan.length > 0 ? (
                  visit.riwayatKunjungan.map((log) => (
                    <div key={log.id} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-400">{log.penulis}</span>
                          {log.tahap && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              {log.tahap}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500">{log.tanggal} {log.waktu ? `• ${log.waktu}` : ''}</span>
                      </div>

                      <p className="text-slate-200 text-xs leading-relaxed">{log.catatan}</p>

                      {log.kondisiTerbaru && (
                        <p className="text-[11px] text-slate-400 pt-1">
                          Status tercatat: <span className="text-amber-400 font-semibold">{log.kondisiTerbaru}</span>
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-4 text-center">Belum ada riwayat log.</p>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div>
            {onDelete && currentUser.isSuperAdmin && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Yakin ingin menghapus data pendampingan ${visit.nomorPendampingan}?`)) {
                    try {
                      await onDelete(visit.id);
                      onClose();
                    } catch (err: any) {
                      console.error('Failed to delete sick visit:', err);
                      alert('Gagal menghapus pendampingan sakit: ' + (err?.message || 'Kesalahan jaringan/database'));
                    }
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800/60 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Data</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
