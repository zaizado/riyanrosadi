import { 
  SickVisit, 
  SickVisitStatus, 
  PasienRelation, 
  LokasiAwalType, 
  TransportasiType, 
  WilayahTujuan, 
  SickVisitAkomodasi 
} from '../types';

export interface RsKerjaSamaItem {
  id: string;
  nama: string;
  wilayah: WilayahTujuan;
  alamat: string;
  telepon?: string;
  isMitra: boolean;
}

export const DAFTAR_RS_RUJUKAN: RsKerjaSamaItem[] = [
  { id: 'rs-1', nama: 'RS Metro Hospital Cikupa', wilayah: 'Tangerang', alamat: 'Jl. Raya Serang Km 16.8, Sukamulya, Cikupa', isMitra: true },
  { id: 'rs-2', nama: 'RS Ciputra Hospital CitraRaya', wilayah: 'Tangerang', alamat: 'Jl. Citra Raya Utama Timur Blok E1/01, Panongan', isMitra: true },
  { id: 'rs-3', nama: 'RS Hermina Bitung', wilayah: 'Tangerang', alamat: 'Jl. Raya Serang Km 10.5, Kadu, Curug', isMitra: true },
  { id: 'rs-4', nama: 'RS Qadr Karawaci', wilayah: 'Tangerang', alamat: 'Kompleks Islamic Village, Kelapa Dua, Tangerang', isMitra: true },
  { id: 'rs-5', nama: 'RS Selaras Cisauk', wilayah: 'Tangerang', alamat: 'Jl. Raya Lapan - Cisauk, Suradita', isMitra: true },
  { id: 'rs-6', nama: 'RS Sari Asih Karawaci', wilayah: 'Tangerang', alamat: 'Jl. Imam Bonjol No. 38, Karawaci, Tangerang', isMitra: true },
  { id: 'rs-7', nama: 'RS Sari Asih Sangiang', wilayah: 'Tangerang', alamat: 'Jl. Moh. Toha Km 3.5, Periuk, Tangerang', isMitra: true },
  { id: 'rs-8', nama: 'RS Sari Asih Ar-Rahmah', wilayah: 'Tangerang', alamat: 'Jl. KH. Hasyim Ashari No. 88, Pinang', isMitra: true },
  { id: 'rs-9', nama: 'RS Mulya Pinang', wilayah: 'Tangerang', alamat: 'Jl. KH. Hasyim Ashari No. 18, Sudimara Pinang', isMitra: true },
  { id: 'rs-10', nama: 'RS An-Nisa Tangerang', wilayah: 'Tangerang', alamat: 'Jl. Gatot Subroto No. 96, Cibodas, Tangerang', isMitra: true },
  { id: 'rs-11', nama: 'RSUD Balaraja', wilayah: 'Tangerang', alamat: 'Jl. Desa Tobat Km 1, Balaraja, Tangerang', isMitra: true },
  { id: 'rs-12', nama: 'RSUD Kabupaten Tangerang', wilayah: 'Tangerang', alamat: 'Jl. Jend. A. Yani No. 9, Tangerang', isMitra: true },
  { id: 'rs-13', nama: 'RS Harapan Kita Jakarta', wilayah: 'Di luar Tangerang', alamat: 'Jl. Letjen S. Parman Kav. 87, Slipi, Jakarta Barat', isMitra: false },
  { id: 'rs-14', nama: 'RSCM Jakarta', wilayah: 'Di luar Tangerang', alamat: 'Jl. Diponegoro No. 71, Salemba, Jakarta Pusat', isMitra: false },
  { id: 'rs-15', nama: 'RSUD Dr. Drajat Prawiranegara Serang', wilayah: 'Di luar Tangerang', alamat: 'Jl. Veteran No. 56, Serang, Banten', isMitra: false },
];

/**
 * Validasi apakah hubungan keluarga termasuk dalam SOP PTP 2026-2029
 * Kategori yang didukung SOP: Anggota Sendiri, Anak, Suami/Istri (Suami, Istri), Orang Tua.
 */
export function isHubunganKeluargaValidSOP(hubungan?: PasienRelation | string): boolean {
  if (!hubungan) return false;
  const validList: string[] = ['Anggota Sendiri', 'Anggota', 'Anak', 'Suami/Istri', 'Suami', 'Istri', 'Orang Tua'];
  return validList.includes(hubungan);
}

/**
 * Menghitung Akomodasi Pendampingan Anggota Sakit Berdasarkan SOP PTP SBN KASBI 2026-2029
 * 
 * ATURAN FORMULA SOP:
 * 1. KENDARAAN ORGANISASI (Mobil Operasional):
 *    - Tangerang: Rp50.000 / orang
 *    - Di luar Tangerang: Rp100.000 / orang
 * 
 * 2. KENDARAAN PRIBADI (Motor/Mobil Pribadi):
 *    - Tangerang: Rp75.000 / orang
 *    - Di luar Tangerang: Rp100.000 / orang
 * 
 * 3. TAMBAHAN:
 *    - Melebihi jam kerja normal DAN Di luar RS Kerja Sama: Tambahan Rp25.000 / orang
 * 
 * 4. ANTAR ANGGOTA DARI KLINIK PABRIK (Lokasi awal = Perusahaan):
 *    - Kendaraan Organisasi: Rp0
 *    - Kendaraan Pribadi: Rp30.000 / orang
 * 
 * CATATAN PENTING:
 * Akomodasi dihitung berdasarkan JUMLAH PETUGAS/ORANG PENDAMPING (jumlah_petugas x tarif_sesuai_SOP).
 */
