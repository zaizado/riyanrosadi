import { describe, it, expect } from 'vitest';
import { 
  isHubunganKeluargaValidSOP, 
  hitungAkomodasiSOP, 
  normalizeSickVisitStatus,
  DAFTAR_RS_RUJUKAN 
} from './sickVisitUtils';

describe('SOP Pendampingan Anggota Sakit SBN KASBI 2026-2029 - Business Rules Tests', () => {

  // TEST 1: Anggota Sakit Hubungan Valid
  it('TEST 1 & 3, 4, 5: Memvalidasi kategori hubungan keluarga sesuai SOP (Anggota, Anak, Suami/Istri, Orang Tua)', () => {
    expect(isHubunganKeluargaValidSOP('Anggota Sendiri')).toBe(true);
    expect(isHubunganKeluargaValidSOP('Anggota')).toBe(true);
    expect(isHubunganKeluargaValidSOP('Anak')).toBe(true);
    expect(isHubunganKeluargaValidSOP('Suami/Istri')).toBe(true);
    expect(isHubunganKeluargaValidSOP('Suami')).toBe(true);
    expect(isHubunganKeluargaValidSOP('Istri')).toBe(true);
    expect(isHubunganKeluargaValidSOP('Orang Tua')).toBe(true);
  });

  // TEST 6: Hubungan bukan kategori SOP
  it('TEST 6: Hubungan bukan kategori SOP (Paman, Sepupu, Tetangga, Lainnya) harus ditolak otomatis/memerlukan verifikasi', () => {
    expect(isHubunganKeluargaValidSOP('Paman')).toBe(false);
    expect(isHubunganKeluargaValidSOP('Sepupu')).toBe(false);
    expect(isHubunganKeluargaValidSOP('Mertua')).toBe(false);
    expect(isHubunganKeluargaValidSOP('Tetangga')).toBe(false);
    expect(isHubunganKeluargaValidSOP('Lainnya')).toBe(false);
    expect(isHubunganKeluargaValidSOP('')).toBe(false);
  });

  // TEST 11 & TEST 13: Kendaraan Organisasi (Mobil Operasional) - Tangerang & Luar Tangerang
  it('TEST 11 & 13: Perhitungan Mobil Operasional di Tangerang (Rp50.000/petugas) untuk 1 dan 2 petugas', () => {
    // 1 Petugas
    const res1 = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Mobil Operasional',
      wilayah: 'Tangerang',
      jumlahPetugas: 1,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(res1.totalAkomodasi).toBe(50000);
    expect(res1.tarifPerOrang).toBe(50000);
    expect(res1.jumlahPetugas).toBe(1);

    // 2 Petugas (TEST 13: Dihitung berdasarkan JUMLAH PETUGAS, bukan pasien)
    const res2 = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Mobil Operasional',
      wilayah: 'Tangerang',
      jumlahPetugas: 2,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(res2.totalAkomodasi).toBe(100000); // 2 x 50.000
    expect(res2.tarifPerOrang).toBe(50000);
    expect(res2.jumlahPetugas).toBe(2);
  });

  it('Perhitungan Mobil Operasional di Luar Tangerang (Rp100.000/petugas)', () => {
    const res = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Mobil Operasional',
      wilayah: 'Di luar Tangerang',
      jumlahPetugas: 2,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(res.totalAkomodasi).toBe(200000); // 2 x 100.000
  });

  // Kendaraan Pribadi: Tangerang (Rp75.000/petugas), Luar Tangerang (Rp100.000/petugas)
  it('Perhitungan Kendaraan Pribadi di Tangerang (Rp75.000/petugas)', () => {
    const res1 = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Kendaraan Pribadi',
      wilayah: 'Tangerang',
      jumlahPetugas: 1,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(res1.totalAkomodasi).toBe(75000);

    const res2 = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Motor Pribadi',
      wilayah: 'Tangerang',
      jumlahPetugas: 2,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(res2.totalAkomodasi).toBe(150000); // 2 x 75.000
  });

  it('Perhitungan Kendaraan Pribadi di Luar Tangerang (Rp100.000/petugas)', () => {
    const res = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Kendaraan Pribadi',
      wilayah: 'Di luar Tangerang',
      jumlahPetugas: 2,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(res.totalAkomodasi).toBe(200000); // 2 x 100.000
  });

  // SOP Bagian C: Tambahan Luar Jam Kerja & Luar RS Kerja Sama (+Rp25.000/petugas)
  it('Tambahan jika melebihi jam kerja normal DAN di luar RS kerja sama (+Rp25.000/orang)', () => {
    // Mobil Operasional di Tangerang + Luar Jam & Luar RS Kerja Sama
    // Tarif dasar: 50.000 + 25.000 = 75.000 / orang. Untuk 2 petugas = 150.000
    const res = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Mobil Operasional',
      wilayah: 'Tangerang',
      jumlahPetugas: 2,
      isLuarJamKerja: true,
      isLuarRsKerjaSama: true
    });
    expect(res.tarifPerOrang).toBe(50000);
    expect(res.tambahanLuarJam).toBe(25000);
    expect(res.totalAkomodasi).toBe(150000);

    // Jika hanya luar jam tapi RS mitra, tidak dapat tambahan 25k
    const resMitra = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Mobil Operasional',
      wilayah: 'Tangerang',
      jumlahPetugas: 2,
      isLuarJamKerja: true,
      isLuarRsKerjaSama: false
    });
    expect(resMitra.tambahanLuarJam).toBe(0);
    expect(resMitra.totalAkomodasi).toBe(100000);
  });

  // SOP Bagian D: Antar dari klinik pabrik (lokasi awal = Perusahaan)
  it('SOP Antar dari klinik pabrik: Mobil Operasional = Rp0, Kendaraan Pribadi = Rp30.000/petugas', () => {
    // Mobil Operasional = Rp0
    const resOrg = hitungAkomodasiSOP({
      lokasiAwal: 'Perusahaan',
      transportasi: 'Mobil Operasional',
      wilayah: 'Tangerang',
      jumlahPetugas: 2,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(resOrg.totalAkomodasi).toBe(0);

    // Kendaraan Pribadi = Rp30.000 / orang
    const resPribadi = hitungAkomodasiSOP({
      lokasiAwal: 'Perusahaan',
      transportasi: 'Kendaraan Pribadi',
      wilayah: 'Tangerang',
      jumlahPetugas: 2,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(resPribadi.tarifPerOrang).toBe(30000);
    expect(resPribadi.totalAkomodasi).toBe(60000); // 2 x 30.000
  });

  // TEST 12: Grab
  it('TEST 12: Grab memerlukan verifikasi pengurus dan alasan', () => {
    const resGrab = hitungAkomodasiSOP({
      lokasiAwal: 'Tempat tinggal anggota',
      transportasi: 'Grab',
      wilayah: 'Tangerang',
      jumlahPetugas: 1,
      isLuarJamKerja: false,
      isLuarRsKerjaSama: false
    });
    expect(resGrab.statusVerifikasi).toBe('Perlu Verifikasi Pengurus');
    expect(resGrab.jenisTransportasi).toBe('Grab');
  });

  // TEST Normalisasi Status Lama
  it('Normalisasi status lama untuk kompatibilitas data', () => {
    expect(normalizeSickVisitStatus('Menunggu Kunjungan')).toBe('Dilaporkan');
    expect(normalizeSickVisitStatus('Sedang Didampingi')).toBe('Dalam Pendampingan');
    expect(normalizeSickVisitStatus('Selesai')).toBe('Selesai');
  });

  // DAFTAR RS RUJUKAN
  it('Memuat daftar RS rujukan kerja sama resmi', () => {
    expect(DAFTAR_RS_RUJUKAN.length).toBeGreaterThan(5);
    const mitraList = DAFTAR_RS_RUJUKAN.filter(rs => rs.isMitra);
    expect(mitraList.length).toBeGreaterThan(0);
  });
});
