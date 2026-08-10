import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrganizationAgenda, NotulensiAgenda } from '../types';
import { downloadBlob } from './exportAndPrintUtils';

export const exportNotulensiPdf = (agenda: OrganizationAgenda, notulensi: NotulensiAgenda) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Organisasi
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SERIKAT BURUH NUSANTARA (SBN KASBI)', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PT VICTORIA CARE INDONESIA TSK', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Gedung Sekretariat PTP SBN KASBI PT VCI - Kawasan Industri Cikupa, Tangerang', pageWidth / 2, 23, { align: 'center' });

  y = 38;

  // Judul Laporan
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RISALAH & NOTULENSI HASIL RAPAT / AGENDA ORGANISASI', pageWidth / 2, y, { align: 'center' });
  
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Judul Agenda: ${agenda.judul}`, 14, y);

  y += 6;

  // Table Metadata Rapat
  const metaData = [
    ['Jenis Agenda', agenda.jenis, 'Status', agenda.status],
    ['Tanggal & Waktu', new Date(agenda.tanggalWaktu).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }), 'Tempat', notulensi.tempat || agenda.lokasi],
    ['Pimpinan Rapat', notulensi.pimpinanRapat || agenda.penanggungJawab || '-', 'Notulis', notulensi.notulis || '-'],
    ['Peserta Rapat', notulensi.pesertaText || agenda.daftarPeserta.join(', ') || '-', 'Waktu Pembuatan', new Date(notulensi.createdAt || notulensi.waktuDibuat || Date.now()).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })]
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: metaData,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32, textColor: [51, 65, 85] },
      1: { cellWidth: 62 },
      2: { fontStyle: 'bold', cellWidth: 28, textColor: [51, 65, 85] },
      3: { cellWidth: 60 }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Pokok Agenda Pembahasan
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. AGENDA / POKOK PEMBAHASAN', 16, y + 5);

  y += 10;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const agendaTopics = notulensi.agendaPembahasan || agenda.deskripsi || 'Tidak ada catatan agenda khusus.';
  const splitTopics = doc.splitTextToSize(agendaTopics, pageWidth - 32);
  doc.text(splitTopics, 16, y);

  y += (splitTopics.length * 4) + 4;

  // Isi Pembahasan Detail
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('2. RINGKASAN & DETAIL PEMBAHASAN', 16, y + 5);

  y += 10;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const discussionText = notulensi.isiPembahasan || notulensi.isiNotulensi || 'Belum ada isi catatan pembahasan.';
  const splitDiscussion = doc.splitTextToSize(discussionText, pageWidth - 32);
  doc.text(splitDiscussion, 16, y);

  y += (splitDiscussion.length * 4) + 6;

  // Check Page break if needed
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // Keputusan Rapat
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('3. KEPUTUSAN / KESEPAKATAN HASIL RAPAT', 16, y + 5);

  y += 10;
  const decisions = notulensi.keputusanRapat && notulensi.keputusanRapat.length > 0 
    ? notulensi.keputusanRapat 
    : (notulensi.poinKeputusan || ['Belum ada keputusan khusus disepakati.']);

  decisions.forEach((dec, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${idx + 1}.`, 16, y);
    doc.setFont('helvetica', 'normal');
    const splitDec = doc.splitTextToSize(dec, pageWidth - 38);
    doc.text(splitDec, 21, y);
    y += (splitDec.length * 4) + 2;
  });

  y += 4;
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // Tabel Tindak Lanjut
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('4. DAFTAR TINDAK LANJUT & RESPONSIBILITY (PIC)', 16, y + 5);

  y += 8;

  if (notulensi.tindakLanjutList && notulensi.tindakLanjutList.length > 0) {
    const tableBody = notulensi.tindakLanjutList.map((item, idx) => [
      (idx + 1).toString(),
      item.task,
      item.pic,
      item.deadline,
      item.status
    ]);

    autoTable(doc, {
      startY: y,
      head: [['No', 'Tugas / Aksi', 'PIC', 'Deadline', 'Status']],
      body: tableBody,
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 40 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text('Tidak ada item tindak lanjut khusus.', 16, y + 2);
    y += 10;
  }

  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // Aspirasi & Catatan Tambahan
  if (notulensi.aspirasiMasukan || notulensi.catatanTambahan) {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('5. ASPIRASI, MASUKAN & CATATAN TAMBAHAN', 16, y + 5);

    y += 10;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const extraText = [notulensi.aspirasiMasukan, notulensi.catatanTambahan].filter(Boolean).join('\n\n');
    const splitExtra = doc.splitTextToSize(extraText, pageWidth - 32);
    doc.text(splitExtra, 16, y);

    y += (splitExtra.length * 4) + 10;
  }

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // Kolom Pengesahan / Tanda Tangan
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tangerang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 60, y);
  
  y += 6;
  doc.text('Pimpinan Rapat,', 25, y);
  doc.text('Notulis Rapat,', pageWidth - 60, y);

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${notulensi.pimpinanRapat || agenda.penanggungJawab || '________________'} )`, 20, y);
  doc.text(`( ${notulensi.notulis || '________________'} )`, pageWidth - 65, y);

  // Save PDF
  const cleanFileName = `Notulensi_${agenda.judul.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(cleanFileName);
};

