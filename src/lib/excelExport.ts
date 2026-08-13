import * as XLSX from 'xlsx';
import { AdvocacyCase, SickVisit } from '../types';
import { exportWorkbookToExcel } from '../utils/exportAndPrintUtils';
import { getLocalDateISO } from '../utils/dateUtils';

/**
 * Export Sick Visit (Pendampingan Sakit) data to Excel (.xlsx)
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
      ? visit.riwayatKunjungan[visit.riwayatKunjungan.length - 1].catatan
      : '-';

    return {
      'No': index + 1,
      'No. Pendampingan': visit.nomorPendampingan,
      'NIK Anggota': visit.nikAnggota,
      'Nama Anggota': visit.namaAnggota,
      'Departemen': visit.departemen,
      'No. WhatsApp/HP': visit.nomorHp || '-',
      'Lokasi Rawat/Rumah': `${visit.jenisLokasi}: ${visit.lokasi}`,
      'Diagnosa / Awal': visit.diagnosaSingkat || visit.catatanAwal || '-',
      'Tanggal Kunjungan Awal': visit.tanggalKunjunganAwal,
      'Status Pendampingan': visit.status,
      'Pengurus PJ': visit.pengurusPenanggungJawab,
      'Total Visite': visit.riwayatKunjungan?.length || 0,
      'Perkembangan Terbaru': lastLog
    };
  });

  // Add Summary Statistics Sheet
  const totalCases = sickVisits.length;
  const waitingCount = sickVisits.filter(v => v.status === 'Menunggu Kunjungan').length;
  const inProgressCount = sickVisits.filter(v => v.status === 'Sedang Didampingi').length;
  const finishedCount = sickVisits.filter(v => v.status === 'Selesai').length;

  const summaryData = [
    { 'Kategori Statistik': 'Total Pasien Sakit Didampingi', 'Jumlah': totalCases },
    { 'Kategori Statistik': 'Status: Menunggu Kunjungan', 'Jumlah': waitingCount },
    { 'Kategori Statistik': 'Status: Sedang Didampingi', 'Jumlah': inProgressCount },
    { 'Kategori Statistik': 'Status: Selesai / Sembuh', 'Jumlah': finishedCount },
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
    { wch: 24 },  // Nama
    { wch: 18 },  // Dept
    { wch: 16 },  // HP
    { wch: 28 },  // Lokasi
    { wch: 30 },  // Diagnosa
    { wch: 16 },  // Tgl
    { wch: 20 },  // Status
    { wch: 22 },  // PJ
    { wch: 12 },  // Total
    { wch: 35 }   // Perkembangan
  ];

  worksheetSummary['!cols'] = [
    { wch: 40 },
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
