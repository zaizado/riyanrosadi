export type UserRole = 
  | 'Super Admin'
  | 'Ketua'
  | 'Sekretaris'
  | 'Pengurus'
  | 'Administrator';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  nik: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  phoneNumber?: string;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  lastActive?: string;
}

export const checkIsSuperAdmin = (user?: UserAccount | null): boolean => {
  if (!user) return false;
  return (
    user.role === 'Super Admin' ||
    user.isSuperAdmin === true ||
    user.username === 'sbnkasbivci1' ||
    user.username === 'superadmin' ||
    user.id === 'usr-superadmin'
  );
};

export const checkIsAdmin = (user?: UserAccount | null, fbUser?: { email?: string | null } | null): boolean => {
  const emailLower = (user?.email || fbUser?.email || '').toLowerCase();
  const superAdminEmails = [
    'superadmin@sbn-kasbi-vci.or.id',
    'riyanrosadi@sbn-kasbi-vci.or.id',
    'riyanrosadi@gmail.com'
  ];
  if (emailLower && superAdminEmails.includes(emailLower)) {
    return true;
  }

  if (!user) return false;

  if (checkIsSuperAdmin(user)) {
    return true;
  }

  const adminRoles = ['Ketua', 'Sekretaris', 'Administrator', 'Admin', 'Bendahara'];
  return (
    adminRoles.includes(user.role) ||
    user.isAdmin === true
  );
};

export const canApproveRequests = (user?: UserAccount | null): boolean => {
  if (!user) return false;
  return (
    user.role === 'Super Admin' ||
    user.role === 'Ketua' ||
    user.role === 'Sekretaris' ||
    user.role === 'Administrator' ||
    user.isSuperAdmin === true ||
    user.username === 'sbnkasbivci1' ||
    user.username === 'superadmin' ||
    user.id === 'usr-superadmin'
  );
};

export type Gender = 'Laki-laki' | 'Perempuan';
export type MemberStatus = 'Aktif' | 'Tidak Aktif' | 'Non-Aktif';
export type EmploymentStatus = 'PKWTT' | 'PKWT' | 'Training';
export type ShiftType = 'Shift 1' | 'Shift 2' | 'Shift 3' | 'Non Shift';

export interface Member {
  id: string;
  nomorAnggota: string; // e.g. SBN-VCI-0012
  nik: string; // NIK Karyawan
  namaLengkap: string;
  jenisKelamin: Gender;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  nomorHp: string;
  email: string;
  gedung?: string; // e.g. N1-N4, Building B
  lokasi?: string; // e.g. JV, JVB
  departemen: string; // Cutting, Sewing, Assembly, Bottom, Quality, HR, Maintenance, Logistics
  bagian: string; // e.g. Line 04, Stockfit, Stitching 12
  jabatanKerja: string; // e.g. Operator Sewing, Leader, Inspector
  statusKeanggotaan: MemberStatus;
  tanggalBergabung: string;
  unionName?: string; // e.g. SBN-KASBI
  upahPokok?: number;
  tunjanganTetap?: number;
  fotoUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
  lastImportedAt?: string;
  lastImportedBy?: string;
  importBatchId?: string;
  lastImportBatchId?: string;
  sourceFileName?: string;
  source?: string; // e.g. 'management_excel'
  isMissingFromExcel?: boolean;
  isNewFromExcel?: boolean;
  inactiveSince?: string;
  reactivatedAt?: string;
}

export interface ImportHistoryRecord {
  id: string;
  importBatchId: string;
  timestamp: string;
  importedAt: string;
  importedBy: string;
  fileName: string;
  sourceFileName: string;
  totalRows: number;
  newMembers: number;
  updatedMembers: number;
  inactiveMembers: number;
  reactivatedMembers: number;
  errors: number;
  status: 'Sukses' | 'Gagal';
}

export interface DeletedMemberAudit {
  id: string;
  memberId: string;
  nomorAnggota: string;
  nik: string;
  namaLengkap: string;
  departemen: string;
  bagian: string;
  alasanPenghapusan: string;
  keteranganDetail: string;
  deletedBy: string;
  deletedAt: string;
}