export function hitungAkomodasiSOP(params: {
  lokasiAwal?: LokasiAwalType | string;
  transportasi?: TransportasiType | string;
  wilayah?: WilayahTujuan;
  jumlahPetugas: number;
  isLuarJamKerja: boolean;
  isLuarRsKerjaSama: boolean;
}): SickVisitAkomodasi {
  const {
    lokasiAwal = 'Tempat tinggal anggota',
    transportasi = 'Mobil Operasional',
    wilayah = 'Tangerang',
    jumlahPetugas = 1,
    isLuarJamKerja = false,
    isLuarRsKerjaSama = false
  } = params;

  // Minimal 1 petugas jika ditugaskan, maksimal 2 sesuai SOP
  const countPetugas = Math.max(1, Math.min(2, jumlahPetugas || 1));

  let tarifPerOrang = 0;
  let tambahanLuarJam = 0;
  let statusVerifikasi: 'Otomatis Sesuai SOP' | 'Perlu Verifikasi Pengurus' | 'Terverifikasi' = 'Otomatis Sesuai SOP';
  let keteranganPerhitungan = '';

  const isAntarKlinik = lokasiAwal === 'Perusahaan';

  if (transportasi === 'Grab') {
    statusVerifikasi = 'Perlu Verifikasi Pengurus';
    keteranganPerhitungan = `Transportasi Grab (Kondisi mendesak & mobil tidak tersedia). Nominal disesuaikan dengan bukti nota / tarif riil aplikasi. (${countPetugas} petugas pendamping)`;
    return {
      jenisTransportasi: 'Grab',
      wilayah,
      jumlahPetugas: countPetugas,
      isLuarJamKerja,
      isLuarRsKerjaSama,
      isDariKlinikPabrik: isAntarKlinik,
      tarifPerOrang: 0,
      tambahanLuarJam: 0,
      totalAkomodasi: 0,
      keteranganPerhitungan,
      statusVerifikasi
    };
  }

  if (isAntarKlinik) {
    // SOP Bagian D: Antar anggota dari klinik pabrik
    if (transportasi === 'Mobil Operasional') {
      tarifPerOrang = 0;
      keteranganPerhitungan = `Antar anggota dari klinik pabrik dengan Mobil Operasional = Rp0 (Rp0 x ${countPetugas} petugas).`;
    } else {
      // Kendaraan pribadi
      tarifPerOrang = 30000;
      keteranganPerhitungan = `Antar anggota dari klinik pabrik dengan Kendaraan Pribadi = Rp30.000 x ${countPetugas} petugas = Rp${(tarifPerOrang * countPetugas).toLocaleString('id-ID')}.`;
    }
  } else {
    // Pendampingan Rumah Sakit Standar (SOP Bagian A & B)
    if (transportasi === 'Mobil Operasional') {
      if (wilayah === 'Tangerang') {
        tarifPerOrang = 50000;
      } else {
        tarifPerOrang = 100000;
      }
    } else {
      // Kendaraan Pribadi / Motor Pribadi
      if (wilayah === 'Tangerang') {
        tarifPerOrang = 75000;
      } else {
        tarifPerOrang = 100000;
      }
    }

    // SOP Bagian C: Tambahan jika melebihi jam kerja normal DAN di luar RS kerja sama
    if (isLuarJamKerja && isLuarRsKerjaSama) {
      tambahanLuarJam = 25000;
    }

    const subtotal = tarifPerOrang * countPetugas;
    const extraTotal = tambahanLuarJam * countPetugas;
    const grandTotal = subtotal + extraTotal;

    let rincianTambahan = '';
    if (tambahanLuarJam > 0) {
      rincianTambahan = ` + Tambahan luar jam & bukan RS mitra (Rp25.000 x ${countPetugas} = Rp${extraTotal.toLocaleString('id-ID')})`;
    }

    keteranganPerhitungan = `${transportasi} (${wilayah}): Tarif Rp${tarifPerOrang.toLocaleString('id-ID')} x ${countPetugas} petugas = Rp${subtotal.toLocaleString('id-ID')}${rincianTambahan}. Total: Rp${grandTotal.toLocaleString('id-ID')}.`;
  }

  const totalAkomodasi = (tarifPerOrang + tambahanLuarJam) * countPetugas;

  return {
    jenisTransportasi: transportasi as TransportasiType,
    wilayah,
    jumlahPetugas: countPetugas,
    isLuarJamKerja,
    isLuarRsKerjaSama,
    isDariKlinikPabrik: isAntarKlinik,
    tarifPerOrang,
    tambahanLuarJam,
    totalAkomodasi,
    keteranganPerhitungan,
    statusVerifikasi
  };
}

/**
 * Normalisasi status pendampingan untuk kompatibilitas data lama
 */
export function normalizeSickVisitStatus(status?: string): SickVisitStatus {
  if (!status) return 'Dilaporkan';
  switch (status) {
    case 'Menunggu Kunjungan':
      return 'Dilaporkan';
    case 'Sedang Didampingi':
      return 'Dalam Pendampingan';
    default:
      return status as SickVisitStatus;
  }
}
