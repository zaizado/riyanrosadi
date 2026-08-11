export type UserRole = 
  | 'Super Admin'
  | 'Ketua'
  | 'Sekretaris'
  | 'Pengurus'
  | 'Administrator';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  nik: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  phoneNumber?: string;
  isSuperAdmin?: boolean;
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

export type SickVisitStatus = 'Menunggu Kunjungan' | 'Sedang Didampingi' | 'Selesai';

export interface SickVisitLog {
  id: string;
  tanggal: string;
  penulis: string;
  catatan: string;
  kondisiTerbaru: string;
  fotoUrl?: string;
}

export interface SickVisit {
  id: string;
  nomorPendampingan: string; // SAK-2026-001
  memberId: string;
  namaAnggota: string;
  nikAnggota: string;
  departemen: string;
  nomorHp: string;
  lokasi: string; // Nama RS atau Alamat Rumah
  jenisLokasi: 'Rumah Sakit' | 'Rumah';
  diagnosaSingkat?: string;
  catatanAwal: string;
  tanggalKunjunganAwal: string;
  status: SickVisitStatus;
  pengurusPenanggungJawab: string;
  fotoDokumentasiUrl?: string[];
  riwayatKunjungan: SickVisitLog[];
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

export interface OrganizationAgenda {
  id: string;
  judul: string;
  jenis: AgendaType;
  tanggalWaktu: string;
  lokasi: string;
  penanggungJawab: string;
  deskripsi: string;
  daftarPeserta: string[]; // List of names or roles
  dokumentasiUrl?: string[];
  status: 'Akan Datang' | 'Berjalan' | 'Selesai' | 'Dibatalkan';
  notifikasiTerkirim: boolean;
  notulensi?: NotulensiAgenda;
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
  modul: 'Data Anggota' | 'Advokasi' | 'Anggota Sakit' | 'Agenda' | 'Sembako' | 'Kendaraan' | 'Keuangan' | 'Penggalangan Dana' | 'Simulasi Pesangon' | 'Sistem';
  aksi: string;
  detail: string;
}

export type FamilyRelationship = 'Anggota' | 'Anak' | 'Istri' | 'Suami' | 'Orang Tua';
export type HealthCondition = 'Sakit' | 'Meninggal';
export type CampaignStatus = 'Sedang Berjalan' | 'Selesai' | 'Ditutup';

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
}

export type VehicleType = 'Mitsubishi Xpander' | 'Daihatsu Xenia';
export type VehicleStatus = 'Sedang Digunakan' | 'Sudah Kembali' | 'Dibatalkan';
export type ParkingLocation = 'Mabes' | 'JV A' | 'JV B';

export interface VehicleLog {
  id: string;
  nomorLog: string; // e.g. MOB-2026-001
  kendaraan: VehicleType;
  platNomor: string; // e.g. B 1928 SBN
  lokasiParkir?: ParkingLocation; // Mabes, JV A, JV B
  memberId: string;
  namaPemakai: string; // Siapa yang memakai
  departemenPemakai: string;
  petugasSerahTerima: string; // Serah terima oleh pengurus/petugas
  tujuan: string; // Tujuan penggunaan
  tanggalMulai: string;
  jamMulai: string;
  tanggalSelesai: string;
  jamSelesai: string;
  kondisiAwal: string; // Kondisi saat serah terima
  kondisiKembali?: string;
  status: VehicleStatus;
  catatan?: string;
  updatedAt: string;
}


