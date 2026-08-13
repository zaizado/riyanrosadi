import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Key
} from 'lucide-react';
import { VehicleLog, VehicleType, VehicleStatus, ParkingLocation, Member, UserAccount } from '../types';
import { getLocalDateISO } from '../utils/dateUtils';
import { MemberSearchSelect } from './MemberSearchSelect';
import { ModalPortal } from './ModalPortal';

interface VehicleManagerProps {
  vehicleLogs: VehicleLog[];
  members: Member[];
  users: UserAccount[];
  currentUser: UserAccount;
  onAddLog: (log: VehicleLog) => Promise<void>;
  onUpdateLog: (log: VehicleLog) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({
  vehicleLogs,
  members,
  users,
  currentUser,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState<'All' | VehicleType>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | VehicleStatus>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<VehicleLog | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnLog, setSelectedReturnLog] = useState<VehicleLog | null>(null);
  const [returnCondition, setReturnCondition] = useState('');

  // Form Fields
  const [kendaraan, setKendaraan] = useState<VehicleType>('Mitsubishi Xpander');
  const [lokasiParkir, setLokasiParkir] = useState<ParkingLocation>('Mabes');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [namaPemakaiManual, setNamaPemakaiManual] = useState('');
  const [departemenPemakai, setDepartemenPemakai] = useState('');
  const [petugasMemberId, setPetugasMemberId] = useState('');
  const [petugasSerahTerima, setPetugasSerahTerima] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState(() => getLocalDateISO());
  const [jamMulai, setJamMulai] = useState('08:00');
  const [tanggalSelesai, setTanggalSelesai] = useState(() => getLocalDateISO());
  const [jamSelesai, setJamSelesai] = useState('17:00');
  const [kondisiAwal, setKondisiAwal] = useState('BBM 3/4 Tank, AC Normal, Body Bersih, Surat-surat Lengkap (STNK Ada)');
  const [status, setStatus] = useState<VehicleStatus>('Sedang Digunakan');
  const [catatan, setCatatan] = useState('');

  // Vehicle Info Constants (Plat nomor & Warna removed per request)
  const VEHICLES_INFO = [
    {
      name: 'Mitsubishi Xpander' as VehicleType,
      kapasitas: '7 Penumpang',
      defaultLokasi: 'Mabes' as ParkingLocation,
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&q=80',
    },
    {
      name: 'Daihatsu Xenia' as VehicleType,
      kapasitas: '7 Penumpang',
      defaultLokasi: 'JV A' as ParkingLocation,
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&q=80',
    },
  ];

  // Helper to determine current status of a vehicle
  const getVehicleCurrentStatus = (vehicleName: VehicleType) => {
    const activeLog = vehicleLogs.find(
      (log) => log.kendaraan === vehicleName && log.status === 'Sedang Digunakan'
    );
    if (activeLog) {
      return {
        isAvailable: false,
        activeLog,
        userText: `${activeLog.namaPemakai} (${activeLog.departemenPemakai})`,
        lokasiParkir: activeLog.lokasiParkir || (vehicleName === 'Mitsubishi Xpander' ? 'Mabes' : 'JV A'),
      };
    }
    // Latest log location or default
    const latestLog = vehicleLogs.find((log) => log.kendaraan === vehicleName);
    return {
      isAvailable: true,
      activeLog: null,
      userText: 'Tersedia di Garasi',
      lokasiParkir: latestLog?.lokasiParkir || (vehicleName === 'Mitsubishi Xpander' ? 'Mabes' : 'JV A'),
    };
  };

  // Open Add Modal
  const handleOpenAddModal = (presetVehicle?: VehicleType) => {
    setEditingLog(null);
    const selectedVeh = presetVehicle || 'Mitsubishi Xpander';
    setKendaraan(selectedVeh);
    setLokasiParkir(selectedVeh === 'Mitsubishi Xpander' ? 'Mabes' : 'JV A');
    setSelectedMember(null);
    setMemberSearch('');
    setNamaPemakaiManual('');
    setDepartemenPemakai('');
    
    // Default Petugas Serah Terima to first member or current user
    const firstMember = members[0];
    if (firstMember) {
      setPetugasMemberId(firstMember.id);
      setPetugasSerahTerima(firstMember.namaLengkap);
    } else {
      setPetugasMemberId('');
      setPetugasSerahTerima(currentUser.name);
    }

    setTujuan('');
    const today = getLocalDateISO();
    setTanggalMulai(today);
    setTanggalSelesai(today);
    setJamMulai('08:00');
    setJamSelesai('17:00');
    setKondisiAwal('BBM 3/4 Tank, AC Normal, Body Bersih, Surat-surat Lengkap');
    setStatus('Sedang Digunakan');
    setCatatan('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (log: VehicleLog) => {
    setEditingLog(log);
    setKendaraan(log.kendaraan);
    setLokasiParkir(log.lokasiParkir || 'Mabes');
    setSelectedMember(null);
    setMemberSearch(log.namaPemakai);
    setNamaPemakaiManual(log.namaPemakai);
    setDepartemenPemakai(log.departemenPemakai);

    // Try to match member for Petugas
    const matchedPetugas = members.find(
      (m) => m.namaLengkap && log.petugasSerahTerima && m.namaLengkap.toLowerCase() === log.petugasSerahTerima.toLowerCase()
    );
    if (matchedPetugas) {
      setPetugasMemberId(matchedPetugas.id);
    } else {
      setPetugasMemberId('');
    }
    setPetugasSerahTerima(log.petugasSerahTerima);

    setTujuan(log.tujuan);
    setTanggalMulai(log.tanggalMulai);
    setJamMulai(log.jamMulai);
    setTanggalSelesai(log.tanggalSelesai);
    setJamSelesai(log.jamSelesai);
    setKondisiAwal(log.kondisiAwal);
    setStatus(log.status);
    setCatatan(log.catatan || '');
    setIsModalOpen(true);
  };

  // Switch Vehicle Radio Selection
  const handleSelectVehicle = (vehName: VehicleType) => {
    setKendaraan(vehName);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const pemakaiName = selectedMember ? selectedMember.namaLengkap : (namaPemakaiManual || memberSearch || 'Anggota SBN');
    const pemakaiDept = selectedMember ? selectedMember.departemen : (departemenPemakai || 'Umum');

    const nowStr = new Date().toISOString();

    if (editingLog) {
      const updated: VehicleLog = {
        ...editingLog,
        kendaraan,
        lokasiParkir,
        platNomor: '',
        memberId: selectedMember ? selectedMember.id : editingLog.memberId,
        namaPemakai: pemakaiName,
        departemenPemakai: pemakaiDept,
        petugasSerahTerima,
        tujuan,
        tanggalMulai,
        jamMulai,
        tanggalSelesai,
        jamSelesai,
        kondisiAwal,
        status,
        catatan,
        updatedAt: nowStr,
      };
      await onUpdateLog(updated);
    } else {
      const newLog: VehicleLog = {
        id: `veh-${Date.now()}`,
        nomorLog: `MOB-${new Date().getFullYear()}-${String(vehicleLogs.length + 1).padStart(3, '0')}`,
        kendaraan,
        lokasiParkir,
        platNomor: '',
        memberId: selectedMember ? selectedMember.id : 'm-manual',
        namaPemakai: pemakaiName,
        departemenPemakai: pemakaiDept,
        petugasSerahTerima,
        tujuan,
        tanggalMulai,
        jamMulai,
        tanggalSelesai,
        jamSelesai,
        kondisiAwal,
        status,
        catatan,
        updatedAt: nowStr,
      };
      await onAddLog(newLog);
    }

    setIsModalOpen(false);
  };

  // Open Return / Complete Modal
  const handleOpenReturnModal = (log: VehicleLog) => {
    setSelectedReturnLog(log);
    setReturnCondition('BBM Sesuai Awal, Odometer Dicatat, Mobil Kondisi Baik & Kunci Dikembalikan');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedReturnLog) return;
    const updated: VehicleLog = {
      ...selectedReturnLog,
      status: 'Sudah Kembali',
      kondisiKembali: returnCondition,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateLog(updated);
    setIsReturnModalOpen(false);
    setSelectedReturnLog(null);
  };

  // Filtered Logs
  const filteredLogs = vehicleLogs.filter((log) => {
    const matchesSearch =
      (log.namaPemakai && log.namaPemakai.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.tujuan && log.tujuan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.nomorLog && log.nomorLog.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.departemenPemakai && log.departemenPemakai.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVehicle = filterVehicle === 'All' || log.kendaraan === filterVehicle;
    const matchesStatus = filterStatus === 'All' || log.status === filterStatus;

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  // Filter Members suggestions for input dropdown
  const memberSuggestions = memberSearch.trim()
    ? members.filter(
        (m) =>
          (m.namaLengkap && m.namaLengkap.toLowerCase().includes(memberSearch.toLowerCase())) ||
          (m.nomorAnggota && m.nomorAnggota.toLowerCase().includes(memberSearch.toLowerCase())) ||
          (m.nik && m.nik.toLowerCase().includes(memberSearch.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                <Car className="w-6 h-6" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Kendaraan Operasional Serikat
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              Jurnal Serah Terima & Pemakaian Mobil Dinas SBN KASBI PT VCI
            </p>
          </div>

          <button
            onClick={() => handleOpenAddModal()}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-5 h-5" />
            <span>Catat Pemakaian Baru</span>
          </button>
        </div>
      </div>

      {/* Fleet Status Cards (2 Vehicles) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VEHICLES_INFO.map((veh) => {
          const statusInfo = getVehicleCurrentStatus(veh.name);
          return (
            <div
              key={veh.name}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Row: Vehicle name & status badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-700">
                    <Car className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">{veh.name}</h3>
                  </div>
                </div>

                {/* Availability Badge */}
                {statusInfo.isAvailable ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Tersedia
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Sedang Digunakan
                  </span>
                )}
              </div>

              {/* Status details body */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 my-2 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    Lokasi Parkir:
                  </span>
                  <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px]">
                    {statusInfo.lokasiParkir}
                  </span>
                </div>
                {!statusInfo.isAvailable && (
                  <>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-amber-600" />
                        Pemakai Saat Ini:
                      </span>
                      <span className="font-bold text-amber-900 truncate max-w-[200px]">
                        {statusInfo.activeLog?.namaPemakai}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Tujuan:
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">
                        {statusInfo.activeLog?.tujuan}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Est. Selesai:
                      </span>
                      <span className="font-mono text-cyan-800 font-bold">
                        {statusInfo.activeLog?.tanggalSelesai} ({statusInfo.activeLog?.jamSelesai})
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action button */}
              <div className="pt-2 flex items-center gap-2">
                {statusInfo.isAvailable ? (
                  <button
                    onClick={() => handleOpenAddModal(veh.name)}
                    className="w-full py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-xs border border-cyan-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-cyan-700" />
                    <span>Pinjam {veh.name ? (veh.name.split(' ')[1] || veh.name) : 'Kendaraan'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenReturnModal(statusInfo.activeLog!)}
                    className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <span>Proses Pengembalian Kendaraan</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pemakai, tujuan, nomor log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Vehicle */}
          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="All">Semua Mobil</option>
            <option value="Mitsubishi Xpander">Mitsubishi Xpander</option>
            <option value="Daihatsu Xenia">Daihatsu Xenia</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="All">Semua Status</option>
            <option value="Sedang Digunakan">Sedang Digunakan</option>
            <option value="Sudah Kembali">Sudah Kembali</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Journal Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-900">Riwayat Jurnal Pemakaian Kendaraan</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Total: {filteredLogs.length} Jurnal</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Car className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-medium">Belum ada jurnal pemakaian kendaraan yang dicatat.</p>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-bold hover:bg-cyan-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tambah Jurnal Pertama
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50 transition-colors space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between"
              >
                {/* Left Side Info */}
                <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {log.nomorLog}
                    </span>
                    <span className="text-xs font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {log.kendaraan}
                    </span>

                    {/* Status Badge */}
                    {log.status === 'Sedang Digunakan' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Sedang Digunakan
                      </span>
                    )}
                    {log.status === 'Sudah Kembali' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Sudah Kembali
                      </span>
                    )}
                    {log.status === 'Dibatalkan' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        Dibatalkan
                      </span>
                    )}
                  </div>

                  {/* Main Details */}
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {log.namaPemakai}{' '}
                      <span className="text-slate-500 text-xs font-normal">
                        ({log.departemenPemakai})
                      </span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900">Tujuan:</strong> {log.tujuan}
                    </span>
                  </div>

                  {/* Time & Petugas */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {log.tanggalMulai} ({log.jamMulai}) s.d. {log.tanggalSelesai} ({log.jamSelesai})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Petugas Serah Terima: <strong className="text-slate-800">{log.petugasSerahTerima}</strong></span>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1 mt-2">
                    <div>
                      <strong className="text-cyan-800">Kondisi Serah Terima Awal:</strong> {log.kondisiAwal}
                    </div>
                    {log.kondisiKembali && (
                      <div className="text-emerald-800 border-t border-slate-200 pt-1 mt-1">
                        <strong className="text-emerald-700">Kondisi Saat Kembali:</strong> {log.kondisiKembali}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                  {log.status === 'Sedang Digunakan' && (
                    <button
                      onClick={() => handleOpenReturnModal(log)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditModal(log)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                    title="Hapus Log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL ADD / EDIT VEHICLE LOG */}
      {isModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-white border border-slate-200 text-slate-900 p-5 sm:p-6 shadow-2xl relative space-y-4 max-w-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 pr-8">
              <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-700 shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingLog ? 'Edit Jurnal Pemakaian Kendaraan' : 'Catat Jurnal Pemakaian Kendaraan Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Isi data serah terima kendaraan operasional dengan cermat
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Vehicle Selection Radio Cards */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Pilih Kendaraan Operasional *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleSelectVehicle('Mitsubishi Xpander')}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center space-x-3 transition-all ${
                      kendaraan === 'Mitsubishi Xpander'
                        ? 'bg-cyan-50 border-cyan-500 shadow-sm text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Car className={`w-6 h-6 ${kendaraan === 'Mitsubishi Xpander' ? 'text-cyan-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-black">Mitsubishi Xpander</p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleSelectVehicle('Daihatsu Xenia')}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center space-x-3 transition-all ${
                      kendaraan === 'Daihatsu Xenia'
                        ? 'bg-cyan-50 border-cyan-500 shadow-sm text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Car className={`w-6 h-6 ${kendaraan === 'Daihatsu Xenia' ? 'text-cyan-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-black">Daihatsu Xenia</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lokasi Parkir / Titik Standby (3 Pilihan: Mabes, JV A, JV B) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lokasi Parkir / Posko Standby *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Mabes', 'JV A', 'JV B'] as ParkingLocation[]).map((loc) => (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => setLokasiParkir(loc)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        lokasiParkir === loc
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <MapPin className={`w-3.5 h-3.5 ${lokasiParkir === loc ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{loc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Siapa Yang Memakai (Pemakai / Driver) */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-700">
                  Siapa Yang Memakai (Anggota / Pengurus) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama anggota atau cari dari list..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setNamaPemakaiManual(e.target.value);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                />

                {/* Member Dropdown Suggestions */}
                {memberSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {memberSuggestions.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMember(m);
                          setMemberSearch(`${m.namaLengkap} (${m.nomorAnggota})`);
                          setNamaPemakaiManual(m.namaLengkap);
                          setDepartemenPemakai(m.departemen);
                        }}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{m.namaLengkap}</p>
                          <p className="text-[10px] text-slate-500">
                            {m.nomorAnggota} • Dept {m.departemen}
                          </p>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-cyan-800 px-1.5 py-0.5 rounded font-bold">
                          Pilih
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Departemen Pemakai & Petugas Serah Terima */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Departemen / Unit Kerja</label>
                  <input
                    type="text"
                    placeholder="Contoh: Cutting / Sekretariat / Pengurus"
                    value={departemenPemakai}
                    onChange={(e) => setDepartemenPemakai(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <MemberSearchSelect
                    members={members}
                    selectedMemberId={petugasMemberId}
                    onSelectMember={(m) => {
                      if (m) {
                        setPetugasMemberId(m.id);
                        setPetugasSerahTerima(m.namaLengkap);
                      } else {
                        setPetugasMemberId('');
                        setPetugasSerahTerima('');
                      }
                    }}
                    label="Petugas Serah Terima (Pilih dari List Anggota)"
                    placeholder="Cari NIK, Nama, atau Dept Anggota..."
                    required
                  />
                </div>
              </div>

              {/* Tujuan Penggunaan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tujuan Penggunaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pendampingan kasus ke Disnaker / Konsolidasi DPC / Bantuan Sosial"
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>

              {/* Waktu Penggunaan (Tanggal & Jam Mulai & Selesai) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Tgl Mulai *</label>
                  <input
                    type="date"
                    required
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Jam Mulai *</label>
                  <input
                    type="time"
                    required
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Tgl Selesai *</label>
                  <input
                    type="date"
                    required
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Jam Selesai *</label>
                  <input
                    type="time"
                    required
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Kondisi saat serah terima awal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Kondisi Kendaraan Saat Serah Terima Awal *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Isi BBM (1/2, Full), Odometer/KM, kebersihan, catatan kelengkapan (STNK, Kunci)..."
                  value={kondisiAwal}
                  onChange={(e) => setKondisiAwal(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status Jurnal *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                >
                  <option value="Sedang Digunakan">Sedang Digunakan (Kunci diserahkan)</option>
                  <option value="Sudah Kembali">Sudah Kembali (Mobil dikembalikan)</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  {editingLog ? 'Simpan Perubahan' : 'Simpan Jurnal Pemakaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* MODAL RETURN / COMPLETE VEHICLE LOG */}
      {isReturnModalOpen && selectedReturnLog && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-white border border-slate-200 text-slate-900 p-6 shadow-2xl relative space-y-4 max-w-lg">
            <button
              onClick={() => setIsReturnModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 pr-8">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Pengembalian Kendaraan</h3>
                <p className="text-xs text-slate-500">
                  {selectedReturnLog.kendaraan}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <p>
                <strong className="text-slate-900">Pemakai:</strong> {selectedReturnLog.namaPemakai}
              </p>
              <p>
                <strong className="text-slate-900">Tujuan:</strong> {selectedReturnLog.tujuan}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Catatan Kondisi Kendaraan Saat Dikembalikan *
              </label>
              <textarea
                rows={3}
                required
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs"
                placeholder="Contoh: BBM Full Tank, Odometer 48.300 KM, Kondisi Baik, Kunci STNK Sudah Diterima Petugas."
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                Selesaikan & Kembalikan Kunci
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};
