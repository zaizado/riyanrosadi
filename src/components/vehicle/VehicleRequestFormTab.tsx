import React, { useState, useMemo, useEffect } from 'react';
import { 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MapPin, 
  Users, 
  Car, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  ArrowLeft
} from 'lucide-react';
import { VehicleLog, Member, UserAccount, VehicleType, ParkingLocation } from '../../types';
import { DEFAULT_FLEET, checkVehicleAvailability } from '../../utils/vehicleUtils';
import { getLocalDateISO } from '../../utils/dateUtils';
import { MemberSearchSelect } from '../MemberSearchSelect';

interface VehicleRequestFormTabProps {
  vehicleLogs: VehicleLog[];
  members: Member[];
  currentUser: UserAccount;
  initialDraft?: Partial<VehicleLog> | null;
  onSubmitRequest: (newLog: VehicleLog) => Promise<void>;
  onCancel: () => void;
}

export const VehicleRequestFormTab: React.FC<VehicleRequestFormTabProps> = ({
  vehicleLogs,
  members,
  currentUser,
  initialDraft,
  onSubmitRequest,
  onCancel,
}) => {
  const isSuperAdminOrPengurus = 
    currentUser.role === 'Super Admin' || 
    currentUser.role === 'Pengurus' ||
    currentUser.role === 'Admin';

  // Form State
  const [namaKegiatan, setNamaKegiatan] = useState(initialDraft?.kegiatan || '');
  const [tujuanLokasi, setTujuanLokasi] = useState(initialDraft?.tujuan || '');
  const [keteranganSingkat, setKeteranganSingkat] = useState(initialDraft?.keteranganSingkat || '');
  const [isUntukOrganisasi, setIsUntukOrganisasi] = useState<boolean | null>(true);

  // Jadwal
  const todayStr = useMemo(() => getLocalDateISO(), []);
  const [tanggal, setTanggal] = useState(initialDraft?.tanggalMulai || todayStr);
  const [jamBerangkat, setJamBerangkat] = useState(initialDraft?.jamMulai || '08:00');
  const [jamKembali, setJamKembali] = useState(initialDraft?.jamSelesai || '17:00');

  // Pemohon
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [namaPemohon, setNamaPemohon] = useState(currentUser.name || '');
  const [departemenPemohon, setDepartemenPemohon] = useState(currentUser.department || 'PTP SBN KASBI');
  const [kontakPemohon, setKontakPemohon] = useState(currentUser.phone || '');
  const [jumlahPenumpang, setJumlahPenumpang] = useState<number>(initialDraft?.jumlahPenumpang || 2);

  // Urgensi
  const [jenisPenggunaan, setJenisPenggunaan] = useState<'Biasa' | 'Urgensi'>(
    initialDraft?.isUrgent || initialDraft?.jenisPenggunaan === 'Urgensi' ? 'Urgensi' : 'Biasa'
  );
  const [alasanUrgensi, setAlasanUrgensi] = useState(initialDraft?.alasanUrgensi || '');

  // Selected Vehicle
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Mitsubishi Xpander');

  // Submit Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Sync when initialDraft changes
  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.kegiatan) setNamaKegiatan(initialDraft.kegiatan);
      if (initialDraft.tujuan) setTujuanLokasi(initialDraft.tujuan);
      if (initialDraft.keteranganSingkat) setKeteranganSingkat(initialDraft.keteranganSingkat);
      if (initialDraft.tanggalMulai) setTanggal(initialDraft.tanggalMulai);
      if (initialDraft.jamMulai) setJamBerangkat(initialDraft.jamMulai);
      if (initialDraft.jamSelesai) setJamKembali(initialDraft.jamSelesai);
      if (initialDraft.isUrgent) {
        setJenisPenggunaan('Urgensi');
        if (initialDraft.alasanUrgensi) setAlasanUrgensi(initialDraft.alasanUrgensi);
      }
    }
  }, [initialDraft]);

  // If currentUser has matched member profile
  useEffect(() => {
    let isMounted = true;
    if (currentUser.memberId || currentUser.nik) {
      const fetchMatch = async () => {
        try {
          const { getDocs, query, collection, where } = await import('firebase/firestore');
          const { db } = await import('../../lib/firebase');
          let q;
          if (currentUser.memberId) {
            q = query(collection(db, 'members'), where('id', '==', currentUser.memberId));
          } else {
            q = query(collection(db, 'members'), where('nik', '==', currentUser.nik));
          }
          const snap = await getDocs(q);
          if (isMounted && !snap.empty) {
            const match = snap.docs[0].data() as Member;
            setSelectedMember(match);
            setNamaPemohon(match.namaLengkap);
            setDepartemenPemohon(match.departemen || 'PTP SBN KASBI');
            if (match.nomorHp) setKontakPemohon(match.nomorHp);
          }
        } catch (e) {}
      };
      fetchMatch();
    }
    return () => { isMounted = false; };
  }, [currentUser]);

  // When a member is picked via selector (admin mode)
  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setNamaPemohon(member.namaLengkap);
    setDepartemenPemohon(member.departemen || 'Umum');
    if (member.nomorHp) setKontakPemohon(member.nomorHp);
  };

  // Real-time Vehicle Availability Check for the chosen time slot
  const vehicleAvailability = useMemo(() => {
    return DEFAULT_FLEET.map((fleet) => {
      const check = checkVehicleAvailability(
        fleet.name,
        tanggal,
        jamBerangkat,
        tanggal,
        jamKembali,
        vehicleLogs
      );
      return {
        fleet,
        isAvailable: check.isAvailable,
        reason: check.reason,
        conflictingLog: check.conflictingLog,
      };
    });
  }, [tanggal, jamBerangkat, jamKembali, vehicleLogs]);

  // Check if chosen vehicle is available
  const currentChosenCheck = vehicleAvailability.find(v => v.fleet.name === selectedVehicle);
  const isAnyVehicleAvailable = vehicleAvailability.some(v => v.isAvailable);

  // Auto pick first available vehicle if current is blocked
  useEffect(() => {
    if (currentChosenCheck && !currentChosenCheck.isAvailable) {
      const firstAvail = vehicleAvailability.find(v => v.isAvailable);
      if (firstAvail) {
        setSelectedVehicle(firstAvail.fleet.name);
      }
    }
  }, [vehicleAvailability, currentChosenCheck]);

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (isUntukOrganisasi !== true) {
      setValidationError('Kendaraan operasional hanya digunakan untuk kebutuhan dan program kerja organisasi.');
      return;
    }

    if (!namaKegiatan.trim()) {
      setValidationError('Harap isi nama kegiatan penggunaan kendaraan.');
      return;
    }

    if (!tujuanLokasi.trim()) {
      setValidationError('Harap isi tujuan atau lokasi perjalanan.');
      return;
    }

    if (!tanggal || !jamBerangkat || !jamKembali) {
      setValidationError('Harap lengkapi tanggal dan jam penggunaan kendaraan.');
      return;
    }

    if (jenisPenggunaan === 'Urgensi' && !alasanUrgensi.trim()) {
      setValidationError('Harap tuliskan alasan urgensi/kondisi darurat.');
      return;
    }

    if (!currentChosenCheck?.isAvailable && jenisPenggunaan !== 'Urgensi') {
      setValidationError('Kendaraan yang dipilih sedang tidak tersedia pada jam tersebut. Silakan pilih kendaraan lain atau ubah waktu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newLogId = `veh-${Date.now()}`;
      const year = new Date().getFullYear();
      const nomorLog = `MOB-${year}-${String(vehicleLogs.length + 1).padStart(3, '0')}`;

      const matchedFleet = DEFAULT_FLEET.find(f => f.name === selectedVehicle);
      const defaultLoc: ParkingLocation = matchedFleet ? matchedFleet.defaultLokasi : 'Mabes';

      const newLog: VehicleLog = {
        id: newLogId,
        nomorLog,
        kendaraan: selectedVehicle,
        platNomor: matchedFleet?.platNomor || '',
        lokasiParkir: defaultLoc,
        memberId: selectedMember ? selectedMember.id : (currentUser.memberId || 'm-self'),
        namaPemakai: namaPemohon || currentUser.name,
        departemenPemakai: departemenPemohon || currentUser.department || 'Organisasi',
        kontakPemakai: kontakPemohon || currentUser.phone || '',
        strukturUnit: currentUser.role,
        kegiatan: namaKegiatan.trim(),
        tujuan: tujuanLokasi.trim(),
        keteranganSingkat: keteranganSingkat.trim(),
        isUntukOrganisasi: true,
        jumlahPenumpang: Number(jumlahPenumpang) || 1,
        jenisPenggunaan,
        isUrgent: jenisPenggunaan === 'Urgensi',
        alasanUrgensi: jenisPenggunaan === 'Urgensi' ? alasanUrgensi.trim() : undefined,
        sickVisitId: initialDraft?.sickVisitId,
        nomorPendampingan: initialDraft?.nomorPendampingan,
        tanggalMulai: tanggal,
        jamMulai: jamBerangkat,
        tanggalSelesai: tanggal,
        jamSelesai: jamKembali,
        status: 'Menunggu Persetujuan',
        kondisiAwal: 'Dalam pengecekan sebelum keberangkatan',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await onSubmitRequest(newLog);
      setSubmittedSuccess(true);
    } catch (err: any) {
      setValidationError(err?.message || 'Gagal mengirim pengajuan kendaraan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto animate-fade-in text-white shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Pengajuan Berhasil Dikirim!
          </h2>
          <p className="text-sm text-slate-300">
            Pengajuan Anda telah tercatat dan sedang <strong>Menunggu Persetujuan</strong> dari penanggung jawab kendaraan organisasi.
          </p>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5 text-slate-400">
          <p><span className="text-slate-500">Kendaraan:</span> <strong className="text-slate-200">{selectedVehicle}</strong></p>
          <p><span className="text-slate-500">Kegiatan:</span> <strong className="text-slate-200">{namaKegiatan}</strong></p>
          <p><span className="text-slate-500">Jadwal:</span> <strong className="text-slate-200">{tanggal} ({jamBerangkat} – {jamKembali})</strong></p>
          <p><span className="text-slate-500">Tujuan:</span> <strong className="text-slate-200">{tujuanLokasi}</strong></p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-black text-sm shadow-lg cursor-pointer transition-all"
          >
            Kembali ke Menu Kendaraan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-white pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">Form Ajukan Kendaraan</h1>
            <p className="text-xs text-slate-400">Isi formulir sederhana di bawah ini untuk pengajuan peminjaman mobil</p>
          </div>
        </div>
      </div>

      {/* Auto-filled from Sick Visit Alert */}
      {initialDraft?.nomorPendampingan && (
        <div className="p-4 rounded-2xl bg-blue-950/70 border border-blue-600/60 text-blue-200 text-xs flex items-start gap-3 shadow-lg animate-fade-in">
          <Info className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
          <div>
            <p className="font-bold text-white">Terhubung dengan Pendampingan Anggota Sakit ({initialDraft.nomorPendampingan})</p>
            <p className="text-blue-300/80 text-[11px] mt-0.5">
              Data tujuan, waktu, dan keperluan telah otomatis diisi dari laporan pendampingan. Anda tinggal memilih armada yang siap digunakan.
            </p>
          </div>
        </div>
      )}

      {validationError && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-bold">Perhatian</p>
            <p className="mt-0.5">{validationError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Bagian 1 — Untuk Apa? */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 text-[10px] inline-flex items-center justify-center font-mono">1</span>
            <span>Untuk Kegiatan Apa?</span>
          </div>

          {/* Mandatory Organization Question */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="block text-xs font-black text-slate-200">
              Apakah ini untuk kepentingan / program kerja organisasi? <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsUntukOrganisasi(true)}
                className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  isUntukOrganisasi === true
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ya — Untuk Organisasi</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUntukOrganisasi(false)}
                className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  isUntukOrganisasi === false
                    ? 'bg-red-950/80 text-red-300 border-red-600 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>Tidak / Pribadi</span>
              </button>
            </div>

            {isUntukOrganisasi === false && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs mt-2 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <p className="font-medium">
                  «Kendaraan operasional hanya digunakan untuk kebutuhan dan program kerja organisasi.» Pengajuan untuk kepentingan pribadi tidak dapat diproses.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Nama Kegiatan <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: Konsolidasi Cabang / Antar Pengurus"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Tujuan / Lokasi <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={tujuanLokasi}
                onChange={(e) => setTujuanLokasi(e.target.value)}
                placeholder="Contoh: RS Metro Hospital / Kantor DPC KASBI"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Keterangan Singkat (Opsional)
            </label>
            <input
              type="text"
              value={keteranganSingkat}
              onChange={(e) => setKeteranganSingkat(e.target.value)}
              placeholder="Catatan tambahan mengenai keperluan atau rute..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bagian 2 — Kapan Digunakan? */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 text-[10px] inline-flex items-center justify-center font-mono">2</span>
            <span>Kapan Digunakan?</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Tanggal <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Jam Berangkat <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={jamBerangkat}
                onChange={(e) => setJamBerangkat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Perkiraan Jam Kembali <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={jamKembali}
                onChange={(e) => setJamKembali(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Bagian 3 — Siapa & Urgensi */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 text-[10px] inline-flex items-center justify-center font-mono">3</span>
            <span>Siapa Yang Mengajukan & Penumpang</span>
          </div>

          {/* Pick Member (if Admin) */}
          {isSuperAdminOrPengurus && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Pilih Anggota Pemohon (Opsional jika mewakili anggota lain)
              </label>
              <MemberSearchSelect
                members={members}
                selectedMember={selectedMember}
                onSelectMember={handleMemberSelect}
                placeholder="Ketik nama atau NIK anggota..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Nama Pemohon</label>
              <input
                type="text"
                value={namaPemohon}
                onChange={(e) => setNamaPemohon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Departemen / Unit</label>
              <input
                type="text"
                value={departemenPemohon}
                onChange={(e) => setDepartemenPemohon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Nomor Kontak / WhatsApp</label>
              <input
                type="text"
                value={kontakPemohon}
                onChange={(e) => setKontakPemohon(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Jumlah Penumpang</label>
              <input
                type="number"
                min="1"
                max="7"
                value={jumlahPenumpang}
                onChange={(e) => setJumlahPenumpang(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Urgensi Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Jenis Penggunaan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setJenisPenggunaan('Biasa')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    jenisPenggunaan === 'Biasa'
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Biasa
                </button>

                <button
                  type="button"
                  onClick={() => setJenisPenggunaan('Urgensi')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    jenisPenggunaan === 'Urgensi'
                      ? 'bg-red-950 text-red-300 border-red-600 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  🚨 Urgensi
                </button>
              </div>
            </div>
          </div>

          {jenisPenggunaan === 'Urgensi' && (
            <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-2xl space-y-2">
              <label className="text-xs font-black text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Alasan Urgensi / Kondisi Darurat <span className="text-red-400">*</span>
              </label>
              <textarea
                value={alasanUrgensi}
                onChange={(e) => setAlasanUrgensi(e.target.value)}
                placeholder="Contoh: Mengantar anggota kritis ke RS rujukan / insiden darurat pabrik..."
                rows={2}
                className="w-full bg-slate-950 border border-red-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                required
              />
              <p className="text-[11px] text-red-400/80">
                «Urgensi boleh mempercepat proses, tetapi penggunaan tetap harus dicatat demi akuntabilitas SOP.»
              </p>
            </div>
          )}
        </div>

        {/* Bagian 4 — Pilih Kendaraan (Pemeriksaan Otomatis) */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 text-[10px] inline-flex items-center justify-center font-mono">4</span>
              <span>Pilihan Kendaraan Tersedia</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Pemeriksaan bentrok jadwal otomatis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {vehicleAvailability.map(({ fleet, isAvailable, reason }) => {
              const isSelected = selectedVehicle === fleet.name;

              return (
                <div
                  key={fleet.name}
                  onClick={() => {
                    if (isAvailable || jenisPenggunaan === 'Urgensi') {
                      setSelectedVehicle(fleet.name);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30'
                      : isAvailable
                      ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-red-900/40 opacity-70 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${
                        isSelected ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{fleet.label}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {fleet.platNomor} • {fleet.kapasitas}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isAvailable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          🟢 Tersedia
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                          🔴 Terpakai / Bentrok
                        </span>
                      )}
                    </div>
                  </div>

                  {!isAvailable && reason && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-red-400">
                      {reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isAnyVehicleAvailable && jenisPenggunaan !== 'Urgensi' && (
            <div className="p-4 bg-amber-950/60 border border-amber-800 rounded-2xl text-amber-300 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Maaf, seluruh armada sedang digunakan atau dijadwalkan pada waktu tersebut. Silakan pilih jam atau tanggal lain.
              </span>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isUntukOrganisasi !== true || (!isAnyVehicleAvailable && jenisPenggunaan !== 'Urgensi')}
            className={`px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all cursor-pointer ${
              isUntukOrganisasi !== true || (!isAnyVehicleAvailable && jenisPenggunaan !== 'Urgensi')
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : jenisPenggunaan === 'Urgensi'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/60 hover:scale-[1.02]'
                : 'bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white shadow-indigo-950/60 hover:scale-[1.02]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Mengirim Pengajuan...'
                : jenisPenggunaan === 'Urgensi'
                ? 'AJUKAN SEKARANG 🚨'
                : 'KIRIM PENGAJUAN'}
            </span>
          </button>
        </div>

      </form>
    </div>
  );
};
