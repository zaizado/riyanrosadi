import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SeveranceCalculationResult } from '../../types/severance';
import { formatRupiah } from '../../utils/currencyFormatter';
import { downloadBlob } from '../../utils/exportAndPrintUtils';

export function generateSeverancePdf(calc: SeveranceCalculationResult) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Page width & margin
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 18;

  // Header Box / Title
  doc.setFillColor(153, 27, 27); // Dark red
  doc.rect(margin, y, pageWidth - (margin * 2), 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SERIKAT BURUH NUSANTARA (SBN KASBI)', pageWidth / 2, y + 8, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PT VICTORY CHINGLUH INDONESIA - PASAL 77 PKB', pageWidth / 2, y + 14, { align: 'center' });

  y += 28;

  // Document Subtitle
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LEMBAR SIMULASI HAK PESANGON & PHK', pageWidth / 2, y, { align: 'center' });
  
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Dokumen: ${calc.id} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });

  y += 8;

  // Worker Info Table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
      1: { cellWidth: 40 },
      2: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
      3: { cellWidth: 50 }
    },
    head: [['PROFIL PEKERJA', '', 'INFORMASI MASA KERJA & PHK', '']],
    body: [
      ['Nama Lengkap', calc.employeeName, 'Tanggal Masuk Kerja', new Date(calc.hireDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
      ['NIK Karyawan', calc.nik, 'Tanggal Simulasi PHK', new Date(calc.terminationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
      ['Departemen / Bagian', `${calc.department} / ${calc.position}`, 'Masa Kerja Efektif', calc.formattedServicePeriod],
      ['Upah Pokok', formatRupiah(calc.baseSalary), 'Jenis Alasan PHK', calc.terminationType],
      ['Tunjangan Tetap', formatRupiah(calc.fixedAllowance), 'Dasar PKB Digunakan', calc.pkbVersion],
      ['Upah Dasar Perhitungan', formatRupiah(calc.calculationBase), 'Sumber Input Upah', calc.isManualSalaryInput ? 'Input Manual' : 'Database Master']
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Breakdown Table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    head: [['KOMPONEN HAK PHK', 'RUMUS / KETENTUAN PKB', 'FAKTOR', 'TOTAL RUPIAH']],
    body: [
      [
        'Uang Pesangon (UP)',
        `${calc.severanceMonths} Bulan Upah x ${formatRupiah(calc.calculationBase)}`,
        `${calc.severanceMultiplier}x`,
        formatRupiah(calc.severanceAmount)
      ],
      [
        'Uang Penghargaan Masa Kerja (UPMK)',
        `${calc.upmkMonths} Bulan Upah x ${formatRupiah(calc.calculationBase)}`,
        `${calc.upmkMultiplier}x`,
        formatRupiah(calc.upmkAmount)
      ],
      [
        'UPH - Penggantian Perumahan & Obat (15%)',
        calc.uphEligible15 ? `15% x (${formatRupiah(calc.severanceAmount)} + ${formatRupiah(calc.upmkAmount)})` : 'Tidak Memenuhi Syarat',
        calc.uphEligible15 ? '15%' : '0%',
        formatRupiah(calc.uph15Amount)
      ],
      [
        'UPH - Sisa Cuti Tahunan',
        calc.unusedLeaveDays > 0 ? `${calc.unusedLeaveDays} Hari / 21 Hari x ${formatRupiah(calc.calculationBase)}` : 'Tidak Ada Sisa Cuti',
        '-',
        formatRupiah(calc.unusedLeaveAmount)
      ],
      [
        'UPH - Ongkos Pulang & Komponen Lain',
        'Biaya Transportasi Pulang / Komponen Khusus',
        '-',
        formatRupiah(calc.returnTravelAmount + calc.otherCompensation)
      ]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Grand Total Box
  doc.setFillColor(241, 245, 249); // light slate
  doc.rect(margin, y, pageWidth - (margin * 2), 16, 'F');
  doc.setDrawColor(153, 27, 27);
  doc.setLineWidth(0.8);
  doc.rect(margin, y, pageWidth - (margin * 2), 16, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL ESTIMASI HAK PHK DITERIMA:', margin + 4, y + 10);

  doc.setFontSize(13);
  doc.setTextColor(153, 27, 27);
  doc.text(formatRupiah(calc.totalAmount), pageWidth - margin - 4, y + 10, { align: 'right' });

  y += 24;

  // Notes & Disclaimer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CATATAN & CATATAN ADVOKASI ORGANISASI:', margin, y);
  
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const noteLines = doc.splitTextToSize(
    `1. Perhitungan berdasarkan acuan Perjanjian Kerja Bersama (PKB) PT Victory Chingluh Indonesia dan UU Ketenagakerjaan yang berlaku.\n` +
    `2. Dokumen ini diterbitkan oleh Pengurus SBN KASBI PT VCI (${calc.calculatedBy}) sebagai alat bantu advokasi dan pendampingan anggota.\n` +
    `3. Nilai final tetap memperhatikan keputusan Bipartit / Kesepakatan Bersama yang disetujui kedua belah pihak.`,
    pageWidth - (margin * 2)
  );
  doc.text(noteLines, margin, y);

  y += 22;

  // Signatures
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  const colWidth = (pageWidth - (margin * 2)) / 2;

  doc.text('Pengurus Advokasi SBN KASBI,', margin + (colWidth / 2), y, { align: 'center' });
  doc.text('Pekerja / Anggota,', margin + colWidth + (colWidth / 2), y, { align: 'center' });

  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.text(`( ${calc.calculatedBy} )`, margin + (colWidth / 2), y, { align: 'center' });
  doc.text(`( ${calc.employeeName} )`, margin + colWidth + (colWidth / 2), y, { align: 'center' });

  // Save PDF
  const filename = `Simulasi_Pesangon_${calc.nik}_${calc.employeeName.replace(/\s+/g, '_')}.pdf`;
  try {
    const blob = doc.output('blob');
    downloadBlob(blob, filename);
  } catch (err) {
    doc.save(filename);
  }
}
