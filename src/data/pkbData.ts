export interface PkbPasal {
  id?: string;
  nomor: number | string;
  judul: string;
  bab: string;
  babJudul: string;
  ringkasan: string;
  isiLengkap: string[];
  kelompokMateri?: string;
}

export const KELOMPOK_MATERI_DEFAULT = [
  'PKB PT VCI (2024-2026)',
  'UU No. 21 Tahun 2000 (Serikat Pekerja)',
  'UU No. 13 Tahun 2003 (Ketenagakerjaan)',
  'UU No. 2 Tahun 2004 (PPHI)',
  'UU No. 6 Tahun 2023 (Cipta Kerja)',
  'Peraturan Perusahaan & K3',
  'SOP & Panduan Organisasi'
] as const;

export const PKB_DATA: PkbPasal[] = [
  // BAB I: UMUM
  {
    nomor: 1,
    judul: "Istilah-Istilah",
    bab: "BAB I",
    babJudul: "UMUM",
    ringkasan: "Definisi Perusahaan (PT Victory Chingluh Indonesia), Pengusaha, Serikat Buruh (SBN KASBI VCI), Bipartit, TKA, Karyawan, Masa Kerja, Sanksi, dll.",
    isiLengkap: [
      "1. PERUSAHAAN: PT. Victory Chingluh Indonesia yang berkedudukan hukum di Kabupaten Tangerang (Pabrik 1: Jl. Otonom No. 48-49 Suka Asih; Pabrik 2: Jl. Raya Pasar Kemis Rajeg Sindangsari Pasar Kemis).",
      "2. PENGUSAHA: Orang perseorangan, persekutuan atau badan hukum yang menjalankan Perusahaan PT. Victory Chingluh Indonesia.",
      "3. PIMPINAN PERUSAHAAN: Dewan Direksi dari PT. Victory Chingluh Indonesia dan/atau Pekerja yang diberi kuasa bertindak untuk dan atas nama Perusahaan.",
      "4. SERIKAT PEKERJA/SERIKAT BURUH: Organisasi Pekerja/Buruh yang dibentuk dari, oleh, dan untuk Pekerja di PT. Victory Chingluh Indonesia dan tercatat di Disnaker Kab. Tangerang.",
      "5. ANGGOTA SERIKAT: Pekerja yang telah terdaftar menjadi anggota salah satu Serikat Pekerja di PT. Victory Chingluh Indonesia.",
      "6. PIMPINAN/PENGURUS SERIKAT: Anggota Serikat Pekerja yang dipilih sesuai AD/ART dan dilaporkan kepada Perusahaan serta mendapatkan SK dari Pimpinan Cabang/Federasi.",
      "7. HUBUNGAN INDUSTRIAL: Sistem hubungan antara pelaku proses produksi (Pengusaha, Pekerja, Pemerintah) berdasarkan Pancasila dan UUD 1945.",
      "8. BIPARTIT: Forum komunikasi dan konsultasi mengenai hal ketenagakerjaan antara Pengusaha dan Serikat Pekerja.",
      "9. PEKERJA/BURUH: Orang yang mempunyai hubungan kerja atas dasar perjanjian kerja dengan menerima upah/gaji.",
      "10. TENAGA KERJA ASING (TKA): Warga negara asing pemegang visa kerja resmi di Indonesia.",
      "11. KELUARGA PEKERJA: Satu istri/suami sah dan maksimal 3 anak berusia maks 21 tahun, belum bekerja/menikah.",
      "15-17. DIVISI / SUB DIVISI / DEPARTEMEN: Unit organisasi dalam lingkungan Perusahaan.",
      "22. MASA KERJA: Periode kerja yang dilakukan secara tidak terputus sejak tanggal diterima kerja.",
      "24. SANKSI: Tindakan atau hukuman bersifat pembinaan atas pelanggaran PKB dan tata tertib.",
      "25. SURAT PERINGATAN (SP): Surat resmi pembinaan karena pelanggaran disiplin/PKB.",
      "43. SAFETY GOLDEN RULES: 10 Aturan Emas Keselamatan Kerja di lingkungan PT. Victory Chingluh Indonesia."
    ]
  },
  {
    nomor: 2,
    judul: "Perjanjian Kerja Bersama (PKB)",
    bab: "BAB I",
    babJudul: "UMUM",
    ringkasan: "Hasil kesepakatan tertulis antara Perusahaan dan Serikat Pekerja/Buruh (Periode 2024-2026).",
    isiLengkap: [
      "Perjanjian Kerja Bersama (PKB) adalah hasil kesepakatan tertulis antara PT. Victory Chingluh Indonesia dengan Serikat Pekerja/Serikat Buruh yang mengatur syarat kerja, hak, dan kewajiban kedua belah pihak sesuai Permenaker RI No. 28 Tahun 2014."
    ]
  },
  {
    nomor: 3,
    judul: "Ketentuan Tim Perunding PKB",
    bab: "BAB I",
    babJudul: "UMUM",
    ringkasan: "Aturan keterwakilan Serikat Pekerja minimal 10% anggota terverifikasi untuk masuk Tim Perunding (maks 9 orang).",
    isiLengkap: [
      "1. Serikat Pekerja yang berhak mewakili perundingan maksimal 3 serikat, masing-masing beranggotakan minimal 10% dari total pekerja dari hasil verifikasi keanggotaan.",
      "2. Verifikasi berdasarkan pemotongan iuran anggota (COS) oleh Perusahaan.",
      "3. Penetapan Tim Perunding dilakukan paling lambat 3 bulan sebelum berakhirnya masa berlaku PKB.",
      "4. Jumlah Tim Perunding Serikat ditentukan proporsional maksimal 9 (sembilan) orang."
    ]
  },
  {
    nomor: 4,
    judul: "Pihak-Pihak yang Mengadakan PKB",
    bab: "BAB I",
    babJudul: "UMUM",
    ringkasan: "Identitas PT Victory Chingluh Indonesia & PTP SBN PT. VCI (berafiliasi FSBN KASBI) serta PUK SP TSK SPSI.",
    isiLengkap: [
      "1. PIHAK PERUSAHAAN: PT. Victory Chingluh Indonesia (Akta Notaris Erma Rabita S.H., M.Kn No. 3 Tanggal 10 Mei 2020).",
      "2. PIHAK SERIKAT PEKERJA: PTP SBN PT. VCI (berafiliasi FSBN - KASBI, Bukti Pencatatan Disnakertrans No. 177/Disnakertrans/XXI/2013) dan PUK SP TSK SPSI."
    ]
  },
  {
    nomor: 5,
    judul: "Cakupan Perjanjian Kerja Bersama",
    bab: "BAB I",
    babJudul: "UMUM",
    ringkasan: "PKB berlaku bagi seluruh Pekerja PT Victory Chingluh Indonesia (Tetap, Percobaan, Lokal, TKA).",
    isiLengkap: [
      "1. PKB berlaku dan mengikat Perusahaan serta seluruh Pekerja/Buruh berstatus tetap maupun masa percobaan, pekerja lokal maupun asing.",
      "2. Hal teknis yang memerlukan penjabaran lebih lanjut diatur dalam ketentuan tersendiri berlandaskan PKB ini."
    ]
  },
  {
    nomor: 6,
    judul: "Maksud dan Tujuan PKB",
    bab: "BAB I",
    babJudul: "UMUM",
    ringkasan: "Menetapkan syarat kerja yang adil, menjamin kepastian hukum, dan menciptakan hubungan industrial harmonis.",
    isiLengkap: [
      "a. Menjelaskan hak dan kewajiban Perusahaan, Serikat Pekerja, dan Pekerja.",
      "b. Menetapkan syarat-syarat kerja yang baik.",
      "c. Mengatur penyelesaian perbedaan pendapat secara adil.",
      "d. Menciptakan stabilitas hubungan industrial yang selaras dan seimbang."
    ]
  },
  {
    nomor: 7,
    judul: "Pengakuan Pengusaha dan Serikat Pekerja",
    bab: "BAB I",
    babJudul: "UMUM",
    ringkasan: "Pengusaha mengakui keberadaan Serikat, dan Serikat mengakui hak pengelolaan usaha Perusahaan.",
    isiLengkap: [
      "1. Pengusaha mengakui Serikat Pekerja/Buruh yang memiliki nomor pencatatan resmi sebagai wakil sah pekerja.",
      "2. Pengusaha mengakui hak dan kedaulatan Serikat untuk mengatur organisasi internal sesuai AD/ART.",
      "3. Serikat Pekerja mengakui hak penuh Perusahaan dalam mengelola kegiatan unit usaha dan menetapkan sistem prosedur manajemen."
    ]
  },

  // BAB II: FASILITAS & DISPENSASI SERIKAT
  {
    nomor: 10,
    judul: "Fasilitas Bagi Serikat Pekerja/Buruh",
    bab: "BAB II",
    babJudul: "FASILITAS, DISPENSASI DAN JAMINAN BAGI SERIKAT PEKERJA",
    ringkasan: "Perusahaan menyediakan sekretariat, papan pengumuman, izin rapat internal, pemotongan iuran COS via payroll, serta fasilitas kendaraan/telepon.",
    isiLengkap: [
      "1. Perusahaan menyediakan fasilitas ruang sekretariat dan papan pengumuman resmi.",
      "2. Mengizinkan rapat internal Serikat selama tidak mengganggu produksi dengan izin HR.",
      "3. Membantu pemotongan upah iuran anggota (Check Off System / COS) setiap bulan via transfer ke rekening Serikat max 5 hari kerja.",
      "4. Diizinkan memasang bendera organisasi berdampingan dengan Bendera Merah Putih, Bendera Perusahaan, dan Bendera K3.",
      "5. Mengizinkan penggunaan ruang rapat dan fasilitas kendaraan mobil Perusahaan untuk urusan resmi."
    ]
  },
  {
    nomor: 11,
    judul: "Dispensasi Bagi Serikat Pekerja/Buruh",
    bab: "BAB II",
    babJudul: "FASILITAS, DISPENSASI DAN JAMINAN BAGI SERIKAT PEKERJA",
    ringkasan: "Dispensasi tanpa pengurangan hak/upah untuk menghadiri persidangan, Bipartit, rapat, seminar, dan pelatihan perburuhan.",
    isiLengkap: [
      "1. Memberikan dispensasi tanpa pengurangan upah untuk tugas organisasi (konsultasi pemerintah, persidangan, rapat, pendidikan perburuhan).",
      "2. Mengajukan surat permohonan & surat tugas selambatnya 3 hari kerja sebelumnya.",
      "3. Kegiatan internal: Maksimal 3 orang per departemen dengan izin atasan.",
      "4. Kegiatan eksternal: Minimal 1 orang, maksimal 4 orang dalam satu bagian."
    ]
  },
  {
    nomor: 12,
    judul: "Jaminan Terhadap Serikat Pekerja/Buruh",
    bab: "BAB II",
    babJudul: "FASILITAS, DISPENSASI DAN JAMINAN BAGI SERIKAT PEKERJA",
    ringkasan: "Perusahaan menjamin keleluasaan pengurus Serikat dan melindungi dari intimidasi, diskriminasi, atau tindakan pembalasan.",
    isiLengkap: [
      "1. Menjamin keleluasaan pengurus/anggota menjalankan fungsi organisasi tanpa intimidasi, diskriminasi, atau tindakan pembalasan.",
      "2. Jaminan pendampingan & pembelaan bagi anggota baik internal maupun eksternal.",
      "3. Pembebastugasan pengurus selama masa kepengurusan sesuai prosedur yang berlaku."
    ]
  },

  // BAB III: HUBUNGAN KERJA
  {
    nomor: 13,
    judul: "Penerimaan Pekerja / Buruh Baru",
    bab: "BAB III",
    babJudul: "HUBUNGAN KERJA",
    ringkasan: "Syarat penerimaan pekerja baru (usia min 18 th, lulus MCU, bebas pungli, terbuka untuk penyandang disabilitas).",
    isiLengkap: [
      "1. Disesuaikan kebutuhan Perusahaan dan asas kesempatan sama termasuk Penyandang Disabilitas.",
      "2. Jalur rekrutmen online (http://karir.chingluh.co.id) dan bursa kerja offline.",
      "3. Batas usia minimal 18 tahun, lulus tes seleksi dan Medical Check Up (MCU).",
      "4. Dilarang keras dipungut biaya apapun (bebas pungli) atau menerima imbalan."
    ]
  },
  {
    nomor: 15,
    judul: "Masa Percobaan (Probation)",
    bab: "BAB III",
    babJudul: "HUBUNGAN KERJA",
    ringkasan: "Masa percobaan paling lama 3 (tiga) bulan. Lulus diangkat jadi Pekerja Tetap dan mendapat seragam.",
    isiLengkap: [
      "1. Masa percobaan (probation) ditetapkan selama 3 (tiga) bulan.",
      "2. Masa percobaan dihitung sebagai masa kerja.",
      "3. Pekerja yang lulus diangkat sebagai Pekerja Tetap dengan SK dan seragam kerja."
    ]
  },
  {
    nomor: 16,
    judul: "Promosi Jabatan",
    bab: "BAB III",
    babJudul: "HUBUNGAN KERJA",
    ringkasan: "Kenaikan jabatan berdasarkan prestasi, bebas SP aktif, dan evaluasi SOP HR (peninjauan April & Oktober).",
    isiLengkap: [
      "1. Promosi disertai peningkatan upah dan tunjangan jabatan.",
      "2. Evaluasi oleh HR berdasarkan prestasi kerja, tes psikologi, dan bebas SP/sanksi aktif.",
      "3. Wajib mengikuti masa percobaan promosi/training selama 3 bulan."
    ]
  },

  // BAB IV: WAKTU KERJA, LEMBUR, LIBUR
  {
    nomor: 23,
    judul: "Waktu Kerja dan Hari Libur Resmi",
    bab: "BAB IV",
    babJudul: "PENETAPAN WAKTU KERJA, KERJA LEMBUR DAN HARI LIBUR RESMI",
    ringkasan: "Ketentuan jam kerja Non-Shift (5 hari, 40 jam/minggu) dan Shift I/II/III (6 hari, 40 jam/minggu) serta jadwal istirahat.",
    isiLengkap: [
      "A. NON SHIFT (5 Hari Kerja):",
      "• Senin - Kamis: 06.30 - 15.30 (Istirahat 10.30 - 11.30 = 60 menit)",
      "• Jumat: 06.30 - 16.00 (Istirahat 11.30 - 13.00 = 90 menit)",
      "• Sabtu & Minggu: Libur Mingguan.",
      "B. SHIFT (6 Hari Kerja):",
      "• Shift I (Pagi): 06.30 - 14.30 (Jumat s/d 15.00, Sabtu s/d 12.00)",
      "• Shift II (Siang): 14.30 - 22.30 (Jumat s/d 22.30, Sabtu 12.00 - 17.30)",
      "• Shift III (Malam): 22.30 - 06.30",
      "• Absensi wajib menggunakan barcode (fingerprint/face recognition) 15 menit sebelum kerja."
    ]
  },
  {
    nomor: 24,
    judul: "Ketentuan Kerja Lembur",
    bab: "BAB IV",
    babJudul: "PENETAPAN WAKTU KERJA, KERJA LEMBUR DAN HARI LIBUR RESMI",
    ringkasan: "Kerja lembur maks 2,5 jam/hari & 14 jam/minggu. Perhitungan rumus 1/173 x Upah Tetap, fasilitas makan lembur.",
    isiLengkap: [
      "1. Lembur bersifat sukarela berdasarkan SPL (Surat Perintah Lembur).",
      "2. Maksimal lembur 2.5 jam per hari dan 14 jam per minggu.",
      "3. Perhitungan Upah Lembur per jam: 1/173 x (Gaji Pokok + Tunjangan Tetap).",
      "4. Hari Normal: Jam ke-1 dibayar 1.5x upah sejam, jam ke-2 dst dibayar 2x upah sejam.",
      "5. Hari Libur Mingguan/Resmi: Jam 1-7 dibayar 2x, jam ke-8 dibayar 3x, jam ke-9 & 10 dibayar 4x upah sejam.",
      "6. Diberikan fasilitas makan kantin jika lembur minimal 2 (dua) jam kerja."
    ]
  },

  // BAB V: IZIN, CUTI & KETENTUAN MENINGGALKAN PEKERJAAN
  {
    nomor: 26,
    judul: "Izin Tidak Dibayar (ITB)",
    bab: "BAB V",
    babJudul: "KETENTUAN MENINGGALKAN PEKERJAAN",
    ringkasan: "Izin tidak masuk tanpa upah untuk keperluan pribadi/pendidikan (skripsi/kuliah) maks 1 bulan.",
    isiLengkap: [
      "1. ITB diajukan jika cuti tahunan telah habis.",
      "2. ITB pendidikan (skripsi/tugas) maksimal 1 bulan diajukan 5 hari sebelumnya dengan bukti pendukung."
    ]
  },
  {
    nomor: 28,
    judul: "Izin Tidak Masuk Kerja Dengan Upah Penuh (Izin Khusus)",
    bab: "BAB V",
    babJudul: "KETENTUAN MENINGGALKAN PEKERJAAN",
    ringkasan: "Rincian izin khusus dibayar penuh: Menikah (3 hr), Menikahkan anak (2 hr), Istri melahirkan (2 hr), Khitan/Baptis (2 hr), Duka (1-2 hr), Haji/Umroh.",
    isiLengkap: [
      "a. Pekerja sendiri menikah: 3 (tiga) hari kerja.",
      "b. Pekerja menikahkan anak: 2 (dua) hari kerja.",
      "c. Istri melahirkan / keguguran kandungan: 2 (dua) hari kerja.",
      "d. Menyunatkan / membaptiskan anak: 2 (dua) hari kerja.",
      "e. Suami/Istri/Anak/Orang tua/Mertua/Menantu meninggal dunia: 2 (dua) hari kerja.",
      "f. Anggota keluarga dalam satu rumah meninggal dunia: 1 (satu) hari kerja.",
      "g. Ibadah Haji/Umroh: Diberikan izin khusus 1 kali selama bekerja di Perusahaan."
    ]
  },
  {
    nomor: 29,
    judul: "Cuti Tahunan",
    bab: "BAB V",
    babJudul: "KETENTUAN MENINGGALKAN PEKERJAAN",
    ringkasan: "Hak cuti tahunan 12 hari kerja setelah masa kerja 12 bulan terus menerus. Tambahan cuti per kelipatan 3 tahun masa kerja.",
    isiLengkap: [
      "1. Cuti tahunan 12 hari kerja dengan upah penuh setelah 12 bulan bekerja.",
      "2. Permohonan diajukan selambatnya 1 minggu sebelumnya.",
      "3. Dapat diperpanjang maksimal 6 bulan dengan izin Pimpinan Departemen.",
      "4. Tambahan 1 hari cuti setiap kelipatan masa kerja 3 tahun tanpa catatan SP/teguran."
    ]
  },
  {
    nomor: 31,
    judul: "Istirahat / Cuti Haid",
    bab: "BAB V",
    babJudul: "KETENTUAN MENINGGALKAN PEKERJAAN",
    ringkasan: "Pekerja perempuan sakit haid libur hari ke-1 dan ke-2 dengan upah tetap, serta penyediaan pembalut di Poliklinik.",
    isiLengkap: [
      "1. Pekerja perempuan yang sakit haid tidak diwajibkan bekerja pada hari pertama dan kedua waktu haid.",
      "2. Apabila lebih dari 2 hari berturut-turut wajib menggunakan Surat Keterangan Dokter (SKD).",
      "3. Perusahaan menyediakan fasilitas medis dan pembalut di Poliklinik Perusahaan."
    ]
  },
  {
    nomor: 32,
    judul: "Cuti Melahirkan & Cuti Keguguran",
    bab: "BAB V",
    babJudul: "KETENTUAN MENINGGALKAN PEKERJAAN",
    ringkasan: "Cuti melahirkan 3 bulan (1,5 bulan sebelum & 1,5 bulan sesudah). Cuti keguguran 1,5 bulan berdasarkan SKD/Bidan.",
    isiLengkap: [
      "1. Cuti melahirkan selama 1,5 bulan sebelum dan 1,5 bulan sesudah melahirkan (total 3 bulan).",
      "2. Cuti keguguran (usia kandungan maks 23 minggu) berhak cuti 1,5 bulan berdasarkan SKD Dokter/Bidan."
    ]
  },

  // BAB VI: K3 & LINGKUNGAN HIDUP
  {
    nomor: 34,
    judul: "Pedoman K3 & Safety Golden Rules",
    bab: "BAB VI",
    babJudul: "KESELAMATAN, KESEHATAN KERJA (K3) & LINGKUNGAN HIDUP",
    ringkasan: "Aturan keselamatan kerja, wajib APD, Panitia P2K3, serta fasilitas khusus ibu hamil (toilet duduk, bebas lembur/shift malam).",
    isiLengkap: [
      "1. Kesehatan & Keselamatan Kerja (K3) adalah kewajiban dan tanggung jawab bersama.",
      "2. Penerapan Safety Golden Rules: Bekerja di ketinggian (>1.8m), Lock Out Tag Out (LOTO), Izin Kerja Panas, Dilarang Bypass Safety.",
      "3. Perlindungan khusus pekerja perempuan hamil: Tidak boleh bekerja berdiri terus menerus, bebas shift malam, bebas lembur, toilet duduk khusus, parkir motor khusus, dan laktasi menyusui."
    ]
  },
  {
    nomor: 37,
    judul: "Poliklinik Perusahaan",
    bab: "BAB VI",
    babJudul: "KESELAMATAN, KESEHATAN KERJA (K3) & LINGKUNGAN HIDUP",
    ringkasan: "Fasilitas poliklinik, dokter perusahaan, obat-obatan DOEN/DPHO, layanan emergency, dan ambulans siaga.",
    isiLengkap: [
      "Poliklinik Perusahaan menyediakan konsultasi medis, pemeriksaan/pengobatan dokter, pelayanan emergency, farmasi obat DOEN, pemeriksaan kehamilan bidan, dan ambulans darurat."
    ]
  },

  // BAB VII: PENGUPAHAN
  {
    nomor: 40,
    judul: "Pengertian Upah & Komponen Upah",
    bab: "BAB VII",
    babJudul: "PENGUPAHAN",
    ringkasan: "Upah terdiri dari Upah Pokok, Tunjangan Tetap, dan Tunjangan Tidak Tetap. Penyesuaian UMK tiap 1 Januari.",
    isiLengkap: [
      "1. Komponen Upah: Gaji Pokok, Tunjangan Tetap (Jabatan, Keahlian, TMK), dan Tunjangan Tidak Tetap (Premi Kehadiran, Shift, Transport).",
      "2. Prinsip 'No Work No Pay' kecuali untuk izin/cuti yang diatur dalam PKB dan Undang-Undang."
    ]
  },
  {
    nomor: 42,
    judul: "Pembayaran Upah (Gaji)",
    bab: "BAB VII",
    babJudul: "PENGUPAHAN",
    ringkasan: "Gaji dibayarkan tanggal 5 setiap bulannya. Jika jatuh pada hari libur, pembayaran dimajukan.",
    isiLengkap: [
      "1. Perhitungan upah dari tanggal 1 s/d tanggal tutup buku setiap bulan.",
      "2. Gaji dibayarkan setiap tanggal 5 bulan berikutnya via transfer bank."
    ]
  },
  {
    nomor: 43,
    judul: "Upah Selama Sakit Berkepanjangan (Menahun)",
    bab: "BAB VII",
    babJudul: "PENGUPAHAN",
    ringkasan: "Skema pembayaran gaji sakit menahun: 4 bln I (100%), 4 bln II (75%), 4 bln III (50%), 4 bln IV (25%).",
    isiLengkap: [
      "a. 4 (empat) bulan pertama: dibayar 100% Upah Tetap.",
      "b. 4 (empat) bulan kedua: dibayar 75% Upah Tetap.",
      "c. 4 (empat) bulan ketiga: dibayar 50% Upah Tetap.",
      "d. 4 (empat) bulan selanjutnya: dibayar 25% Upah Tetap sebelum diproses PHK medis."
    ]
  },
  {
    nomor: 50,
    judul: "Tunjangan Masa Kerja (TMK)",
    bab: "BAB VII",
    babJudul: "PENGUPAHAN",
    ringkasan: "Nilai TMK dibayarkan tiap bulan berdasarkan masa kerja (Masa Kerja 1 th: Rp 8.000, naik Rp 4.000/th hingga 15 th: Rp 64.000).",
    isiLengkap: [
      "• MK 1 th: Rp 8.000 | MK 2 th: Rp 12.000 | MK 3 th: Rp 16.000",
      "• MK 4 th: Rp 20.000 | MK 5 th: Rp 24.000 | MK 6 th: Rp 28.000",
      "• MK 7 th: Rp 32.000 | MK 8 th: Rp 36.000 | MK 9 th: Rp 40.000",
      "• MK 10 th: Rp 44.000 | MK 11 th: Rp 48.000 | MK 12 th: Rp 52.000",
      "• MK 13 th: Rp 56.000 | MK 14 th: Rp 60.000 | MK 15 th: Rp 64.000/bulan."
    ]
  },
  {
    nomor: 51,
    judul: "Premi Kehadiran",
    bab: "BAB VII",
    babJudul: "PENGUPAHAN",
    ringkasan: "Premi kehadiran sebesar Rp 120.000 per bulan bagi pekerja dengan tingkat kehadiran 100%.",
    isiLengkap: [
      "1. Besarnya Premi Kehadiran ditetapkan Rp 120.000 (seratus dua puluh ribu rupiah) setiap bulan.",
      "2. Gugur jika terdapat alpa, terlambat, atau izin tidak masuk kerja (kecuali cuti tahunan)."
    ]
  },
  {
    nomor: 53,
    judul: "Tunjangan Shift & Transport",
    bab: "BAB VII",
    babJudul: "PENGUPAHAN",
    ringkasan: "Tunjangan Shift II: Rp 5.000/hari, Shift III: Rp 7.500/hari. Uang Transport: Rp 10.000/hari.",
    isiLengkap: [
      "1. Tunjangan Shift II: Rp 5.000 per hari kerja.",
      "2. Tunjangan Shift III: Rp 7.500 per hari kerja.",
      "3. Tunjangan Uang Transport: Rp 10.000 per hari hadir kerja (dievaluasi per 6 bulan)."
    ]
  },
  {
    nomor: 55,
    judul: "Tunjangan Hari Raya (THR) Keagamaan",
    bab: "BAB VII",
    babJudul: "PENGUPAHAN",
    ringkasan: "THR wajib dibayar selambatnya 7 hari sebelum Idul Fitri. Komponen: Gaji Pokok + Tunjangan Jabatan/Keahlian + TMK + Bonus % Masa Kerja.",
    isiLengkap: [
      "1. THR dibayarkan 1x setahun selambatnya 7 hari sebelum Hari Raya Idul Fitri.",
      "2. Komponen THR = Gaji Pokok + Tunjangan Jabatan/Keahlian + Tunjangan Masa Kerja.",
      "3. Operator MK 1-3 th +10%, MK 3-6 th +15%, MK >6 th +20% THR.",
      "4. Leader Staff B keatas: MK 1-3 th +15%, MK 3-6 th +25%, MK >6 th +35% THR."
    ]
  },

  // BAB VIII: FASILITAS & BANTUAN KESEJAHTERAAN
  {
    nomor: 58,
    judul: "Seragam Kerja (Uniform)",
    bab: "BAB VIII",
    babJudul: "FASILITAS DAN BANTUAN KESEJAHTERAAN",
    ringkasan: "Perusahaan memberikan penggantian baju seragam sebanyak 2 (dua) stel dalam 1 (satu) tahun.",
    isiLengkap: [
      "1. Seragam diberikan setelah melewati masa percobaan 3 bulan.",
      "2. Penggantian seragam sebanyak 2 (dua) potong dalam 1 (satu) tahun.",
      "3. Hari Jumat, Sabtu, dan Lembur libur diperbolehkan pakaian bebas, rapi, dan sopan."
    ]
  },
  {
    nomor: 60,
    judul: "Fasilitas Makan & Minum",
    bab: "BAB VIII",
    babJudul: "FASILITAS DAN BANTUAN KESEJAHTERAAN",
    ringkasan: "1 kali makan siang/shift bergizi standar kalori. Penggantian Rp 10.000 jika Perusahaan tidak menyediakan.",
    isiLengkap: [
      "1. Fasilitas 1 kali makan siang/shift gratis di Kantin Perusahaan.",
      "2. Penggantian Rp 10.000 per hari jika kantin tidak menyediakan makan.",
      "3. Bulan Puasa: Menu tambahan (extra menu) untuk berbuka puasa dan sahur shift 2/3."
    ]
  },
  {
    nomor: 63,
    judul: "Santunan Kematian",
    bab: "BAB VIII",
    babJudul: "FASILITAS DAN BANTUAN KESEJAHTERAAN",
    ringkasan: "Santunan duka Pekerja meninggal: Rp 2.500.000 + biaya pemulangan jenazah. Anggota Keluarga meninggal: Rp 1.000.000.",
    isiLengkap: [
      "a. Pekerja/Buruh meninggal dunia: Rp 2.500.000 (dua juta lima ratus ribu rupiah) + biaya pemulangan jenazah.",
      "b. Anggota keluarga pekerja meninggal dunia: Rp 1.000.000 (satu juta rupiah).",
      "c. Pekerja yang meninggal setelah Resign/PHK tetap memperoleh santunan hingga 6 bulan."
    ]
  },
  {
    nomor: 64,
    judul: "Sumbangan Persalinan & Musibah",
    bab: "BAB VIII",
    babJudul: "FASILITAS DAN BANTUAN KESEJAHTERAAN",
    ringkasan: "Bantuan persalinan Rp 350.000 per kelahiran (anak 1-3). Santunan bencana/kebakaran Rp 750.000.",
    isiLengkap: [
      "1. Sumbangan persalinan Rp 350.000 (tiga ratus lima puluh ribu rupiah) untuk anak ke-1 s/d ke-3.",
      "2. Santunan musibah Bencana Alam & Kebakaran tempat tinggal sebesar Rp 750.000 (tujuh ratus lima puluh ribu rupiah)."
    ]
  },

  // BAB IX: BPJS
  {
    nomor: 66,
    judul: "BPJS Ketenagakerjaan & BPJS Kesehatan",
    bab: "BAB IX",
    babJudul: "JAMINAN SOSIAL TENAGA KERJA DAN KESEHATAN",
    ringkasan: "Pendaftaran seluruh pekerja pada program BPJS Ketenagakerjaan (JHT 5.7%, JKK 0.89%, JKM 0.30%, JP 3%) & BPJS Kesehatan (5%).",
    isiLengkap: [
      "1. JHT (Jaminan Hari Tua): Iuran 5,7% (2% Pekerja, 3.7% Perusahaan).",
      "2. JKK (Jaminan Kecelakaan Kerja): Iuran 0.89% ditanggung penuh Perusahaan.",
      "3. JKM (Jaminan Kematian): Iuran 0.30% ditanggung penuh Perusahaan.",
      "4. JP (Jaminan Pensiun): Iuran 3% (1% Pekerja, 2% Perusahaan).",
      "5. BPJS Kesehatan: Iuran 5% (1% Pekerja, 4% Perusahaan)."
    ]
  },

  // BAB X: PELECEHAN, KEKERASAN & POLITIK
  {
    nomor: 68,
    judul: "Anti Pelecehan, Anti Kekerasan & Tim PAKP",
    bab: "BAB X",
    babJudul: "PELECEHAN, KEKERASAN, PENYELESAIAN KELUH KESAH, NETRALITAS POLITIK",
    ringkasan: "Prosedur perlindungan dari kekerasan fisik, verbal, psikologis, seksual, serta investigasi independen oleh Tim PAKP.",
    isiLengkap: [
      "1. Dilarang keras melakukan tindakan kekerasan fisik (strap, push up, tampar, dorong), verbal, psikologis, maupun ekonomi.",
      "2. Dilarang melakukan pelecehan seksual verbal, non-verbal (isyarat/kerlingan), visual, maupun fisik.",
      "3. Penanganan pengaduan dilakukan secara rahasia dan obyektif oleh Tim PAKP (Penyelesaian Anti Kekerasan & Pelecehan) independen."
    ]
  },
  {
    nomor: 70,
    judul: "Netralitas dan Ketidakberpihakan Politik",
    bab: "BAB X",
    babJudul: "PELECEHAN, KEKERASAN, PENYELESAIAN KELUH KESAH, NETRALITAS POLITIK",
    ringkasan: "Perusahaan dan tempat kerja bebas dari politik praktis. Dilarang membawa simbol/narasi politik di lingkungan pabrik.",
    isiLengkap: [
      "1. Perusahaan bersifat netral dan tidak mendukung/memberikan kontribusi pada partai/kandidat politik manapun.",
      "2. Pekerja bebas memilih secara pribadi di luar jam kerja/area pabrik, namun dilarang membawa narasi/unsur politik ke media sosial yang membawa nama Perusahaan."
    ]
  },

  // BAB XI: TATA TERTIB KERJA & SANKSI
  {
    nomor: 71,
    judul: "Kewajiban Pekerja & Kerahasian Perusahaan",
    bab: "BAB XI",
    babJudul: "TATA TERTIB KERJA",
    ringkasan: "Kewajiban mentaati PKB, menggunakan ID Card KPK, menjaga rahasia proses produksi/desain sepatu, larangan foto/video di area terbatas (PTC, CCTV, QC, Warehouse).",
    isiLengkap: [
      "1. Pekerja wajib menggunakan ID Card (KPK) digantung di leher dan memakai sepatu standar keselamatan.",
      "2. Dilarang membagikan rahasia Perusahaan (strategi bisnis, alur produksi, gambar teknis, kode sumber, slip gaji).",
      "3. Dilarang mengambil foto/video tanpa izin di area terbatas (PTC, Printing, CCTV, Lab, Produksi, Warehouse, Meeting Room)."
    ]
  },
  {
    nomor: 72,
    judul: "Sanksi & Pembinaan (Surat Peringatan SP)",
    bab: "BAB XI",
    babJudul: "TATA TERTIB KERJA",
    ringkasan: "Masa berlaku Teguran Tertulis, SP I, SP II, SP III masing-masing 6 (enam) bulan sejak dikeluarkan.",
    isiLengkap: [
      "1. Sanksi pembinaan berupa Teguran Tertulis, SP I, SP II, dan SP III.",
      "2. Masa berlaku sanksi masing-masing 6 (enam) bulan dan gugur setelah masa berlaku selesai."
    ]
  },
  {
    nomor: 75,
    judul: "Tingkat Pelanggaran & Jenis Sanksi",
    bab: "BAB XI",
    babJudul: "TATA TERTIB KERJA",
    ringkasan: "Daftar rinci pelanggaran Teguran Tertulis, SP I, SP II, SP III, serta pelanggaran mendesak (pencurian, pemalsuan, narkoba, judi, perkelahian).",
    isiLengkap: [
      "A. TEGURAN TERTULIS: Meludah sembarangan, makan di area kerja, alpa 1-2 hari tak berturut-turut, abnormal absen 4x, tak pakai ID Card.",
      "B. SP I: Melanggar SOP, buang sampah sembarangan, alpa 2 hari berturut-turut/3 hari tak berturut-turut, terlambat pulang cepat, tidak berseragam.",
      "C. SP II: Toilet sembunyi jam kerja, pakai barang perusahaan tanpa izin, alpa 3 hari berturut-turut/4 hari tak berturut-turut, tidur saat jam kerja, abnormal absen 6x.",
      "D. SP III: Merusak mesin absensi/APAR, menolak mutasi/rotasi, alpa 4 hari berturut-turut/5 hari tak berturut-turut, absensi milik orang lain, merokok di tempat berbahaya.",
      "E. PELANGGARAN MENDESAK (PHK Langsung): Pencurian/penggelapan aset, memalsukan bukti, mabuk/narkoba, perkosaan/pelecehan berat, perjudian, menganiaya/menyerang teman kerja, membawa senjata api/tajam."
    ]
  },

  // BAB XII: PHK & PESANGON
  {
    nomor: 77,
    judul: "Penetapan Pesangon, UPMK & Penggantian Hak (UPH)",
    bab: "BAB XII",
    babJudul: "PEMUTUSAN HUBUNGAN KERJA (PHK)",
    ringkasan: "Rumus resmi kalkulasi Pesangon (1 s/d 9 bulan upah), UPMK (2 s/d 10 bulan upah), dan Penggantian Hak 15%.",
    isiLengkap: [
      "1. PESANGON: MK <1 th (1 bln), MK 1-2 th (2 bln), MK 2-3 th (3 bln), MK 3-4 th (4 bln), MK 4-5 th (5 bln), MK 5-6 th (6 bln), MK 6-7 th (7 bln), MK 7-8 th (8 bln), MK >8 th (9 bln upah).",
      "2. UANG PENGHARGAAN MASA KERJA (UPMK): MK 3-6 th (2 bln), MK 6-9 th (3 bln), MK 9-12 th (4 bln), MK 12-15 th (5 bln), MK 15-18 th (6 bln), MK 18-21 th (7 bln), MK 21-24 th (8 bln), MK >24 th (10 bln upah).",
      "3. UANG PENGGANTIAN HAK (UPH): Cuti tahunan belum gugur + Ongkos pulang + Penggantian perumahan & pengobatan 15% dari pesangon + UPMK."
    ]
  },
  {
    nomor: 78,
    judul: "Pengunduran Diri (Resign) & Uang Pisah",
    bab: "BAB XII",
    babJudul: "PEMUTUSAN HUBUNGAN KERJA (PHK)",
    ringkasan: "Prosedur pengunduran diri tertulis (Notice 15 hari untuk Operator/Staff A, 30 hari untuk Leader/Staff B) serta hak Uang Pisah (Pasal 79).",
    isiLengkap: [
      "1. Surat pengunduran diri diajukan tertulis ke HR diketahui Pimpinan Departemen.",
      "2. Operator/Staff A: minimal 15 hari kalender sebelumnya.",
      "3. Staff B/Unit Leader keatas: minimal 30 hari kalender sebelumnya.",
      "4. UANG PISAH (Pasal 79): MK 3-10 th (2 bulan upah), MK >10 th (3 bulan upah)."
    ]
  },
  {
    nomor: 80,
    judul: "Kualifikasi Mengundurkan Diri (Mangkir 5 Hari)",
    bab: "BAB XII",
    babJudul: "PEMUTUSAN HUBUNGAN KERJA (PHK)",
    ringkasan: "Mangkir 5 hari kerja berturut-turut tanpa keterangan tertulis dan telah dipanggil 2 kali patut dikualifikasikan mengundurkan diri.",
    isiLengkap: [
      "Pekerja yang mangkir 5 hari kerja berturut-turut dan dipanggil tertulis 2 kali dapat diputus hubungan kerjanya dengan kualifikasi mengundurkan diri dan berhak atas UPH & Paklaring."
    ]
  },

  // BAB XIII & XIV: PELAKSANA & PENUTUP
  {
    nomor: 86,
    judul: "Masa Berlaku PKB (2024 - 2026)",
    bab: "BAB XIV",
    babJudul: "KETENTUAN PENUTUP",
    ringkasan: "PKB berlaku selama 2 (dua) tahun. Ditandatangani di Pasar Kemis Tangerang pada tanggal 18 Juli 2024.",
    isiLengkap: [
      "1. PKB berlaku selama 2 (dua) tahun sejak disepakati.",
      "2. Ditandatangani resmi oleh Direktur Operasional Huang Fu Hsiang (Pengusaha) bersama Ketua PUK SP TSK SPSI Agus Darsana & Ketua PTP SBN KASBI Budi Prayitno pada tanggal 18 Juli 2024."
    ],
    kelompokMateri: "PKB PT VCI (2024-2026)"
  },

  // ==========================================
  // KELOMPOK MATERI: UU NO 21 TAHUN 2000 (SERIKAT PEKERJA)
  // ==========================================
  {
    id: "reg-uu-21-2000",
    nomor: "UU 21/2000",
    judul: "Undang-Undang No. 21 Tahun 2000 tentang Serikat Pekerja / Serikat Buruh",
    bab: "REGULASI NASIONAL",
    babJudul: "HAK BERSERIKAT & PERLINDUNGAN FREEDOM OF ASSOCIATION",
    ringkasan: "Jaminan kebebasan berserikat, pembentukan SP/SB, perlindungan dari anti-union busting (Pasal 28), keuagan serikat, serta sanksi pidana penjara & denda bagi pelanggar hak serikat.",
    isiLengkap: [
      "1. Hak Dasar Berserikat (Pasal 5): Setiap pekerja/buruh berhak membentuk dan menjadi anggota serikat pekerja/serikat buruh secara bebas tanpa paksaan atau campur tangan pihak manapun.",
      "2. Hak Menghimpun & Mengelola Dana (Pasal 10-12): Serikat pekerja berhak menghimpun dan mengelola keuangan organisasi secara mandiri termasuk iuran anggota (COS) dan dana mogok kerja.",
      "3. Anti-Union Busting / Perlindungan Hak Berserikat (Pasal 28): Siapapun dilarang menghalang-halangi atau memaksa pekerja membentuk/tidak membentuk, menjadi pengurus/anggota, atau melakukan kegiatan serikat pekerja dengan cara: memutus hubungan kerja, menghentikan sementara, menurunkan jabatan, tidak membayar upah, melakukan intimidasi, atau melakukan kampanye anti serikat.",
      "4. Sanksi Pidana Pelanggaran Hak Berserikat (Pasal 43): Barangsiapa melanggar ketentuan Pasal 28 diancam sanksi pidana penjara paling singkat 1 (satu) tahun dan paling lama 5 (lima) tahun dan/atau denda Rp 100.000.000,- s/d Rp 500.000.000,-."
    ],
    kelompokMateri: "UU No. 21 Tahun 2000 (Serikat Pekerja)"
  },

  // ==========================================
  // KELOMPOK MATERI: UU NO 13 TAHUN 2003 (KETENAGAKERJAAN)
  // ==========================================
  {
    id: "reg-uu-13-2003-pokok",
    nomor: "UU 13/2003",
    judul: "Undang-Undang No. 13 Tahun 2003 tentang Ketenagakerjaan (Landasan Utama)",
    bab: "REGULASI NASIONAL",
    babJudul: "SISTEM KETENAGAKERJAAN & HAK-HAK MENDASAR BURUH INDONESIA",
    ringkasan: "Landasan hukum tertinggi ketenagakerjaan RI mengatur kesamaan kesempatan kerja, hubungan kerja, waktu kerja/lembur, pengupahan, K3, perlindungan pekerja perempuan, hingga PHK & pesangon.",
    isiLengkap: [
      "1. Landasan & Asas (Pasal 2-4): Pembangunan ketenagakerjaan berlandaskan Pancasila & UUD 1945 untuk memberdayakan tenaga kerja secara optimal dan manusiawi serta memberikan perlindungan kesejahteraan.",
      "2. Kesamaan Kesempatan & Non-Diskriminasi (Pasal 5-6): Setiap pekerja berhak atas kesempatan dan perlakuan yang sama tanpa diskriminasi jenis kelamin, suku, ras, agama, warna kulit, maupun aliran politik.",
      "3. Hak Pelatihan & Kompetensi (Pasal 11-12): Pekerja berhak meningkatkan kompetensi kerja, dan pengusaha bertanggung jawab memfasilitasi pelatihan kerja.",
      "4. Perlindungan K3 & Harkat Martabat (Pasal 86): Setiap pekerja berhak memperoleh perlindungan Keselamatan dan Kesehatan Kerja (K3), moral/kesusilaan, dan perlakuan sesuai harkat martabat manusia."
    ],
    kelompokMateri: "UU No. 13 Tahun 2003 (Ketenagakerjaan)"
  },
  {
    id: "reg-uu-13-hubungan-kerja",
    nomor: "Pasal 50-66 (UU 13/2003)",
    judul: "Aturan Hubungan Kerja, PKWT (Kontrak) & PKWTT (Tetap)",
    bab: "HUBUNGAN KERJA",
    babJudul: "SYARAT SAH PERJANJIAN KERJA & PEMBORONGAN/OUTSOURCING",
    ringkasan: "Syarat perjanjian kerja, ketentuan pekerja kontrak PKWT (jangka waktu, jenis pekerjaan musiman/sekali selesai), larangan PKWT untuk pekerjaan tetap, serta aturan penyerahan sebagian pekerjaan.",
    isiLengkap: [
      "1. Syarat Sah Perjanjian Kerja (Pasal 52): Dibuat atas kesepakatan kedua belah pihak, kecakapan hukum, adanya pekerjaan, dan tidak bertentangan dengan ketertiban umum/UU.",
      "2. Pembatasan PKWT / Kontrak (Pasal 59): PKWT hanya untuk pekerjaan sekali selesai/sementara (maksimal 3 tahun), musiman, atau produk baru. PKWT dilarang untuk pekerjaan yang bersifat tetap.",
      "3. Masa Percobaan (Pasal 58 & 60): PKWT tidak dapat mensyaratkan masa percobaan. PKWTT (tetap) dapat mensyaratkan masa percobaan paling lama 3 bulan dengan upah tidak boleh di bawah UMK.",
      "4. Alih Status Otomatis (Pasal 59 ayat 7): PKWT yang melanggar ketentuan jangka waktu atau jenis pekerjaan demi hukum berubah status menjadi PKWTT (Pekerja Tetap)."
    ],
    kelompokMateri: "UU No. 13 Tahun 2003 (Ketenagakerjaan)"
  },
  {
    id: "reg-uu-13-waktu-lembur",
    nomor: "Pasal 77-85 (UU 13/2003)",
    judul: "Ketentuan Waktu Kerja, Lembur, Istirahat & Cuti Pekerja",
    bab: "PERLINDUNGAN KERJA",
    babJudul: "JAM KERJA, UANG LEMBUR, CUTI HAID & CUTI MELAHIRKAN",
    ringkasan: "Aturan 40 jam kerja seminggu, syarat lembur & perhitungan upah lembur, cuti haid (2 hari), cuti melahirkan/keguguran (1.5 bulan), serta istirahat mingguan & libur resmi.",
    isiLengkap: [
      "1. Ketentuan Waktu Kerja (Pasal 77): 7 jam sehari & 40 jam seminggu (6 hari kerja) atau 8 jam sehari & 40 jam seminggu (5 hari kerja).",
      "2. Kerja Lembur (Pasal 78): Harus atas persetujuan pekerja, maksimal 3 jam sehari / 14 jam seminggu, dan wajib dibayar upah kerja lembur.",
      "3. Cuti Haid & Melahirkan (Pasal 81 & 82): Pekerja perempuan yang sakit haid tidak wajib bekerja pada hari ke-1 & 2 dengan upah penuh. Istirahat melahirkan 1.5 bulan sebelum & 1.5 bulan sesudah melahirkan (atau 1.5 bulan untuk keguguran).",
      "4. Hak Menyusui (Pasal 83): Pekerja perempuan yang anaknya masih menyusu wajib diberi kesempatan sepatutnya untuk menyusui anaknya selama waktu kerja."
    ],
    kelompokMateri: "UU No. 13 Tahun 2003 (Ketenagakerjaan)"
  },
  {
    id: "reg-uu-13-pengupahan",
    nomor: "Pasal 88-98 (UU 13/2003)",
    judul: "Perlindungan Pengupahan, UMK, & Denda Keterlambatan Gaji",
    bab: "PENGUPAHAN",
    babJudul: "SISTEM UPAH, STRUKTUR SKALA UPAH & KETEPATAN BAYAR",
    ringkasan: "Hak atas penghidupan layak, larangan membayar upah di bawah UMK, kewajiban Struktur Skala Upah, serta sanksi denda keterlambatan gajian.",
    isiLengkap: [
      "1. Hak Penghidupan Layak (Pasal 88): Setiap pekerja berhak memperoleh penghasilan yang memenuhi penghidupan yang layak bagi kemanusiaan.",
      "2. Larangan Upah di Bawah Minimum (Pasal 90): Pengusaha dilarang keras membayar upah lebih rendah dari Upah Minimum Kabupaten/Kota (UMK) yang berlaku.",
      "3. Asas No Work No Pay & Pengecualiannya (Pasal 93): Upah tidak dibayar jika pekerja tidak bekerja, KECUALI pekerja sakit (dokter), haid, menikah, istri melahirkan, keluarga meninggal, atau menjalankan tugas serikat/negara.",
      "4. Komponen Upah Pokok (Pasal 94): Dalam hal upah terdiri dari upah pokok dan tunjangan tetap, besarnya upah pokok sedikit-dikitnya 75% dari total upah."
    ],
    kelompokMateri: "UU No. 13 Tahun 2003 (Ketenagakerjaan)"
  },
  {
    id: "reg-uu-13-phk-pesangon",
    nomor: "Pasal 150-172 (UU 13/2003)",
    judul: "Pemutusan Hubungan Kerja (PHK), Uang Pesangon, UPMK & UPH",
    bab: "PEMUTUSAN HUBUNGAN KERJA",
    babJudul: "PROSEDUR MUSYAWARAH PHK & PERHITUNGAN HAK PESANGON",
    ringkasan: "Prinsip pencegahan PHK, larangan PHK sepihak (karena sakit/hamil/berserikat), prosedur SP 1-2-3 (Pasal 161), serta formula perhitungan Pesangon, UPMK & UPH.",
    isiLengkap: [
      "1. Wajib Musyawarah Bipartit (Pasal 151): PHK wajib dirundingkan secara Bipartit antara pengusaha dan serikat pekerja/pekerja.",
      "2. Larangan PHK (Pasal 153): Pengusaha dilarang melakukan PHK dengan alasan: sakit < 12 bulan, hamil/melahirkan, menjalankan ibadah, menikah, mendirikan/menjadi pengurus serikat pekerja, atau mengadukan pelanggaran pengusaha.",
      "3. Prosedur SP 1, 2, 3 (Pasal 161): PHK karena pelanggaran aturan hanya dapat dilakukan setelah diberikan Surat Peringatan 1, 2, dan 3 secara berturut-turut (berlaku masing-masing 6 bulan).",
      "4. Rumus Pesangon & UPMK (Pasal 156): Pesangon diberikan sesuai masa kerja (1-9 bulan upah), UPMK (2-10 bulan upah untuk masa kerja >= 3 tahun), dan UPH 15% untuk penggantian perumahan & pengobatan."
    ],
    kelompokMateri: "UU No. 13 Tahun 2003 (Ketenagakerjaan)"
  },
  {
    id: "reg-pp-35-2021",
    nomor: "PP 35/2021",
    judul: "Peraturan Pemerintah No. 35 Tahun 2021 (Aturan Pelaksana PKWT, Waktu Kerja & PHK)",
    bab: "REGULASI PELAKSANA UU",
    babJudul: "UANG KOMPENSASI PKWT, KETENTUAN LEMBUR & FORMULA PESANGON",
    ringkasan: "Aturan turunan UU Ketenagakerjaan mengenai formula uang kompensasi PKWT, batas lembur harian/mingguan, serta rincian hak pesangon sesuai alasan PHK.",
    isiLengkap: [
      "1. Uang Kompensasi PKWT: Pengusaha wajib memberikan uang kompensasi kepada pekerja PKWT yang telah memiliki masa kerja minimal 1 bulan secara terus-menerus pada saat berakhirnya masa kontrak.",
      "2. Batas Lembur Baru: Maksimal 4 jam dalam 1 hari dan 18 jam dalam 1 minggu (di luar lembur hari istirahat mingguan/libur resmi).",
      "3. Komponen Perhitungan Pesangon & UPMK: Menggunakan upah pokok dan tunjangan tetap yang diterima pekerja."
    ],
    kelompokMateri: "UU No. 13 Tahun 2003 (Ketenagakerjaan)"
  },
  {
    id: "reg-pp-36-2021",
    nomor: "PP 36/2021",
    judul: "Peraturan Pemerintah No. 36 Tahun 2021 tentang Pengupahan",
    bab: "REGULASI PELAKSANA UU",
    babJudul: "PEDOMAN UMK, STRUKTUR SKALA UPAH & POTONGAN GAJI",
    ringkasan: "Pedoman penetapan UMK Kabupaten Tangerang, Struktur Skala Upah wajib perusahaan, serta perlindungan pembayaran upah tepat waktu.",
    isiLengkap: [
      "1. Upah Minimum (UMK): UMK berlaku bagi pekerja dengan masa kerja kurang dari 1 (satu) tahun pada perusahaan.",
      "2. Struktur dan Skala Upah: Pengusaha wajib menyusun dan menerapkan struktur dan skala upah dengan memperhatikan golongan, jabatan, masa kerja, pendidikan, dan kompetensi.",
      "3. Denda Keterlambatan Pembayaran Upah: Keterlambatan pembayaran upah dikenakan denda bertahap mulai hari ke-4 sampai hari ke-8 sebesar 5% per hari."
    ],
    kelompokMateri: "UU No. 13 Tahun 2003 (Ketenagakerjaan)"
  },
  {
    id: "reg-permen-06-2016",
    nomor: "PERMEN 06/2016",
    judul: "Permenaker No. 6 Tahun 2016 tentang THR Keagamaan Pekerja",
    bab: "REGULASI PELAKSANA UU",
    babJudul: "HAK TUNJANGAN HARI RAYA KEAGAMAAN PEKERJA PABRIK",
    ringkasan: "Ketentuan pembayaran THR wajib 1x upah penuh untuk masa kerja >= 12 bulan dan proporsional untuk masa kerja >= 1 bulan, dibayar H-7.",
    isiLengkap: [
      "1. Wajib Dibayar Penuh (Non-Cicil): THR Keagamaan wajib dibayarkan selambat-lambatnya 7 (tujuh) hari sebelum Hari Raya Keagamaan.",
      "2. Besaran THR: Pekerja masa kerja >= 12 bulan berhak 1 bulan upah. Masa kerja 1 - 12 bulan dibayar proporsional (Masa Kerja / 12 x 1 Bulan Upah).",
      "3. Sanksi Keterlambatan: Pengusaha yang terlambat membayar THR dikenakan denda sebesar 5% dari total THR yang harus dibayar."
    ],
    kelompokMateri: "UU No. 13 Tahun 2003 (Ketenagakerjaan)"
  },

  // ==========================================
  // KELOMPOK MATERI: UU NO 2 TAHUN 2004 (PPHI)
  // ==========================================
  {
    id: "reg-uu-2-2004-pokok",
    nomor: "UU 2/2004",
    judul: "Undang-Undang No. 2 Tahun 2004 tentang Penyelesaian Perselisihan Hubungan Industrial (PPHI)",
    bab: "REGULASI NASIONAL PPHI",
    babJudul: "MEKANISME PENYELESAIAN PERSELISIHAN INDUSTRIAL PABRIK & PERUSAHAAN",
    ringkasan: "Landasan hukum penyelesaian sengketa ketenagakerjaan antara pekerja/serikat buruh dengan pengusaha secara cepat, tepat, adil, dan murah melalui Bipartit, Mediasi, Konsiliasi, Arbitrase, hingga Pengadilan Hubungan Industrial (PHI).",
    isiLengkap: [
      "1. Maksud & Tujuan (Pasal 1): Mengatur tata cara penyelesaian perselisihan hubungan industrial yang timbul dari perbedaan pendapat antara pekerja/serikat pekerja dengan pengusaha.",
      "2. Empat (4) Jenis Perselisihan (Pasal 2): (a) Perselisihan Hak (tidak dipenuhinya hak normatif PKB/UU), (b) Perselisihan Kepentingan (perubahan syarat kerja/PKB), (c) Perselisihan PHK (ketidaksesuaian pendapat pengakhiran kerja), dan (d) Perselisihan Antar Serikat Pekerja dalam 1 perusahaan.",
      "3. Asas Musyawarah Bipartit (Pasal 3): Setiap perselisihan hubungan industrial WAJIB diupayakan penyelesaiannya terlebih dahulu melalui perundingan Bipartit secara musyawarah mufakat.",
      "4. Perlindungan Hukum Bebas Biaya (Pasal 58): Pihak pekerja/buruh yang berperkara di Pengadilan Hubungan Industrial (PHI) tidak dikenakan biaya perkara termasuk eksekusi jika nilai gugatan di bawah Rp 150.000.000,-."
    ],
    kelompokMateri: "UU No. 2 Tahun 2004 (PPHI)"
  },
  {
    id: "reg-uu-2-bipartit",
    nomor: "Pasal 3 - 7 (UU 2/2004)",
    judul: "Prosedur Perundingan Bipartit, Risalah Sidang & Akta Perjanjian Bersama",
    bab: "TATA CARA BIPARTIT",
    babJudul: "TAHAP PERTAMA PERUNDINGAN MANDIRI PEKERJA & MANAJEMEN",
    ringkasan: "Batas waktu Bipartit maksimal 30 hari kerja, kewajiban pembuatan Risalah Bipartit, serta pendaftaran Perjanjian Bersama ke Pengadilan Hubungan Industrial (PHI) agar memiliki kekuatan eksekusi.",
    isiLengkap: [
      "1. Batas Waktu Bipartit (Pasal 3 ayat 2): Perundingan Bipartit harus diselesaikan paling lama 30 (tiga puluh) hari kerja sejak tanggal dimulainya perundingan.",
      "2. Kewajiban Risalah Bipartit (Pasal 6): Setiap Bipartit wajib dibuatkan risalah resmi memuat nama pihak, tanggal, tempat, pokok masalah, pendapat para pihak, dan kesimpulan ditandatangani kedua belah pihak.",
      "3. Akta Perjanjian Bersama (Pasal 7): Jika Bipartit mencapai kesepakatan, dibuat Perjanjian Bersama yang mengikat secara hukum dan WAJIB didaftarkan ke PHI pada Pengadilan Negeri setempat.",
      "4. Permohonan Eksekusi (Pasal 7 ayat 5): Jika salah satu pihak tidak melaksanakan Perjanjian Bersama yang telah didaftarkan, pihak yang dirugikan dapat mengajukan permohonan eksekusi ke Ketua Pengadilan Negeri."
    ],
    kelompokMateri: "UU No. 2 Tahun 2004 (PPHI)"
  },
  {
    id: "reg-uu-2-tripartit-mediasi",
    nomor: "Pasal 8 - 54 (UU 2/2004)",
    judul: "Tahap Tripartit: Mediasi Disnaker, Konsiliasi & Arbitrase Industrial",
    bab: "PENYELESAIAN TRIPARTIT",
    babJudul: "PERAN MEDIATOR DISNAKER, ANJURAN TERTULIS & ARBITRASE FINAL",
    ringkasan: "Pencatatan perselisihan ke Disnaker jika Bipartit gagal, mekanisme Anjuran Tertulis Mediator (maksimal 30 hari kerja), serta proses arbitrase khusus perselisihan kepentingan/antar serikat.",
    isiLengkap: [
      "1. Pencatatan Perselisihan (Pasal 4): Jika Bipartit gagal, salah satu atau kedua pihak mencatatkan perselisihannya ke Dinas Ketenagakerjaan (Disnaker) setempat melampirkan bukti risalah Bipartit.",
      "2. Waktu Penyelesaian Mediasi (Pasal 15): Mediator Disnaker wajib menyelesaikan tugas mediasi paling lambat 30 (tiga puluh) hari kerja sejak menerima pelimpahan berkas.",
      "3. Anjuran Tertulis Mediator (Pasal 13): Jika mediasi tidak mencapai sepakat, Mediator mengeluarkan Anjuran Tertulis dalam waktu 10 hari kerja. Para pihak wajib menjawab setuju/menolak dalam waktu 10 hari kerja.",
      "4. Putusan Arbitrase Final (Pasal 51): Penyelesaian perselisihan kepentingan / antar serikat melalui Arbitrase menghasilkan Putusan Arbitrase yang bersifat akhir dan mengikat (final & binding)."
    ],
    kelompokMateri: "UU No. 2 Tahun 2004 (PPHI)"
  },
  {
    id: "reg-uu-2-phi-kasasi",
    nomor: "Pasal 55 - 115 (UU 2/2004)",
    judul: "Pengadilan Hubungan Industrial (PHI) & Gugatan Kasasi Mahkamah Agung",
    bab: "PERADILAN PHI & KASASI",
    babJudul: "HUKUM ACARA PHI, MAJELIS HAKIM AD-HOC, SANKSI & KASASI MA",
    ringkasan: "Wewenang PHI memeriksa sengketa hak, PHK, dan kepentingan, komposisi Majelis Hakim (1 Hakim PN + 2 Hakim Ad-Hoc Serikat/Pengusaha), batas waktu sidang 50 hari kerja, dan Kasasi MA.",
    isiLengkap: [
      "1. Wewenang PHI (Pasal 56): PHI berwenang memeriksa & memutus perselisihan Hak dan PHK di tingkat pertama, serta perselisihan Kepentingan dan Antar Serikat di tingkat pertama & terakhir.",
      "2. Majelis Hakim Tripartit (Pasal 88): Persidangan PHI dipimpin Majelis Hakim terdiri dari 1 Hakim PN sebagai Ketua Majelis dan 2 Hakim Ad-Hoc (usulan Serikat Pekerja dan Organisasi Pengusaha).",
      "3. Cepat & Berbatas Waktu (Pasal 103): Majelis Hakim PHI wajib memberikan putusan penyelesaian perselisihan dalam waktu selambat-lambatnya 50 (lima puluh) hari kerja sejak sidang pertama.",
      "4. Upaya Hukum Kasasi MA (Pasal 110 & 115): Putusan PHI mengenai perselisihan Hak dan PHK dapat diajukan permohonan Kasasi ke Mahkamah Agung dalam waktu 14 hari kerja, dan MA wajib memutus dalam 30 hari kerja."
    ],
    kelompokMateri: "UU No. 2 Tahun 2004 (PPHI)"
  },

  // ==========================================
  // KELOMPOK MATERI: UU NO 6 TAHUN 2023 (CIPTA KERJA)
  // ==========================================
  {
    id: "reg-uu-6-2023-pokok",
    nomor: "UU 6/2023",
    judul: "Undang-Undang No. 6 Tahun 2023 tentang Cipta Kerja (Penetapan Perpu 2/2022)",
    bab: "REGULASI OMNIBUS",
    babJudul: "PENETAPAN PERPU CIPTA KERJA MENJADI UNDANG-UNDANG REPUBLIK INDONESIA",
    ringkasan: "Penetapan Perpu No. 2 Tahun 2022 menjadi UU No. 6 Tahun 2023 yang merevisi dan mengubah beberapa pasal strategis Ketenagakerjaan (UU 13/2003), pengupahan, PKWT, Alih Daya, serta program Jaminan Kehilangan Pekerjaan (JKP).",
    isiLengkap: [
      "1. Penetapan Sah UU Cipta Kerja (Pasal 1-2): Mengesahkan Peraturan Pemerintah Pengganti Undang-Undang (Perpu) No. 2 Tahun 2022 menjadi Undang-Undang No. 6 Tahun 2023 resmi berlaku sejak 31 Maret 2023.",
      "2. Klaster Ketenagakerjaan (BAB IV Pasal 80-81): Mengubah, menyempurnakan, dan menambah ketentuan dalam UU No. 13 Tahun 2003 Ketenagakerjaan, UU No. 40 Tahun 2004 SJSN, UU No. 24 Tahun 2011 BPJS, serta UU No. 18 Tahun 2017 Perlindungan Pekerja Migran.",
      "3. Perlindungan & Kesejahteraan Pekerja (Pasal 80): Perubahan bertujuan menguatkan perlindungan kepada tenaga kerja, meningkatkan daya saing industri, serta memperluas jaminan sosial pekerja.",
      "4. Keabsahan PKB / Peraturan Perusahaan (Pasal 184): Peraturan pelaksanaan dan PKB yang telah disepakati sebelum berlakunya UU No. 6 Tahun 2023 tetap berlaku sepanjang tidak bertentangan dengan UU."
    ],
    kelompokMateri: "UU No. 6 Tahun 2023 (Cipta Kerja)"
  },
  {
    id: "reg-uu-6-pkwt-outsourcing",
    nomor: "Pasal 56, 59, 64 & 66 (UU 6/2023)",
    judul: "Ketentuan Kontrak Kerja (PKWT), Kompensasi Kontrak & Alih Daya (Outsourcing)",
    bab: "HUBUNGAN KERJA & PKWT",
    babJudul: "SKEMA BARU PKWT, HAK UANG KOMPENSASI & PERLINDUNGAN ALIH DAYA",
    ringkasan: "Pembaruan skema PKWT, kewajiban pembayaran Uang Kompensasi PKWT pada akhir kontrak (Pasal 61A), serta perlindungan alih daya/outsourcing (Pasal 64 & 66).",
    isiLengkap: [
      "1. Perjanjian Kerja Waktu Tertentu / PKWT (Pasal 56 & 59): PKWT didasarkan atas jangka waktu atau selesainya suatu pekerjaan tertentu. Dilarang untuk pekerjaan bersifat tetap.",
      "2. Hak Uang Kompensasi PKWT (Pasal 61A): Pengusaha WAJIB memberikan uang kompensasi kepada pekerja PKWT yang telah memiliki masa kerja paling sedikit 1 bulan secara terus-menerus saat berakhirnya PKWT.",
      "3. Penyerahan Sebagian Pekerjaan / Alih Daya (Pasal 64): Perusahaan dapat menyerahkan sebagian pelaksanaan pekerjaan kepada perusahaan alih daya (outsourcing) melalui perjanjian tertulis yang ditetapkan Pemerintah.",
      "4. Perlindungan Pekerja Alih Daya (Pasal 66): Hubungan kerja pekerja alih daya didasarkan pada PKWT/PKWTT. Perlindungan upah, kesejahteraan, K3, dan perselisihan menjadi tanggung jawab penuh perusahaan alih daya. Jika terjadi pergantian vendor alih daya untuk objek pekerjaan yang sama, hak-hak pekerja wajib dilanjutkan (Transfer of Protection)."
    ],
    kelompokMateri: "UU No. 6 Tahun 2023 (Cipta Kerja)"
  },
  {
    id: "reg-uu-6-pengupahan",
    nomor: "Pasal 88, 88C, 88D, 88F (UU 6/2023)",
    judul: "Sistem Pengupahan Baru, Formula UMK, & Struktur Skala Upah",
    bab: "SISTEM PENGUPAHAN",
    babJudul: "FORMULA UPAH MINIMUM, INDEKS TERTIBA, & STRUKTUR SKALA UPAH",
    ringkasan: "Hak upah layak, kewajiban penetapan UMP & UMK oleh Gubernur dengan mempertimbangkan pertumbuhan ekonomi, inflasi & indeks tertentu, serta kewajiban Struktur Skala Upah.",
    isiLengkap: [
      "1. Hak Penghidupan Layak (Pasal 88): Setiap pekerja berhak atas penghidupan yang layak bagi kemanusiaan melalui kebijakan pengupahan nasional.",
      "2. Penetapan Upah Minimum (Pasal 88C & 88D): Gubernur wajib menetapkan Upah Minimum Provinsi (UMP) dan dapat menetapkan Upah Minimum Kabupaten/Kota (UMK) berdasarkan perhitungan pertumbuhan ekonomi, inflasi, dan indeks tertentu (alfa).",
      "3. Masa Kerja < 1 Tahun (Pasal 88E): Upah minimum berlaku bagi pekerja dengan masa kerja kurang dari 1 (satu) tahun. Pengusaha dilarang membayar upah lebih rendah dari upah minimum.",
      "4. Struktur & Skala Upah Wajib (Pasal 92): Pengusaha wajib menyusun dan menerapkan struktur dan skala upah bagi pekerja dengan masa kerja 1 tahun atau lebih dengan memperhatikan kemampuan perusahaan dan produktivitas."
    ],
    kelompokMateri: "UU No. 6 Tahun 2023 (Cipta Kerja)"
  },
  {
    id: "reg-uu-6-phk-pesangon",
    nomor: "Pasal 151, 151A, 154A, 156 (UU 6/2023)",
    judul: "Prosedur PHK Bipartit, Alasan Resmi PHK, Pesangon & UPMK",
    bab: "PEMUTUSAN HUBUNGAN KERJA",
    babJudul: "MEKANISME PEMBERITAHUAN PHK, PROSES BIPARTIT & REVISI HAK PESANGON",
    ringkasan: "Prosedur pemberitahuan PHK secara tertulis (Pasal 151), kondisi PHK tanpa pemberitahuan (Pasal 151A), daftar 15 alasan resmi PHK (Pasal 154A), serta besaran Pesangon, UPMK & UPH (Pasal 156).",
    isiLengkap: [
      "1. Mekanisme Pemberitahuan PHK (Pasal 151): Pengusaha wajib memberitahukan maksud dan alasan PHK secara tertulis kepada pekerja/serikat pekerja. Jika pekerja menolak, wajib dilakukan perundingan Bipartit.",
      "2. PHK Tanpa Pemberitahuan (Pasal 151A): Pemberitahuan PHK tidak perlu dilakukan jika: pekerja mengundurkan diri secara sukarela, berakhirnya masa PKWT, pekerja mencapai usia pensiun, atau pekerja meninggal dunia.",
      "3. Alasan Resmi PHK (Pasal 154A): PHK dapat terjadi karena: penggabungan/peleburan perusahaan, efisiensi, perusahaan tutup/rugi 2 tahun berturut-turut, force majeure, PPU, pailit, mangkir 5 hari kerja, SP 1-2-3, atau usia pensiun.",
      "4. Ketentuan Uang Pesangon & UPMK (Pasal 156): Pengusaha wajib membayar Uang Pesangon (1 s/d 9 bulan upah), Uang Penghargaan Masa Kerja / UPMK (2 s/d 10 bulan upah untuk masa kerja >= 3 tahun), dan Uang Penggantian Hak / UPH (cuti belum gugur & ongkos pulang)."
    ],
    kelompokMateri: "UU No. 6 Tahun 2023 (Cipta Kerja)"
  },
  {
    id: "reg-uu-6-jkp-bpjs",
    nomor: "Pasal 46A - 46E (UU 6/2023 / SJSN)",
    judul: "Program Jaminan Kehilangan Pekerjaan (JKP) BPJS Ketenagakerjaan",
    bab: "JAMINAN SOSIAL BARU",
    babJudul: "PROTEKSI PEKERJA TERKENA PHK: UANG TUNAI, AKSEBILITAS KERJA & PELATIHAN",
    ringkasan: "Program jaminan sosial baru JKP bagi pekerja terPHK berupa manfaat uang tunai selama 6 bulan, informasi pasar kerja, dan pelatihan kerja gratis.",
    isiLengkap: [
      "1. Hak Atas JKP (Pasal 46A): Pekerja/buruh yang mengalami pemutusan hubungan kerja (PHK) berhak mendapatkan Jaminan Kehilangan Pekerjaan (JKP).",
      "2. Penyelenggara JKP (Pasal 46A ayat 2): JKP diselenggarakan oleh BPJS Ketenagakerjaan dan Pemerintah Pusat tanpa membebani iuran baru kepada pekerja.",
      "3. Bentuk Manfaat JKP (Pasal 46D): Manfaat JKP meliputi: (a) Uang tunai paling banyak 6 (enam) bulan upah, (b) Akses informasi pasar kerja, dan (c) Pelatihan kerja berbasis kompetensi.",
      "4. Tujuan JKP (Pasal 46B): Mempertahankan derajat kehidupan yang layak bagi pekerja saat kehilangan pekerjaan sambil berusaha mendapatkan pekerjaan kembali."
    ],
    kelompokMateri: "UU No. 6 Tahun 2023 (Cipta Kerja)"
  },

  // ==========================================
  // KELOMPOK MATERI: PERATURAN PERUSAHAAN & K3
  // ==========================================
  {
    id: "reg-k3-sgr-01",
    nomor: "K3-SGR/01",
    judul: "10 Safety Golden Rules (Aturan Emas Keselamatan) PT VCI",
    bab: "K3 & LINGKUNGAN",
    babJudul: "TATA TERTIB KESELAMATAN & KESEHATAN KERJA FABRIKASI",
    ringkasan: "10 Aturan Emas Keselamatan Kerja yang wajib dipatuhi seluruh pekerja di lingkungan pabrik PT VCI.",
    isiLengkap: [
      "1. APD Lengkap: Wajib menggunakan Alat Pelindung Diri (APD) standar (sepatu safety, masker, earplug, kacamata) sesuai risiko area kerja.",
      "2. Bekerja di Ketinggian: Wajib menggunakan Full Body Harness dengan double lanyard terancor sah bila bekerja di ketinggian > 1.8 meter.",
      "3. Isolasi Energi LOTO: Wajib memasang Lock Out Tag Out (LOTO) sebelum perbaikan/perawatan mesin listrik/mekanik.",
      "4. Izin Kerja Panas (Hot Work Permit): Wajib memiliki izin resmi untuk pengelasan, pemotongan api, atau gerinda di area berisiko kebakaran.",
      "5. Larangan Bypass Safety Device: Dilarang keras mematikan, melepas, atau melewati sistem sensor keselamatan mesin tanpa izin EHS.",
      "6. Bebas Bahan Kimia Berbahaya: Wajib mengikuti petunjuk Lembar Data Keselamatan Bahan (MSDS/LDKB) saat mengelola bahan kimia produksi.",
      "7. Keselamatan Fasilitas Ibu Hamil: Pekerja hamil wajib melapor ke EHS/Poliklinik untuk pemindahan area kerja non-zat kimia dan pemberian toilet duduk serta bebas lembur."
    ],
    kelompokMateri: "Peraturan Perusahaan & K3"
  },
  {
    id: "reg-pp-etik-02",
    nomor: "PP-ETIK/02",
    judul: "Kode Etik & Tata Tertib Kedisiplinan Kerja PT VCI",
    bab: "PERATURAN PERUSAHAAN",
    babJudul: "STANDAR PERILAKU & DISIPLIN KERJA PABRIK",
    ringkasan: "Aturan penggunaan ID Card KPK, larangan merokok di area pabrik, larangan membawa barang terlarang, dan kewajiban menjaga fasilitas.",
    isiLengkap: [
      "1. ID Card / KPK: Wajib dikalungkan dan terlihat jelas dari pintu gerbang masuk sampai keluar area perusahaan.",
      "2. Bebas Asap Rokok: Dilarang merokok atau menggunakan rokok elektrik (vape) di seluruh area produksi, gudang, dan kantin.",
      "3. Penggunaan HP saat Jam Kerja: Dilarang menggunakan HP untuk keperluan non-pekerjaan saat mengoperasikan mesin produksi.",
      "4. Perlindungan Fasilitas Pabrik: Dilarang merusak, memindahkan, atau menggunakan inventaris perusahaan untuk kepentingan pribadi."
    ],
    kelompokMateri: "Peraturan Perusahaan & K3"
  },

  // ==========================================
  // KELOMPOK MATERI: SOP & PANDUAN ORGANISASI
  // ==========================================
  {
    id: "reg-sop-org-01",
    nomor: "SOP-ORG/01",
    judul: "SOP Penanganan Keluh Kesah & Forum Bipartit SBN KASBI VCI",
    bab: "SOP ADVOKASI",
    babJudul: "PROSEDUR PENYELESAIAN KELUH KESAH & HUBUNGAN INDUSTRIAL",
    ringkasan: "Alur pengaduan masalah kerja dari tingkat Korlap, Pengurus Harian, hingga perundingan Bipartit resmi dengan Management HR PT VCI.",
    isiLengkap: [
      "1. Tingkat 1 (Korlap Line/Dept): Anggota melaporkan masalah kepada Koordinator Lapangan (Korlap) untuk diselesaikan secara musyawarah dengan Supervisor Line.",
      "2. Tingkat 2 (Tim Advokasi Organisasi): Jika tidak selesai dalam 3 hari, Korlap meneruskan formulir aduan ke Tim Advokasi SBN KASBI VCI.",
      "3. Tingkat 3 (Bipartit HR Management): Tim Advokasi mengajukan surat permohonan perundingan Bipartit resmi dengan Manajemen HR.",
      "4. Pencatatan & Risalah Bipartit: Setiap Bipartit wajib menghasilkan Risalah Perundingan ber-SK bersama yang ditandatangani kedua belah pihak."
    ],
    kelompokMateri: "SOP & Panduan Organisasi"
  },
  {
    id: "reg-sop-org-02",
    nomor: "SOP-ORG/02",
    judul: "Panduan Hak Pendampingan SP, Evaluasi Sanksi & Mutasi",
    bab: "SOP ADVOKASI",
    babJudul: "PERLINDUNGAN HAK HUKUM & BANTUAN ANGGOTA",
    ringkasan: "Hak anggota didampingi Pengurus Serikat saat pemanggilan SP/Investigasi serta prosedur penolakan mutasi yang tidak seimbang.",
    isiLengkap: [
      "1. Hak Atas Pendampingan: Anggota yang dipanggil HR/Atasan terkait dugaan pelanggaran atau pemberian SP berhak menolak diperiksa sebelum didampingi Pengurus Serikat.",
      "2. Pemeriksaan Bukti Obyektif: Tim Advokasi memeriksa kesesuaian fakta pelanggaran dengan Pasal PKB/SOP sebelum penandatanganan berita acara.",
      "3. Hak Menolak Penandatanganan: Anggota dan Pengurus berhak tidak menandatangani surat SP jika proses investigasi dinilai tidak adil/tanpa bukti, dan mengajukan sanggahan tertulis."
    ],
    kelompokMateri: "SOP & Panduan Organisasi"
  }
];