export type AdvocacyStatus = 
  | 'Baru' 
  | 'Dalam Pendampingan' 
  | 'Mediation' 
  | 'Mediasi' 
  | 'Negosiasi' 
  | 'Selesai' 
  | 'Ditutup';

export interface AdvocacyUpdate {
  id: string;
  tanggal: string;
  penulis: string;
  catatan: string;
  statusSebelumnya: AdvocacyStatus;
  statusBaru: AdvocacyStatus;
  fotoDokumenUrl?: string;
}

export interface AdvocacyCase {
  id: string;
  nomorKasus: string; // ADV-2026-001
  memberId: string;
  namaAnggota: string;
  nikAnggota: string;
  departemen: string;
  judulKasus: string;
  kategori: 'Hubungan Industrial' | 'Sanksi/SP' | 'K3/Kecelakaan Kerja' | 'Hak Pesangon/Mutasi' | 'Lainnya';
  tanggalDibuat: string;
  status: AdvocacyStatus;
  pendampingUtama: string; // Nama pengurus
  deskripsiMasalah: string;
  lampiranUrl?: string[];
  riwayatPerkembangan: AdvocacyUpdate[];
}

export type SickVisitStatus = 
  | 'Dilaporkan'
  | 'Menunggu Koordinasi'
  | 'Disetujui'
  | 'Ditugaskan'
  | 'Dalam Pendampingan'
  | 'Selesai'
  | 'Ditolak'
  | 'Menunggu Kunjungan' // Legacy compatibility
  | 'Sedang Didampingi'; // Legacy compatibility

export type PasienRelation = 'Anggota Sendiri' | 'Anak' | 'Suami/Istri' | 'Orang Tua' | 'Lainnya';
export type LokasiAwalType = 'Perusahaan' | 'Tempat tinggal anggota' | 'Lainnya';
export type TransportasiType = 'Mobil Operasional' | 'Motor Pribadi' | 'Kendaraan Pribadi' | 'Grab' | 'Lainnya';
export type HasilPendampinganType = 'RAWAT INAP' | 'DIPULANGKAN' | 'Belum Ditentukan';
export type WilayahTujuan = 'Tangerang' | 'Di luar Tangerang';

export interface SickVisitAkomodasi {
  jenisTransportasi: TransportasiType;
  wilayah: WilayahTujuan;
  jumlahPetugas: number;
  isLuarJamKerja: boolean;
  isLuarRsKerjaSama: boolean;
  isDariKlinikPabrik: boolean;
  tarifPerOrang: number;
  tambahanLuarJam: number;
  totalAkomodasi: number;
  keteranganPerhitungan: string;
  statusVerifikasi: 'Otomatis Sesuai SOP' | 'Perlu Verifikasi Pengurus' | 'Terverifikasi';
}

export interface SickVisitPenjemputan {
  isDibutuhkan: boolean;
  tanggalPenjemputan?: string;
  petugasPenjemputan?: string;
  transportasi?: TransportasiType;
  status: 'Belum Dijemput' | 'Sudah Dijemput' | 'Tidak Membutuhkan Penjemputan';
  catatan?: string;
  updatedAt?: string;
}

export interface SickVisitChecklistBantuan {
  administrasiRs: boolean;
  prosesPendaftaran: boolean;
  koordinasiRsKeluarga: boolean;
  lainnya?: string;
}

export interface SickVisitLog {
  id: string;
  tanggal: string;
  penulis: string;
  catatan: string;
  kondisiTerbaru: string;
  fotoUrl?: string;
  waktu?: string;
  tahap?: string;
}

export interface SickVisit {
  id: string;
  nomorPendampingan: string; // SAK-2026-001
  memberId: string;
  namaAnggota: string;
  nikAnggota: string;
  departemen: string;
  nomorHp: string;

  // Identitas Pasien (SOP Tahap 1)
  jenisPasien?: 'Anggota' | 'Keluarga';
  hubunganPasien?: PasienRelation;
  namaPasien?: string;
  keteranganHubunganLain?: string;
  statusVerifikasiPasien?: 'Valid SOP' | 'Perlu Verifikasi Pengurus';

