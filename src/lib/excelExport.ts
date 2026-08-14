import * as XLSX from 'xlsx';
import { AdvocacyCase, SickVisit, VehicleLog } from '../types';
import { exportWorkbookToExcel } from '../utils/exportAndPrintUtils';
import { getLocalDateISO } from '../utils/dateUtils';
import { calculateDistanceKm } from '../utils/vehicleUtils';

/**
 * Export Sick Visit (Pendampingan Sakit) data to Excel (.xlsx) SBN KASBI SOP 2026-2029
 */
export const exportSickVisitToExcel = (sickVisits: SickVisit[]) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Prepare table rows
  const excelData = sickVisits.map((visit, index) => {
    const lastLog = visit.riwayatKunjungan && visit.riwayatKunjungan.length > 0
      ? visit.riwayatKunjungan[0].catatan
      : '-';

    const pasienText = visit.jenisPasien === 'Keluarga' && visit.namaPasien
      ? `${visit.namaPasien} (${visit.hubunganPasien || 'Keluarga'})`
      : `${visit.namaAnggota} (Anggota Sendiri)`;

    const petugasText = [visit.petugas1, visit.petugas2].filter(Boolean).join(' & ') || visit.pengurusPenanggungJawab || '-';
    const totalAkomodasiText = visit.akomodasi?.totalAkomodasi ? `Rp ${visit.akomodasi.totalAkomodasi.toLocaleString('id-ID')}` : '-';

    return {
      'No': index + 1,
      'No. Pendampingan': visit.nomorPendampingan,
      'NIK Anggota': visit.nikAnggota,
      'Nama Anggota': visit.namaAnggota,
      'Pasien & Hubungan': pasienText,
      'Departemen': visit.departemen,
      'No. WhatsApp/HP': visit.nomorHp || '-',
      'Urgensi': visit.isUrgent ? 'Mendesak / Urgent RS' : 'Biasa / Rawat Jalan',
      'Lokasi Awal': visit.lokasiAwal || visit.jenisLokasi || '-',
      'Rumah Sakit Tujuan': visit.rumahSakitTujuan || visit.lokasi || '-',
      'Status RS': visit.isRsKerjaSama ? 'RS Kerja Sama' : 'Bukan Mitra',
      'Petugas Pendamping': petugasText,
      'Transportasi': visit.transportasi || '-',
      'Hasil Pendampingan': visit.hasilPendampingan || visit.status,
      'Akomodasi SOP': totalAkomodasiText,
      'Status Workflow': visit.status,
      'Tgl Kunjungan/Lapor': visit.tanggalKunjunganAwal,
      'Laporan Grup PTP': visit.sudahLaporGrupPtp ? 'Sudah Dilaporkan' : 'Belum',
      'Catatan / Diagnosa': visit.diagnosaSingkat || visit.catatanAwal || visit.deskripsiKondisi || '-',
      'Log Terakhir': lastLog
    };
  });

  // Add Summary Statistics Sheet
  const totalCases = sickVisits.length;
  const waitingCount = sickVisits.filter(v => v.status === 'Dilaporkan' || v.status === 'Menunggu Koordinasi' || v.status === 'Menunggu Kunjungan').length;
  const inProgressCount = sickVisits.filter(v => v.status === 'Disetujui' || v.status === 'Ditugaskan' || v.status === 'Dalam Pendampingan' || v.status === 'Sedang Didampingi').length;
  const finishedCount = sickVisits.filter(v => v.status === 'Selesai').length;
  const rejectedCount = sickVisits.filter(v => v.status === 'Ditolak').length;
  const rawatInapCount = sickVisits.filter(v => v.hasilPendampingan === 'RAWAT INAP').length;

  const summaryData = [
    { 'Kategori Statistik': 'Total Kasus Pendampingan Sakit', 'Jumlah': totalCases },
    { 'Kategori Statistik': 'Status: Dilaporkan / Menunggu Koordinasi', 'Jumlah': waitingCount },
    { 'Kategori Statistik': 'Status: Dalam Pendampingan', 'Jumlah': inProgressCount },
    { 'Kategori Statistik': 'Status: Selesai', 'Jumlah': finishedCount },
    { 'Kategori Statistik': 'Status: Ditolak', 'Jumlah': rejectedCount },
    { 'Kategori Statistik': 'Hasil: Pasien Rawat Inap', 'Jumlah': rawatInapCount },
    { 'Kategori Statistik': 'Tanggal Cetak Laporan', 'Jumlah': dateStr },
    { 'Kategori Statistik': 'Organisasi', 'Jumlah': 'SBN KASBI PT Victory Chingluh Indonesia' }
  ];

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  // Create Worksheets
  const worksheetData = XLSX.utils.json_to_sheet(excelData);
  const worksheetSummary = XLSX.utils.json_to_sheet(summaryData);

  // Set column widths
  worksheetData['!cols'] = [
    { wch: 5 },   // No
    { wch: 18 },  // No Pendampingan
    { wch: 14 },  // NIK
    { wch: 24 },  // Nama Anggota
    { wch: 26 },  // Pasien & Hubungan
    { wch: 18 },  // Dept
    { wch: 16 },  // HP
    { wch: 20 },  // Urgensi
    { wch: 20 },  // Lokasi Awal
    { wch: 28 },  // RS Tujuan
    { wch: 16 },  // Status RS
    { wch: 26 },  // Petugas Pendamping
    { wch: 20 },  // Transportasi
    { wch: 20 },  // Hasil Pendampingan
    { wch: 18 },  // Akomodasi SOP
    { wch: 22 },  // Status Workflow
    { wch: 18 },  // Tgl Kunjungan
    { wch: 18 },  // Laporan Grup PTP
    { wch: 30 },  // Catatan
    { wch: 35 }   // Log Terakhir
  ];

  worksheetSummary['!cols'] = [
    { wch: 45 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheetData, 'Laporan Anggota Sakit');
  XLSX.utils.book_append_sheet(workbook, worksheetSummary, 'Ringkasan Eksekutif');

  // Trigger Download
  const fileName = `Laporan_Anggota_Sakit_SBN_VCI_${getLocalDateISO()}.xlsx`;
  exportWorkbookToExcel(workbook, fileName);
};