export const exportNotulensiDocx = (agenda: OrganizationAgenda, notulensi: NotulensiAgenda) => {
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Notulensi - ${agenda.judul}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; margin: 30px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
        .header h2 { margin: 0; color: #0f172a; font-size: 16pt; }
        .header h3 { margin: 5px 0 0 0; color: #475569; font-size: 12pt; }
        .header p { margin: 2px 0 0 0; font-size: 9pt; color: #64748b; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .meta-table td { padding: 6px; border: 1px solid #cbd5e1; font-size: 10pt; }
        .meta-label { font-weight: bold; background-color: #f1f5f9; width: 20%; }
        .section-title { background-color: #0f172a; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 11pt; margin-top: 15px; margin-bottom: 8px; }
        .content-box { border: 1px solid #e2e8f0; padding: 10px; background-color: #f8fafc; margin-bottom: 15px; white-space: pre-wrap; }
        ul, ol { margin-top: 5px; padding-left: 20px; }
        li { margin-bottom: 4px; }
        .tindak-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 15px; }
        .tindak-table th, .tindak-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10pt; text-align: left; }
        .tindak-table th { background-color: #0f172a; color: #ffffff; }
        .signature-table { width: 100%; margin-top: 40px; border: none; }
        .signature-table td { border: none; text-align: center; vertical-align: top; width: 50%; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>SERIKAT BURUH NUSANTARA (SBN KASBI)</h2>
        <h3>PT VICTORIA CARE INDONESIA TSK</h3>
        <p>Gedung Sekretariat PTP SBN KASBI PT VCI - Kawasan Industri Cikupa, Tangerang</p>
      </div>

      <h3 style="text-align: center; text-transform: uppercase;">RISALAH & NOTULENSI HASIL RAPAT</h3>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Judul Agenda</td>
          <td>${agenda.judul}</td>
          <td class="meta-label">Jenis Agenda</td>
          <td>${agenda.jenis}</td>
        </tr>
        <tr>
          <td class="meta-label">Tanggal & Waktu</td>
          <td>${new Date(agenda.tanggalWaktu).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</td>
          <td class="meta-label">Tempat</td>
          <td>${notulensi.tempat || agenda.lokasi}</td>
        </tr>
        <tr>
          <td class="meta-label">Pimpinan Rapat</td>
          <td>${notulensi.pimpinanRapat || agenda.penanggungJawab || '-'}</td>
          <td class="meta-label">Notulis</td>
          <td>${notulensi.notulis || '-'}</td>
        </tr>
        <tr>
          <td class="meta-label">Daftar Peserta</td>
          <td colspan="3">${notulensi.pesertaText || agenda.daftarPeserta.join(', ') || '-'}</td>
        </tr>
      </table>

      <div class="section-title">1. AGENDA / POKOK PEMBAHASAN</div>
      <div class="content-box">${notulensi.agendaPembahasan || agenda.deskripsi || '-'}</div>

      <div class="section-title">2. RINGKASAN & DETAIL PEMBAHASAN</div>
      <div class="content-box">${notulensi.isiPembahasan || notulensi.isiNotulensi || '-'}</div>

      <div class="section-title">3. KEPUTUSAN / KESEPAKATAN HASIL RAPAT</div>
      <div class="content-box">
        <ol>
          ${(notulensi.keputusanRapat && notulensi.keputusanRapat.length > 0 ? notulensi.keputusanRapat : (notulensi.poinKeputusan || ['Belum ada keputusan khusus.'])).map(item => `<li>${item}</li>`).join('')}
        </ol>
      </div>

      <div class="section-title">4. DAFTAR TINDAK LANJUT & RESPONSIBILITY (PIC)</div>
      <table class="tindak-table">
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 45%;">Tugas / Action Item</th>
            <th style="width: 25%;">PIC / Divisi</th>
            <th style="width: 15%;">Deadline</th>
            <th style="width: 10%;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${notulensi.tindakLanjutList && notulensi.tindakLanjutList.length > 0 ? notulensi.tindakLanjutList.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.task}</td>
              <td>${item.pic}</td>
              <td>${item.deadline}</td>
              <td>${item.status}</td>
            </tr>
          `).join('') : '<tr><td colspan="5" style="text-align: center;">Tidak ada tindak lanjut.</td></tr>'}
        </tbody>
      </table>

      ${(notulensi.aspirasiMasukan || notulensi.catatanTambahan) ? `
        <div class="section-title">5. ASPIRASI & CATATAN TAMBAHAN</div>
        <div class="content-box">${[notulensi.aspirasiMasukan, notulensi.catatanTambahan].filter(Boolean).join('\n\n')}</div>
      ` : ''}

      <table class="signature-table">
        <tr>
          <td>
            <p>Pimpinan Rapat,</p>
            <br/><br/><br/>
            <p><strong>( ${notulensi.pimpinanRapat || agenda.penanggungJawab || '________________'} )</strong></p>
          </td>
          <td>
            <p>Tangerang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Notulis Rapat,</p>
            <br/><br/>
            <p><strong>( ${notulensi.notulis || '________________'} )</strong></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });

  const cleanFileName = `Notulensi_${agenda.judul.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
  downloadBlob(blob, cleanFileName);
};