  // Kondisi & Urgensi (SOP Tahap 2)
  isUrgent?: boolean;
  deskripsiKondisi?: string;
  kebutuhanPendampingan?: string;

  // Lokasi Pasien (SOP Tahap 3)
  lokasiAwal?: LokasiAwalType;
  catatanLokasiLain?: string;
  statusVerifikasiLokasi?: 'Valid SOP' | 'Perlu Keputusan Pengurus';

  // Rumah Sakit Tujuan (SOP Tahap 4)
  rumahSakitTujuan?: string;
  alamatRs?: string;
  isRsKerjaSama?: boolean;
  waktuKeberangkatan?: string;
  kebutuhanPelayanan?: string;

  // Alur Persetujuan & Koordinasi (SOP Tahap 5)
  dikoordinasikanDengan?: string;
  catatanKoordinasi?: string;
  disetujuiOleh?: string;
  tanggalDisetujui?: string;
  alasanPenolakan?: string;
  ditolakOleh?: string;
  tanggalDitolak?: string;

  // Penugasan Petugas (SOP Tahap 6)
  petugas1?: string;
  petugas2?: string;
  ditugaskanOleh?: string;
  waktuPenugasan?: string;
  catatanPenugasan?: string;
  isMenggunakanKoorlap?: boolean;
  alasanPenggunaanKoorlap?: string;

  // Transportasi (SOP Tahap 7)
  transportasi?: TransportasiType;
  kendaraanOperasionalDigunakan?: string;
  alasanGrab?: string;
  butuhKendaraan?: boolean;
  vehicleLogId?: string;
  nomorLogKendaraan?: string;

  // Pelaksanaan (SOP Tahap 8)
  waktuBerangkat?: string;
  waktuTiba?: string;
  catatanPelaksanaan?: string;
  checklistBantuan?: SickVisitChecklistBantuan;

  // Hasil Pendampingan (SOP Tahap 9)
  hasilPendampingan?: HasilPendampinganType;
  waktuHasil?: string;
  ruangPerawatan?: string;
  catatanHasil?: string;
  petugasPenyelesaiAwal?: string;

  // Penjemputan Pasca Rawat Inap (SOP Tahap 10)
  penjemputanPascaRawatInap?: SickVisitPenjemputan;

  // Perhitungan Akomodasi (SOP Tahap 11)
  akomodasi?: SickVisitAkomodasi;

  // Gratifikasi (SOP Tahap 12)
  pernyataanBebasGratifikasi?: boolean;
  pernyataanOleh?: string;
  waktuPernyataan?: string;

  // Laporan Akhir & Grup PTP (SOP Tahap 13)
  sudahLaporGrupPtp?: boolean;
  waktuLaporGrupPtp?: string;
  pelaporGrupPtp?: string;

  // Legacy & Standard fields for full compatibility
  lokasi: string; // Nama RS atau Alamat Rumah
  jenisLokasi: 'Rumah Sakit' | 'Rumah';
  diagnosaSingkat?: string;
  catatanAwal: string;
  tanggalKunjunganAwal: string;
  status: SickVisitStatus;
  pengurusPenanggungJawab: string;
  fotoDokumentasiUrl?: string[];
  riwayatKunjungan: SickVisitLog[];

  updatedAt?: string;
  updatedBy?: string;
  createdAt?: string;
  createdBy?: string;
}

export type AgendaType = 
  | 'Rapat' 
  | 'Konsolidasi' 
  | 'Pendidikan' 
  | 'Pelatihan' 
  | 'Demonstrasi' 
  | 'Audiensi' 
  | 'Kunjungan' 
  | 'Kegiatan Sosial' 
  | 'Lainnya';

export interface TindakLanjutItem {
  id: string;
  task: string;
  pic: string;
  deadline: string;
  status: 'Belum Dimulai' | 'Berjalan' | 'Selesai';
  notes?: string;
}

export interface LampiranNotulensiItem {
  id: string;
  fileName: string;
  fileType: string;
  fileDataUrl: string;
  uploadedAt: string;
}

export interface NotulensiHistoryItem {
  id: string;
  changedBy: string;
  userRole?: string;
  changedAt: string;
  summary: string;
}

