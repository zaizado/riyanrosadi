import React, { useState } from 'react';
import { 
  X, 
  HeartPulse, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  Info, 
  Activity, 
  ShieldAlert,
  Car,
  ArrowRight
} from 'lucide-react';
import { 
  Member, 
  SickVisit, 
  UserAccount, 
  PasienRelation, 
  LokasiAwalType, 
  WilayahTujuan 
} from '../../types';
import { MemberSearchSelect } from '../MemberSearchSelect';
import { getLocalDateISO } from '../../utils/dateUtils';
import { 
  DAFTAR_RS_RUJUKAN, 
  isHubunganKeluargaValidSOP, 
  hitungAkomodasiSOP 
} from '../../utils/sickVisitUtils';

interface SickVisitAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newVisit: SickVisit) => void;
  members: Member[];
  currentUser: UserAccount;
  existingCount: number;
  onRequestVehicle?: (draft: any) => void;
}

export const SickVisitAddModal: React.FC<SickVisitAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  members,
  currentUser,
  existingCount,
  onRequestVehicle,
}) => {
  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [jenisPasien, setJenisPasien] = useState<'Anggota' | 'Keluarga'>('Anggota');
  const [hubunganPasien, setHubunganPasien] = useState<PasienRelation>('Anggota Sendiri');
  const [namaPasien, setNamaPasien] = useState('');
  const [keteranganHubunganLain, setKeteranganHubunganLain] = useState('');

  // Kondisi & Urgensi
  const [isUrgent, setIsUrgent] = useState(true);
  const [deskripsiKondisi, setDeskripsiKondisi] = useState('');

  // Kebutuhan Kendaraan
  const [butuhKendaraan, setButuhKendaraan] = useState(false);

  // Lokasi Pasien
  const [lokasiAwal, setLokasiAwal] = useState<LokasiAwalType>('Tempat tinggal anggota');
  const [catatanLokasiLain, setCatatanLokasiLain] = useState('');

  // Rumah Sakit Tujuan
  const [selectedRsPreset, setSelectedRsPreset] = useState<string>('RS Metro Hospital Cikupa');
  const [isCustomRs, setIsCustomRs] = useState(false);
  const [customRsNama, setCustomRsNama] = useState('');
  const [customRsAlamat, setCustomRsAlamat] = useState('');
  const [customRsWilayah, setCustomRsWilayah] = useState<WilayahTujuan>('Tangerang');
  const [waktuKeberangkatan, setWaktuKeberangkatan] = useState('Segera');

  if (!isOpen) return null;

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Cari detail RS
  const activeRsItem = DAFTAR_RS_RUJUKAN.find(r => r.nama === selectedRsPreset);
  const finalRsNama = isCustomRs ? customRsNama : (activeRsItem?.nama || selectedRsPreset);
  const finalRsAlamat = isCustomRs ? customRsAlamat : (activeRsItem?.alamat || '');
  const finalRsMitra = isCustomRs ? false : (activeRsItem?.isMitra ?? false);
  const finalRsWilayah = isCustomRs ? customRsWilayah : (activeRsItem?.wilayah || 'Tangerang');

  // Validasi Hubungan SOP
  const isKeluargaValid = jenisPasien === 'Anggota' ? true : isHubunganKeluargaValidSOP(hubunganPasien);
  const statusVerifikasiPasien = isKeluargaValid ? 'Valid SOP' : 'Perlu Verifikasi Pengurus';
  const statusVerifikasiLokasi = lokasiAwal === 'Lainnya' ? 'Perlu Keputusan Pengurus' : 'Valid SOP';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember) {
      alert('Pilih anggota dari database terlebih dahulu!');
      return;
    }

    if (jenisPasien === 'Keluarga' && !namaPasien.trim()) {
      alert('Masukkan nama keluarga yang sakit!');
      return;
    }

    if (lokasiAwal === 'Lainnya' && !catatanLokasiLain.trim()) {
      alert('Masukkan catatan/alasan lokasi penjemputan lainnya!');
      return;
    }

    if (isCustomRs && !customRsNama.trim()) {
      alert('Masukkan nama rumah sakit tujuan!');
      return;
    }

    if (!deskripsiKondisi.trim()) {
      alert('Deskripsi kondisi atau kebutuhan pendampingan wajib diisi!');
      return;
    }

    const todayDate = getLocalDateISO();
    const finalPasienName = jenisPasien === 'Keluarga' ? namaPasien.trim() : selectedMember.namaLengkap;
    const finalHubungan = jenisPasien === 'Keluarga' ? hubunganPasien : 'Anggota Sendiri';

    // Hitung estimasi awal akomodasi
    const estimasiAkomodasi = hitungAkomodasiSOP({
      lokasiAwal,
      transportasi: 'Mobil Operasional',
      wilayah: finalRsWilayah,
      jumlahPetugas: 1,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: !finalRsMitra
    });

    const newSickVisit: SickVisit = {
      id: `sak-${Date.now()}`,
      nomorPendampingan: `SAK-2026-${String(existingCount + 1).padStart(3, '0')}`,
      memberId: selectedMember.id,
      namaAnggota: selectedMember.namaLengkap,
      nikAnggota: selectedMember.nik,
      departemen: selectedMember.departemen,
      nomorHp: selectedMember.nomorHp || '',

      // Identitas Pasien
      jenisPasien,
      hubunganPasien: finalHubungan,
      namaPasien: finalPasienName,
      keteranganHubunganLain: hubunganPasien === 'Lainnya' ? keteranganHubunganLain : undefined,
      statusVerifikasiPasien,

      // Kondisi & Urgensi
      isUrgent,
      deskripsiKondisi: deskripsiKondisi.trim(),
      kebutuhanPendampingan: deskripsiKondisi.trim(),

      // Lokasi Pasien
      lokasiAwal,
      catatanLokasiLain: lokasiAwal === 'Lainnya' ? catatanLokasiLain.trim() : undefined,
      statusVerifikasiLokasi,

      // RS Tujuan
      rumahSakitTujuan: finalRsNama,
      alamatRs: finalRsAlamat,
      isRsKerjaSama: finalRsMitra,
      waktuKeberangkatan: waktuKeberangkatan.trim(),

      // Workflow Status
      status: 'Dilaporkan',
      pengurusPenanggungJawab: currentUser.name,

      // Legacy Compatibility fields
      lokasi: `${finalRsNama} (${finalRsMitra ? 'RS Kerja Sama' : 'Non-Mitra'})`,
      jenisLokasi: 'Rumah Sakit',
      diagnosaSingkat: deskripsiKondisi.trim(),
      catatanAwal: `Laporan awal kondisi pasien: ${deskripsiKondisi.trim()}`,
      tanggalKunjunganAwal: todayDate,

      // Akomodasi estimasi awal
      akomodasi: estimasiAkomodasi,

      // Riwayat log awal
      riwayatKunjungan: [
        {
          id: `slog-${Date.now()}`,
          tanggal: todayDate,
          penulis: currentUser.name,
          catatan: `Laporan pendampingan sakit dicatat oleh ${currentUser.name}. Pasien: ${finalPasienName} (${finalHubungan}), Tujuan: ${finalRsNama}. Status: Menunggu koordinasi pengurus.`,
          kondisiTerbaru: deskripsiKondisi.trim(),
          tahap: 'Laporan Awal'
        }
      ],

      // Kebutuhan Kendaraan
      butuhKendaraan: butuhKendaraan,

      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    };

    onSubmit(newSickVisit);
    onClose();

    if (butuhKendaraan && onRequestVehicle) {
      onRequestVehicle({
        sickVisitId: newSickVisit.id,
        nomorPendampingan: newSickVisit.nomorPendampingan,
        kegiatan: `Pendampingan Sakit: ${finalPasienName} (${finalHubungan})`,
        tujuan: finalRsNama || 'Rumah Sakit',
        keteranganSingkat: `Pendampingan sakit ${selectedMember.namaLengkap} (${selectedMember.nik}) ke ${finalRsNama}. Pasien: ${finalPasienName}.`,
        tanggalMulai: todayDate,
        isUrgent: isUrgent,
        alasanUrgensi: isUrgent ? `Urgensi pendampingan ${finalPasienName} di ${finalRsNama}` : undefined,
      });
    }
  };

  return (
    <div className="mobile-modal-backdrop z-50">
      <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-red-950 text-red-400 border border-red-800/50">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Lapor Pendampingan Anggota Sakit</h2>
            <p className="text-xs text-slate-400">Pencatatan awal sesuai SOP Program Organisasi PTP 2026–2029</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4 text-xs">
          
          {/* TAHAP 1: IDENTITAS PASIEN */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-rose-400" />
                <span>1. Identitas Anggota & Pasien (SOP Tahap 1)</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">SOP-01</span>
            </div>

            <MemberSearchSelect
              members={members}
              selectedMemberId={selectedMemberId}
              onSelectMember={(m) => {
                setSelectedMemberId(m ? m.id : '');
                if (m && jenisPasien === 'Anggota') {
                  setNamaPasien(m.namaLengkap);
                }
              }}
              label="Pilih Anggota dari Database KTA"
              placeholder="Ketik NIK, Nama Lengkap, atau Departemen..."
              required
            />

            {selectedMember && (
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">NIK & Dept:</span>
                  <span className="font-bold text-slate-200">{selectedMember.nik} • {selectedMember.departemen}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">No. WhatsApp/HP:</span>
                  <span className="font-bold text-slate-200">{selectedMember.nomorHp || '-'}</span>
                </div>
              </div>
            )}

            {/* Pilihan: Anggota vs Keluarga */}
            <div className="space-y-2 pt-1">
              <label className="block text-slate-400 font-semibold">Status Pasien yang Membutuhkan Pendampingan</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setJenisPasien('Anggota');
                    setHubunganPasien('Anggota Sendiri');
                    if (selectedMember) setNamaPasien(selectedMember.namaLengkap);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    jenisPasien === 'Anggota'
                      ? 'bg-rose-950/60 border-rose-600 text-white font-bold shadow-md shadow-rose-950/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <User className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-xs">A. Anggota Sendiri</p>
                    <p className="text-[10px] text-slate-500 font-normal">Karyawan terdaftar SBN</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setJenisPasien('Keluarga');
                    setHubunganPasien('Anak');
                    setNamaPasien('');
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    jenisPasien === 'Keluarga'
                      ? 'bg-amber-950/60 border-amber-600 text-white font-bold shadow-md shadow-amber-950/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <HeartPulse className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs">B. Keluarga Inti Anggota</p>
                    <p className="text-[10px] text-slate-500 font-normal">Anak / Pasangan / Orang Tua</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Form Tambahan jika Keluarga */}
            {jenisPasien === 'Keluarga' && (
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-amber-800/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Hubungan Keluarga Sesuai SOP <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={hubunganPasien}
                      onChange={(e) => setHubunganPasien(e.target.value as PasienRelation)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500"
                    >
                      <option value="Anak">Anak (SOP PTP)</option>
                      <option value="Suami/Istri">Suami / Istri (SOP PTP)</option>
                      <option value="Orang Tua">Orang Tua (SOP PTP)</option>
                      <option value="Lainnya">Lainnya (Perlu Verifikasi Pengurus)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Nama Lengkap Pasien <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={namaPasien}
                      onChange={(e) => setNamaPasien(e.target.value)}
                      placeholder="Nama anggota keluarga..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500"
                      required={jenisPasien === 'Keluarga'}
                    />
                  </div>
                </div>

                {hubunganPasien === 'Lainnya' && (
                  <div className="space-y-1.5">
                    <label className="block text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Keterangan Hubungan Lain (Perlu Keputusan Pengurus)</span>
                    </label>
                    <input
                      type="text"
                      value={keteranganHubunganLain}
                      onChange={(e) => setKeteranganHubunganLain(e.target.value)}
                      placeholder="Contoh: Keponakan yatim yang ditanggung anggota..."
                      className="w-full bg-slate-950 border border-amber-800/60 rounded-xl p-2.5 text-white"
                      required={hubunganPasien === 'Lainnya'}
                    />
                    <p className="text-[10px] text-amber-400/80">
                      * Status akan ditandai: <strong>"Perlu verifikasi pengurus"</strong> sebelum disetujui.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TAHAP 2: KONDISI DAN URGENSI */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400" />
                <span>2. Kondisi dan Kebutuhan Pendampingan (SOP Tahap 2)</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">SOP-02</span>
            </div>

            {/* Pertanyaan Utama SOP */}
            <div className="p-3 bg-red-950/40 rounded-xl border border-red-800/40 space-y-2">
              <label className="block text-red-300 font-black text-xs uppercase tracking-wider">
                APAKAH KONDISI MEMBUTUHKAN PENANGANAN SEGERA DI RUMAH SAKIT?
              </label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUrgent(true)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isUrgent
                      ? 'bg-red-600 border-red-500 text-white font-bold shadow-lg shadow-red-900/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-black">Ya — Urgent / Mendesak</p>
                  <p className="text-[10px] text-red-200">Fokus pendampingan SOP</p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUrgent(false)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    !isUrgent
                      ? 'bg-slate-800 border-slate-600 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">Tidak Mendesak</p>
                  <p className="text-[10px] text-slate-500">Perlu keputusan pengurus</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Deskripsi Kondisi / Kebutuhan Pendampingan <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={deskripsiKondisi}
                onChange={(e) => setDeskripsiKondisi(e.target.value)}
                placeholder="Deskripsikan kondisi pasien & bantuan yang dibutuhkan (misal: sesak nafas mendadak / demam tinggi butuh rujukan IGD / kecelakaan kerja)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:border-rose-500"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                * Sistem hanya mencatat kondisi dan kebutuhan pendampingan sesuai SOP, bukan diagnosis medis.
              </p>
            </div>
          </div>

          {/* TAHAP 3 & 4: LOKASI PASIEN & RUMAH SAKIT TUJUAN */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>3. Lokasi & Rumah Sakit Tujuan (SOP Tahap 3 & 4)</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">SOP-03 & 04</span>
            </div>

            {/* Lokasi Awal */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">
                Lokasi Penjemputan / Titik Awal Pasien
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Perusahaan', 'Tempat tinggal anggota', 'Lainnya'] as LokasiAwalType[]).map((lok) => (
                  <button
                    key={lok}
                    type="button"
                    onClick={() => setLokasiAwal(lok)}
                    className={`p-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                      lokasiAwal === lok
                        ? 'bg-blue-950 border-blue-600 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {lok === 'Perusahaan' ? '🏢 Pabrik / Klinik' : (lok === 'Tempat tinggal anggota' ? '🏠 Tempat Tinggal' : '📍 Lainnya')}
                  </button>
                ))}
              </div>
            </div>

            {lokasiAwal === 'Lainnya' && (
              <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/40 space-y-1.5">
                <label className="block text-amber-300 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Catatan / Alasan Lokasi Lainnya <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="text"
                  value={catatanLokasiLain}
                  onChange={(e) => setCatatanLokasiLain(e.target.value)}
                  placeholder="Sebutkan alamat detail & alasan lokasi penjemputan..."
                  className="w-full bg-slate-950 border border-amber-800/60 rounded-xl p-2.5 text-white"
                  required={lokasiAwal === 'Lainnya'}
                />
                <p className="text-[10px] text-amber-400/80">
                  * Lokasi ini akan ditandai: <strong>"Perlu keputusan pengurus"</strong>.
                </p>
              </div>
            )}

            {/* Rumah Sakit Tujuan */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="block text-slate-400 font-semibold">Rumah Sakit Tujuan</label>
                <button
                  type="button"
                  onClick={() => setIsCustomRs(!isCustomRs)}
                  className="text-xs text-rose-400 hover:underline font-bold"
                >
                  {isCustomRs ? '← Pilih dari Daftar RS Mitra' : '+ Ketik Nama RS Lain'}
                </button>
              </div>

              {!isCustomRs ? (
                <div className="space-y-2">
                  <select
                    value={selectedRsPreset}
                    onChange={(e) => setSelectedRsPreset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {DAFTAR_RS_RUJUKAN.map((rs) => (
                      <option key={rs.id} value={rs.nama}>
                        {rs.nama} ({rs.wilayah}) {rs.isMitra ? '— [RS Mitra Kerja Sama]' : ''}
                      </option>
                    ))}
                  </select>

                  {activeRsItem && (
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                      <div className="truncate pr-2">
                        <span className="text-slate-400 block text-[10px]">Alamat RS:</span>
                        <span className="font-semibold text-slate-200 truncate block">{activeRsItem.alamat}</span>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        activeRsItem.isMitra 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {activeRsItem.isMitra ? '✓ RS Kerja Sama' : 'Bukan Mitra'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Nama Rumah Sakit</label>
                    <input
                      type="text"
                      value={customRsNama}
                      onChange={(e) => setCustomRsNama(e.target.value)}
                      placeholder="Contoh: RS Siloam Lippo Karawaci"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                      required={isCustomRs}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Wilayah</label>
                      <select
                        value={customRsWilayah}
                        onChange={(e) => setCustomRsWilayah(e.target.value as WilayahTujuan)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                      >
                        <option value="Tangerang">Tangerang</option>
                        <option value="Di luar Tangerang">Di luar Tangerang (Jakarta/Serang)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Alamat / Lokasi Singkat</label>
                      <input
                        type="text"
                        value={customRsAlamat}
                        onChange={(e) => setCustomRsAlamat(e.target.value)}
                        placeholder="Kelapa Dua / Karawaci"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Perkiraan Waktu Keberangkatan</label>
                <input
                  type="text"
                  value={waktuKeberangkatan}
                  onChange={(e) => setWaktuKeberangkatan(e.target.value)}
                  placeholder="Contoh: Segera / Pukul 14.00 WIB / Shift 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* TAHAP 4: KEBUTUHAN KENDARAAN OPERASIONAL */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                <Car className="w-4 h-4 text-amber-400" />
                <span>4. Kebutuhan Kendaraan Operasional</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">INTEGRASI</span>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-300 font-medium text-xs">
                Apakah pendampingan ini membutuhkan peminjaman mobil operasional organisasi?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setButuhKendaraan(false)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    !butuhKendaraan
                      ? 'bg-slate-800 border-slate-600 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">Tidak Perlu Mobil</p>
                  <p className="text-[10px] text-slate-500">Kendaraan pribadi / mandiri</p>
                </button>

                <button
                  type="button"
                  onClick={() => setButuhKendaraan(true)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    butuhKendaraan
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-black flex items-center justify-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ya, Butuh Mobil</span>
                  </p>
                  <p className="text-[10px] text-indigo-200">Otomatis isi form kendaraan</p>
                </button>
              </div>
            </div>

            {butuhKendaraan && (
              <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40 text-xs text-indigo-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Setelah laporan disimpan, sistem akan otomatis membuka form permohonan kendaraan dengan data terisi lengkap (tanpa perlu ketik ulang).
                </span>
              </div>
            )}
          </div>

          {/* SOP Workflow Notice Banner */}
          <div className="p-3.5 bg-blue-950/30 rounded-2xl border border-blue-800/40 text-xs text-blue-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-200">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Alur Workflow SOP SBN KASBI:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Setelah dilaporkan, status akan masuk ke tahap <strong>Menunggu Koordinasi</strong> dengan Ketua/Sekretaris/Wakil Ketua sebelum persetujuan dan penugasan petugas pendamping.
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black shadow-lg shadow-red-900/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              Simpan Laporan Pendampingan
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
