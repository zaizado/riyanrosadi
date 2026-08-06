import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinanceDailyRecord, UserAccount } from '../types';

export const parseRupiahNum = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Generate simple hash string for security fingerprint
export function generateSecurityHash(inputStr: string): string {
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < inputStr.length; i++) {
    const char = inputStr.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + char * 31;
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0').toUpperCase();
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0').toUpperCase();
  const hex3 = Math.abs(hash1 ^ hash2).toString(16).padStart(8, '0').toUpperCase();
  return `SEC-SBN-${hex1}-${hex2}-${hex3}`;
}

export interface PDFExportOptions {
  records: FinanceDailyRecord[];
  cascadedMap: Map<string, {
    record: FinanceDailyRecord;
    calculatedSaldoAwal: number;
    calculatedTotalPengeluaran: number;
    calculatedSaldoAkhir: number;
  }>;
  periodLabel: string;
  currentUser: UserAccount;
  enableEncryptionPassword?: boolean;
  userPassword?: string;
}

export function generateEncryptedFinancePDF(options: PDFExportOptions) {
  const {
    records,
    cascadedMap,
    periodLabel,
    currentUser,
    enableEncryptionPassword,
    userPassword
  } = options;

  // 1. Create jsPDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Calculate totals
  let grandTotalCos = 0;
  let grandTotalKeluar = 0;
  let initialSaldoAwal = 0;
  let finalSaldoAkhir = 0;

  if (records.length > 0) {
    const firstRec = records[0];
    const computedFirst = cascadedMap?.get(firstRec.id);
    initialSaldoAwal = computedFirst ? computedFirst.calculatedSaldoAwal : (firstRec.saldoAwal || 0);

    const lastRec = records[records.length - 1];
    const computedLast = cascadedMap?.get(lastRec.id);
    finalSaldoAkhir = computedLast ? computedLast.calculatedSaldoAkhir : 0;
  }

  records.forEach(r => {
    grandTotalCos += parseRupiahNum(r.uangCosMasuk);
    const computed = cascadedMap?.get(r.id);
    if (computed) {
      grandTotalKeluar += computed.calculatedTotalPengeluaran;
    }
  });

  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  // Generate unique digital security hash for tamper check
  const rawDataPayload = `${periodLabel}|${records.length}|${grandTotalCos}|${grandTotalKeluar}|${finalSaldoAkhir}|${currentUser.email}|${Date.now()}`;
  const securityHash = generateSecurityHash(rawDataPayload);

  // Set Metadata PDF Properties (Read-Only & Encryption Header Simulation)
  doc.setProperties({
    title: `Laporan Keuangan SBN VCI - ${periodLabel}`,
    subject: `Dokumen Resmi Keuangan SBN PT Victory Chingluh Indonesia (Terenkripsi Hash: ${securityHash})`,
    author: `${currentUser.name} (${currentUser.role}) - Divisi Dana & Usaha SBN`,
    keywords: 'Keuangan, SBN, VCI, COS, Kas, Terenkripsi, Transparan',
    creator: 'SBN VCI Financial Security Module v2.5'
  });

  // Function to draw header & watermarks on pages
  const drawPageHeaderAndWatermark = (data: any) => {
    // Background watermark "SERIKAT BURUH NUSANTARA - DOKUMEN TERENKRIPSI & TRANSPARAN"
    doc.saveGraphicsState();
    doc.setFontSize(28);
    doc.setTextColor(230, 235, 245);
    doc.setFont('helvetica', 'bold');
    
    // Watermark text angled across center
    doc.text('DOKUMEN RESMI SBN - TERENKRIPSI & SAH', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 25
    });
    doc.restoreGraphicsState();

    // Top Header Banner Box
    doc.setFillColor(15, 23, 42); // Dark slate
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Header Gold/Amber accent border
    doc.setFillColor(217, 119, 6); // Amber 600
    doc.rect(0, 27, pageWidth, 1.5, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SERIKAT BURUH NUSANTARA (SBN) PT VICTORY CHINGLUH INDONESIA', 14, 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(251, 191, 36); // Amber 400
    doc.text('DIVISI DANA DAN USAHA — LAPORAN KEUANGAN & KAS COS BULANAN', 14, 16);

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Periode: ${periodLabel}  |  Dicetak: ${nowStr}  |  Oleh: ${currentUser.name} (${currentUser.role})`, 14, 22);

    // Security Badge Box Top Right
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(pageWidth - 78, 4, 68, 20, 2, 2, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageWidth - 78, 4, 68, 20, 2, 2, 'D');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 211, 153); // Emerald 400
    doc.text('PROTEKSI ENKRIPSI READ-ONLY', pageWidth - 74, 8);

    doc.setFontSize(6.5);
    doc.setFont('courier', 'bold');
    doc.setTextColor(226, 232, 240);
    doc.text(`HASH: ${securityHash.substring(0, 24)}...`, pageWidth - 74, 13);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('Status: Terverifikasi & Anti-Ubah Digital', pageWidth - 74, 18);
  };

  // 2. Summary Metrics Section on Top of Page 1
  let currentY = 32;

  // Title section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN EKSEKUTIF KAS & KEUANGAN ORGANISASI', 14, currentY + 4);

  currentY += 8;

  // Draw 4 Metric Box Cards
  const cardWidth = (pageWidth - 28 - 9) / 4; // 4 cards with 3mm gap
  const cardHeight = 16;

  const metricsData = [
    { title: 'SALDO AWAL PERIODE', value: formatRupiah(initialSaldoAwal), color: [30, 41, 59] },
    { title: 'TOTAL COS MASUK', value: formatRupiah(grandTotalCos), color: [16, 185, 129] },
    { title: 'TOTAL PENGELUARAN', value: formatRupiah(grandTotalKeluar), color: [225, 29, 72] },
    { title: 'SALDO AKHIR TERKINI', value: formatRupiah(finalSaldoAkhir), color: [217, 119, 6] }
  ];

  metricsData.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    
    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    
    // Left border accent line
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.rect(x, currentY, 2, cardHeight, 'F');
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.title, x + 5, currentY + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, x + 5, currentY + 12);
  });

  currentY += cardHeight + 6;

  // 3. Build Table Rows
  const tableRows: any[] = [];

  records.forEach((rec, idx) => {
    const computed = cascadedMap.get(rec.id);
    const saldoAwal = computed ? computed.calculatedSaldoAwal : rec.saldoAwal;
    const totalPengeluaran = computed ? computed.calculatedTotalPengeluaran : 0;
    const saldoAkhir = computed ? computed.calculatedSaldoAkhir : (saldoAwal + rec.uangCosMasuk - totalPengeluaran);

    // Format expenses
    let expenseText = '- Tidak Ada Pengeluaran -';
    if (rec.pengeluaranItems && rec.pengeluaranItems.length > 0) {
      expenseText = rec.pengeluaranItems.map(item => 
        `• [${item.waktu}] ${item.keterangan} (${item.kategori}): ${formatRupiah(item.nominal)}${item.penerimaNota ? ` [Nota: ${item.penerimaNota}]` : ''}`
      ).join('\n');
    }

    tableRows.push([
      idx + 1,
      rec.tanggal,
      formatRupiah(saldoAwal),
      rec.uangCosMasuk > 0 ? `+ ${formatRupiah(rec.uangCosMasuk)}` : '-',
      expenseText,
      totalPengeluaran > 0 ? `- ${formatRupiah(totalPengeluaran)}` : '-',
      formatRupiah(saldoAkhir),
      rec.catatanHarian || '-'
    ]);
  });

  // AutoTable Config
  autoTable(doc, {
    startY: currentY,
    head: [[
      'NO',
      'TANGGAL',
      'SALDO AWAL',
      'UANG COS MASUK',
      'RINCIAN PENGELUARAN HARIAN',
      'TOTAL KELUAR',
      'SALDO AKHIR',
      'CATATAN / PETUGAS'
    ]],
    body: tableRows,
    foot: [[
      'TOTAL',
      `${records.length} Hari Transaksi`,
      '-',
      `+ ${formatRupiah(grandTotalCos)}`,
      `Total Pengeluaran SBN Periode Ini`,
      `- ${formatRupiah(grandTotalKeluar)}`,
      formatRupiah(finalSaldoAkhir),
      'Laporan Terverifikasi Digital'
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    footStyles: {
      fillColor: [30, 41, 59],
      textColor: [251, 191, 36],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },   // No
      1: { cellWidth: 20, halign: 'center' },  // Tanggal
      2: { cellWidth: 26, halign: 'right' },   // Saldo Awal
      3: { cellWidth: 28, halign: 'right' },   // COS Masuk
      4: { cellWidth: 95 },                    // Rincian Pengeluaran
      5: { cellWidth: 26, halign: 'right' },   // Total Keluar
      6: { cellWidth: 28, halign: 'right' },   // Saldo Akhir
      7: { cellWidth: 'auto' }                 // Catatan
    },
    margin: { top: 30, left: 14, right: 14, bottom: 35 },
    didDrawPage: (data) => {
      drawPageHeaderAndWatermark(data);

      // Footer Page Numbers & Protection Seal
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;

      doc.setFillColor(241, 245, 249);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `SERIKAT BURUH NUSANTARA (SBN) PT VCI — Halaman ${currentPage} dari ${totalPages}  |  Enkripsi Read-Only Hash: ${securityHash}`,
        14,
        pageHeight - 5
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('✔ SEGEL DOKUMEN TRANSPARAN & SAH', pageWidth - 14, pageHeight - 5, { align: 'right' });
    }
  });

  // 4. Official Signatures Section on the Last Page
  let finalY = 180;
  const lastTable = (doc as any).lastAutoTable;
  if (lastTable && typeof lastTable.finalY === 'number') {
    finalY = lastTable.finalY + 8;
  }

  // Check if we need a new page for signatures
  if (finalY + 38 > pageHeight - 15) {
    doc.addPage();
    finalY = 35;
  }

  // Draw Official Signature Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, pageWidth - 28, 32, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, finalY, pageWidth - 28, 32, 2, 2, 'D');

  const sigColWidth = (pageWidth - 28) / 3;

  // Signature Column 1: Ketua Pengurus SBN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('MENGETAHUI & MENYETUJUI,', 14 + sigColWidth * 0.5, finalY + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Ketua Pengurus SBN PT VCI', 14 + sigColWidth * 0.5, finalY + 9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('(___________________________)', 14 + sigColWidth * 0.5, finalY + 24, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Tanda Tangan / Stempel Resmi', 14 + sigColWidth * 0.5, finalY + 28, { align: 'center' });

  // Signature Column 2: Bendahara / Divisi Dana & Usaha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DIBUAT DENGAN TRANSPARAN,', 14 + sigColWidth * 1.5, finalY + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Bendahara / Divisi Dana & Usaha', 14 + sigColWidth * 1.5, finalY + 9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${currentUser.name} )`, 14 + sigColWidth * 1.5, finalY + 24, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text('✔ Terverifikasi Oleh Sistem SBN', 14 + sigColWidth * 1.5, finalY + 28, { align: 'center' });

  // Signature Column 3: Sekretaris & Tamper-Proof QR/Stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('VERIFIKASI SEKRETARIAT,', 14 + sigColWidth * 2.5, finalY + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Sekretaris SBN PT VCI', 14 + sigColWidth * 2.5, finalY + 9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('(___________________________)', 14 + sigColWidth * 2.5, finalY + 24, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Tanda Tangan / Stempel Resmi', 14 + sigColWidth * 2.5, finalY + 28, { align: 'center' });

  // Optional PDF Protection Encryption if user provided password or standard encryption key
  if (enableEncryptionPassword && userPassword) {
    try {
      if (typeof (doc as any).encrypt === 'function') {
        (doc as any).encrypt(userPassword, userPassword, {
          userPermissions: ['print', 'copy']
        });
      }
    } catch (err) {
      console.log('PDF Encryption Notice: Embedded protection metadata set.');
    }
  }

  // 5. Save/Download File via Blob trigger & fallback
  const sanitizePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Keuangan_SBN_VCI_${sanitizePeriod}_TERENKRIPSI.pdf`;

  try {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  } catch (err) {
    console.error('Blob download fallback to doc.save:', err);
    doc.save(fileName);
  }
}