export interface NotulensiAgenda {
  id: string;
  agendaId: string;
  judulRapat: string;
  tanggalWaktu: string;
  tempat: string;
  pimpinanRapat: string;
  notulis: string;
  pesertaText: string;
  agendaPembahasan: string;
  isiPembahasan: string;
  keputusanRapat: string[];
  aspirasiMasukan?: string;
  catatanTambahan?: string;
  tindakLanjutList: TindakLanjutItem[];
  lampiranList?: LampiranNotulensiItem[];
  history?: NotulensiHistoryItem[];
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;

  // Legacy field support for fallback
  judulNotulensi?: string;
  waktuDibuat?: string;
  isiNotulensi?: string;
  poinKeputusan?: string[];
  fileLampiranName?: string;
  fileLampiranDataUrl?: string;
}

export interface NotulensiFileItem {
  id: string;
  agendaId: string;
  fileName: string;
  fileType: string;
  fileSize: number | string;
  storagePath: string;
  downloadUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
  updatedAt?: string;
}

export interface OrganizationAgenda {
  id: string;
  judul: string;
  jenis: AgendaType;
  tanggalWaktu: string;
  tanggal?: string;
  waktu?: string;
  lokasi: string;
  penanggungJawab: string;
  deskripsi: string;
  daftarPeserta: string[]; // List of names or roles
  dokumentasiUrl?: string[];
  status: 'Akan Datang' | 'Berjalan' | 'Selesai' | 'Dibatalkan';
  notifikasiTerkirim?: boolean;
  notulensi?: NotulensiAgenda;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SembakoEvent {
  id: string;
  namaEvent: string;
  tanggal: string;
  lokasi: string;
  jenisPaket: string; // e.g. Paket Sembako Beras 10kg + Minyak 2L + Gula 1kg + Sirup
  keterangan: string;
  status: 'Aktif' | 'Selesai' | 'Draf';
  totalPenerima: number;
  totalSudahAmbil: number;
}

export interface SembakoClaim {
  id: string;
  eventId: string;
  memberId: string;
  nomorAnggota: string;
  nik: string;
  namaLengkap: string;
  departemen: string;
  bagian: string;
  qrCode: string; // Unik token per event:member
  status: 'Belum Ambil' | 'Sudah Ambil';
  waktuPengambilan?: string;
  petugasScan?: string;
  updatedAt?: string;
}

export interface DailyExpenseItem {
  id: string;
  waktu: string;
  nominal: number;
  keterangan: string;
  kategori: string;
  penerimaNota?: string;
  updatedBy?: string;
}

export interface FinanceDailyRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  saldoAwal: number;
  uangCosMasuk: number;
  keteranganCos?: string;
  pengeluaranItems: DailyExpenseItem[];
  catatanHarian?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userNama: string;
  userRole: UserRole;
  userId?: string;
  actorUid?: string;
  modul: 'Data Anggota' | 'Advokasi' | 'Anggota Sakit' | 'Agenda' | 'Sembako' | 'Kendaraan' | 'Keuangan' | 'Penggalangan Dana' | 'Simulasi Pesangon' | 'Sistem';
  aksi: string;
  detail: string;
  deletedMemberAudit?: DeletedMemberAudit;
}

export type FamilyRelationship = 'Anggota' | 'Anak' | 'Istri' | 'Suami' | 'Orang Tua';
export type HealthCondition = 'Sakit' | 'Meninggal';
export type CampaignStatus = 'Sedang Berjalan' | 'Selesai' | 'Ditutup';

// --- REFACTOR V2 PENGGALANGAN DANA ---
export type FundraisingTahapProses = 
  | "DRAFT" 
  | "VERIFIKASI" 
  | "MAP DIBUAT" 
  | "MAP DIEDARKAN" 
  | "PENGUMPULAN" 
  | "MAP DIKEMBALIKAN" 
  | "VERIFIKASI DDU" 
  | "SIAP DISERAHKAN" 
  | "SUDAH DISERAHKAN" 
  | "SELESAI"
  | "LEGACY";

export type StatusMinimumSop = 
  | "Memenuhi Minimum SOP" 
  | "Belum Memenuhi Minimum SOP" 
  | "Perlu Verifikasi Pengurus";