/**
 * Export Advocacy Cases (Pendampingan Advokasi) data to Excel (.xlsx)
 */
export const exportAdvocacyToExcel = (advocacyCases: AdvocacyCase[]) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Prepare table rows
  const excelData = advocacyCases.map((kasus, index) => {
    const lastUpdate = kasus.riwayatPerkembangan && kasus.riwayatPerkembangan.length > 0
      ? kasus.riwayatPerkembangan[kasus.riwayatPerkembangan.length - 1].catatan
      : '-';

    return {
      'No': index + 1,
      'No. Kasus': kasus.nomorKasus,
      'NIK Anggota': kasus.nikAnggota,
      'Nama Anggota': kasus.namaAnggota,
      'Departemen': kasus.departemen,
      'Judul Kasus': kasus.judulKasus,
      'Kategori Masalah': kasus.kategori,
      'Tanggal Dibuat': kasus.tanggalDibuat,
      'Status Kasus': kasus.status,
      'Pendamping Utama': kasus.pendampingUtama,
      'Deskripsi Singkat': kasus.deskripsiMasalah,
      'Total Update': kasus.riwayatPerkembangan?.length || 0,
      'Perkembangan Terbaru': lastUpdate
    };
  });

  // Summary Data
  const totalCases = advocacyCases.length;
  const statusNew = advocacyCases.filter(c => c.status === 'Baru').length;
  const statusAdvocating = advocacyCases.filter(c => c.status === 'Dalam Pendampingan' || c.status === 'Negosiasi').length;
  const statusMediation = advocacyCases.filter(c => c.status === 'Mediasi' || c.status === 'Mediation').length;
  const statusFinished = advocacyCases.filter(c => c.status === 'Selesai' || c.status === 'Ditutup').length;

  const summaryData = [
    { 'Indikator Advokasi': 'Total Kasus Advokasi Terdaftar', 'Jumlah Kasus': totalCases },
    { 'Indikator Advokasi': 'Status Kasus Baru', 'Jumlah Kasus': statusNew },
    { 'Indikator Advokasi': 'Status Dalam Pendampingan / Negosiasi', 'Jumlah Kasus': statusAdvocating },
    { 'Indikator Advokasi': 'Status Mediasi / Tripartit', 'Jumlah Kasus': statusMediation },
    { 'Indikator Advokasi': 'Status Selesai / Ditutup', 'Jumlah Kasus': statusFinished },
    { 'Indikator Advokasi': 'Tanggal Cetak Laporan', 'Jumlah Kasus': dateStr },
    { 'Indikator Advokasi': 'Organisasi Pembuat', 'Jumlah Kasus': 'SBN KASBI PT Victory Chingluh Indonesia' }
  ];

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  // Create Worksheets
  const worksheetData = XLSX.utils.json_to_sheet(excelData);
  const worksheetSummary = XLSX.utils.json_to_sheet(summaryData);

  // Set column widths
  worksheetData['!cols'] = [
    { wch: 5 },   // No
    { wch: 16 },  // No Kasus
    { wch: 14 },  // NIK
    { wch: 24 },  // Nama
    { wch: 18 },  // Dept
    { wch: 28 },  // Judul
    { wch: 22 },  // Kategori
    { wch: 15 },  // Tgl Dibuat
    { wch: 20 },  // Status
    { wch: 22 },  // Pendamping
    { wch: 35 },  // Deskripsi
    { wch: 12 },  // Total Update
    { wch: 35 }   // Catatan Terbaru
  ];

  worksheetSummary['!cols'] = [
    { wch: 42 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheetData, 'Data Laporan Advokasi');
  XLSX.utils.book_append_sheet(workbook, worksheetSummary, 'Ringkasan Kasus');

  // Download
  const fileName = `Laporan_Advokasi_SBN_VCI_${getLocalDateISO()}.xlsx`;
  exportWorkbookToExcel(workbook, fileName);
};