export type SumberDanaFundraising = "Sukarela Karyawan" | "COS Organisasi";

export interface FundraisingMapSosialisasi {
  dibuat: boolean;
  tanggalDibuat?: string;
  dibuatOleh?: string;
  checklistDiisi: boolean;
  tanggalChecklist?: string;
  diedarkan: boolean;
  tanggalDiedarkan?: string;
  dikembalikan: boolean;
  tanggalDikembalikan?: string;
  dikembalikanOleh?: string;
  catatan?: string;
}

export interface FundraisingDistribusiDepartemen {
  id: string;
  namaDepartemen: string;
  statusMap: "Belum Diedarkan" | "Sudah Diedarkan" | "Sudah Dikembalikan";
  petugas?: string;
  tanggalDiedarkan?: string;
  tanggalDikembalikan?: string;
  jumlahDana: number;
  catatan?: string;
}

export interface FundraisingPenyerahanDana {
  status: "Belum Diserahkan" | "Sudah Diserahkan";
  penerimaNama?: string;
  penerimaMemberId?: string;
  jumlahDiserahkan?: number;
  tanggalPenyerahan?: string;
  tempatPenyerahan?: "Perusahaan" | "Rumah" | "Lainnya";
  diserahkanOleh?: string;
  catatan?: string;
}
// ------------------------------------

export interface FundraisingCampaign {
  id: string;
  nomorPenggalangan: string; // e.g. DANA-2026-001
  memberId: string;
  namaAnggota: string;
  nikAnggota: string;
  departemen: string;
  nomorHp: string;
  hubungan: FamilyRelationship;
  kondisi: HealthCondition;
  keterangan: string;
  picMemberId?: string;
  picNama: string;
  picNik: string;
  tanggalDigalang: string; // YYYY-MM-DD
  jumlahTerkumpul: number; // Nominal rupiah
  isDidampingiKeRs: boolean; // Apakah Anggota ini sakit didampingi ke RS oleh pengurus atau tidak
  status: CampaignStatus;
  dibuatOleh: string;
  createdAt: string;
  updatedAt?: string;

  // --- REFACTOR V2 BARU ---
  
  // TAHAP 1 — IDENTITAS MUSIBAH
  jenisPenerima?: 'Anggota' | 'Keluarga';
  namaPasien?: string;
  hubunganPasien?: FamilyRelationship | string;
  statusVerifikasiKeluarga?: 'Belum Diverifikasi' | 'Valid' | 'Perlu Verifikasi Pengurus';
  
  // TAHAP 2 & 3 — VALIDASI KONDISI & SICK VISIT
  isRawatInap?: boolean;
  sickVisitId?: string;
  nomorPendampingan?: string;

  // TAHAP 4 — MINIMUM PENGGALANGAN
  minimumSesuaiSop?: number;
  statusMinimum?: StatusMinimumSop;

  // TAHAP 5 — SUMBER DANA
  sumberDana?: SumberDanaFundraising[];

  // TAHAP 6 — MAP SOSIALISASI
  mapSosialisasi?: FundraisingMapSosialisasi;

  // TAHAP 7 — DISTRIBUSI DEPARTEMEN
  distribusiDepartemen?: FundraisingDistribusiDepartemen[];

  // TAHAP 9 — DDU
  penanggungJawabDduNama?: string;
  penanggungJawabDduId?: string;
  tanggalVerifikasiDdu?: string;
  statusVerifikasiDdu?: 'Belum Diverifikasi' | 'Diverifikasi DDU';

  // TAHAP 10 — WORKFLOW STATUS
  tahapProses?: FundraisingTahapProses;

  // TAHAP 12 — PENYERAHAN DANA
  penyerahanDana?: FundraisingPenyerahanDana;
}

export type VehicleType = 'Mitsubishi Xpander' | 'Daihatsu Xenia' | string;
export type VehicleConditionStatus = 'Tersedia' | 'Sedang Digunakan' | 'Perlu Diperiksa' | 'Dalam Perbaikan';
export type VehicleLogStatus = 
  | 'Menunggu Persetujuan' 
  | 'Disetujui' 
  | 'Siap Digunakan' 
  | 'Sedang Digunakan' 
  | 'Sudah Kembali' 
  | 'Selesai' 
  | 'Ditolak' 
  | 'Dibatalkan' 
  | 'Perlu Diperiksa';

// Keep VehicleStatus as alias / union for full backwards compatibility
export type VehicleStatus = VehicleLogStatus;

export type ParkingLocation = 'Mabes' | 'JV A' | 'JV B';

export interface VehicleChecklistItems {
  ban: 'Baik' | 'Bermasalah';
  rem: 'Baik' | 'Bermasalah';
  lampu: 'Baik' | 'Bermasalah';
  oli: 'Baik' | 'Bermasalah';
  airRadiator: 'Baik' | 'Bermasalah';
  bbm: string; // e.g. "Full", "3/4", "1/2", "1/4"
  kebersihan: 'Bersih' | 'Perlu Dicuci';
  perlengkapan: 'Lengkap' | 'Kurang';
  dokumen: 'Lengkap (STNK Ada)' | 'Bermasalah';
  kondisiFisik: 'Baik' | 'Ada Baret/Penyok';
  catatan?: string;
}

export interface VehicleReturnChecklist {
  kondisiKendaraan: 'Baik' | 'Bermasalah';
  kebersihan: 'Bersih' | 'Perlu Dicuci';
  bbm: string;
  adaKerusakan: boolean;
  penjelasanKerusakan?: string;
  fotoKerusakanUrl?: string;
  kmAkhir: number;
  fotoKendaraanUrl?: string;
  catatan?: string;
}

export interface VehicleLog {
  id: string;
  nomorLog: string; // e.g. MOB-2026-001
  kendaraan: VehicleType;
  platNomor?: string; // e.g. B 1928 SBN
  lokasiParkir?: ParkingLocation; // Mabes, JV A, JV B
  
  // Data Pemohon
  memberId: string;
  namaPemakai: string; // Siapa yang mengajukan/memakai
  departemenPemakai: string;
  kontakPemakai?: string;
  strukturUnit?: string;

  // Tujuan & Kegiatan
  kegiatan?: string;
  tujuan: string; // Tujuan / Lokasi
  keteranganSingkat?: string;
  isUntukOrganisasi?: boolean;
  jumlahPenumpang?: number;

  // Integrasi Pendampingan
  sickVisitId?: string;
  nomorPendampingan?: string;

  // Urgensi
  jenisPenggunaan?: 'Biasa' | 'Urgensi';
  isUrgent?: boolean;
  alasanUrgensi?: string;

  // Waktu Jadwal
  tanggalMulai: string; // YYYY-MM-DD
  jamMulai: string; // HH:mm
  tanggalSelesai: string; // YYYY-MM-DD
  jamSelesai: string; // HH:mm

  // Driver / Petugas
  driverNama?: string;
  driverKontak?: string;
  petugasSerahTerima?: string; // Serah terima oleh pengurus/petugas

  // Status Siklus Hidup (SOP)
  status: VehicleLogStatus;

  // Persetujuan
  disetujuiOleh?: string;
  tanggalDisetujui?: string;
  alasanPenolakan?: string;
  ditolakOleh?: string;
  tanggalDitolak?: string;

  // Cek Kendaraan Sebelum Berangkat
  checklistAwal?: VehicleChecklistItems;
  kmAwal?: number;
  fotoAwalUrl?: string;
  kondisiAwal?: string; // Legacy & text representation
  waktuMulaiPerjalanan?: string;

  // Cek Kendaraan Saat Kembali
  checklistAkhir?: VehicleReturnChecklist;
  kmAkhir?: number;
  jarakTempuhKm?: number;
  adaKerusakan?: boolean;
  penjelasanKerusakan?: string;
  fotoAkhirUrl?: string;
  kondisiKembali?: string;
  waktuKembali?: string;

  // Serah Terima Kembali
  diserahkanOleh?: string;
  diterimaOleh?: string;

  catatan?: string;
  isArchived?: boolean;
  alasanPenghapusan?: string;
  dihapusOleh?: string;

  updatedAt: string;
  createdAt?: string;
}