/**
 * Export Vehicle Logs (Penggunaan Kendaraan Operasional) to Excel (.xlsx)
 */
export const exportVehicleLogsToExcel = (vehicleLogs: VehicleLog[]) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const excelData = vehicleLogs.map((log, index) => {
    const jarak = log.jarakTempuhKm ?? calculateDistanceKm(log.kmAwal, log.kmAkhir);
    const driverText = log.driverNama || log.namaPemakai || '-';
    const statusText = log.status === 'Sudah Kembali' ? 'Selesai' : log.status;

    return {
      'No': index + 1,
      'No. Log': log.nomorLog,
      'Kendaraan': log.kendaraan,
      'Plat Nomor': log.platNomor || '-',
      'Lokasi Parkir': log.lokasiParkir || '-',
      'Nama Pemohon': log.namaPemakai,
      'Departemen/Unit': log.departemenPemakai || '-',
      'No. HP Pemohon': log.kontakPemakai || '-',
      'Nama Kegiatan': log.kegiatan || '-',
      'Tujuan / Lokasi': log.tujuan,
      'Urgensi': log.isUrgent || log.jenisPenggunaan === 'Urgensi' ? 'URGENT' : 'Biasa',
      'Tanggal Mulai': log.tanggalMulai,
      'Jam Berangkat': log.jamMulai,
      'Tanggal Selesai': log.tanggalSelesai || log.tanggalMulai,
      'Jam Kembali': log.jamSelesai,
      'Petugas / Driver': driverText,
      'No. HP Driver': log.driverKontak || '-',
      'Disetujui Oleh': log.disetujuiOleh || log.petugasSerahTerima || '-',
      'KM Awal': log.kmAwal ?? '-',
      'KM Akhir': log.kmAkhir ?? '-',
      'Jarak Tempuh (KM)': jarak > 0 ? `${jarak} KM` : '-',
      'Kondisi Kembali': log.adaKerusakan ? `Bermasalah: ${log.penjelasanKerusakan || '-'}` : (log.kondisiKembali || 'Baik'),
      'Status': statusText,
      'Catatan': log.catatan || log.keteranganSingkat || '-'
    };
  });

  // Summary statistics
  const totalCount = vehicleLogs.length;
  const selesaiCount = vehicleLogs.filter(l => l.status === 'Selesai' || l.status === 'Sudah Kembali').length;
  const inUseCount = vehicleLogs.filter(l => l.status === 'Sedang Digunakan' || l.status === 'Siap Digunakan').length;
  const pendingCount = vehicleLogs.filter(l => l.status === 'Menunggu Persetujuan').length;
  const urgentCount = vehicleLogs.filter(l => l.isUrgent || l.jenisPenggunaan === 'Urgensi').length;

  const totalKm = vehicleLogs.reduce((acc, l) => {
    const j = l.jarakTempuhKm ?? calculateDistanceKm(l.kmAwal, l.kmAkhir);
    return acc + j;
  }, 0);

  const summaryData = [
    { 'Indikator Kendaraan': 'Total Catatan Penggunaan Kendaraan', 'Jumlah': totalCount },
    { 'Indikator Kendaraan': 'Status Selesai / Selesai Digunakan', 'Jumlah': selesaiCount },
    { 'Indikator Kendaraan': 'Status Sedang Digunakan', 'Jumlah': inUseCount },
    { 'Indikator Kendaraan': 'Status Menunggu Persetujuan', 'Jumlah': pendingCount },
    { 'Indikator Kendaraan': 'Penggunaan Kategori Urgensi', 'Jumlah': urgentCount },
    { 'Indikator Kendaraan': 'Total Akumulasi Jarak Tempuh Tercatat', 'Jumlah': `${totalKm.toLocaleString('id-ID')} KM` },
    { 'Indikator Kendaraan': 'Tanggal Cetak Laporan', 'Jumlah': dateStr },
    { 'Indikator Kendaraan': 'Organisasi', 'Jumlah': 'SBN KASBI PT Victory Chingluh Indonesia' }
  ];

  const workbook = XLSX.utils.book_new();
  const worksheetData = XLSX.utils.json_to_sheet(excelData);
  const worksheetSummary = XLSX.utils.json_to_sheet(summaryData);

  worksheetData['!cols'] = [
    { wch: 5 },   // No
    { wch: 15 },  // No Log
    { wch: 22 },  // Kendaraan
    { wch: 14 },  // Plat Nomor
    { wch: 14 },  // Lokasi Parkir
    { wch: 22 },  // Nama Pemohon
    { wch: 18 },  // Dept
    { wch: 16 },  // HP
    { wch: 26 },  // Kegiatan
    { wch: 28 },  // Tujuan
    { wch: 12 },  // Urgensi
    { wch: 14 },  // Tgl Mulai
    { wch: 12 },  // Jam Berangkat
    { wch: 14 },  // Tgl Selesai
    { wch: 12 },  // Jam Kembali
    { wch: 22 },  // Driver
    { wch: 16 },  // HP Driver
    { wch: 22 },  // Disetujui Oleh
    { wch: 12 },  // KM Awal
    { wch: 12 },  // KM Akhir
    { wch: 18 },  // Jarak Tempuh
    { wch: 30 },  // Kondisi Kembali
    { wch: 18 },  // Status
    { wch: 30 }   // Catatan
  ];

  worksheetSummary['!cols'] = [
    { wch: 45 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheetData, 'Data Penggunaan Kendaraan');
  XLSX.utils.book_append_sheet(workbook, worksheetSummary, 'Ringkasan Statistik');

  const fileName = `Laporan_Kendaraan_Operasional_SBN_VCI_${getLocalDateISO()}.xlsx`;
  exportWorkbookToExcel(workbook, fileName);
};

