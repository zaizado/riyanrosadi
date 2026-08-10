import * as XLSX from 'xlsx';

/**
 * Universal Blob downloader compatible with Web browsers, Android WebViews, and APKs.
 */
export const downloadBlob = (blob: Blob, fileName: string) => {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.setAttribute('target', '_blank');
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // Trigger download click
    a.click();

    // Cleanup link and object URL
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (err) {
    console.error('downloadBlob error:', err);
    alert('Gagal mengunduh file. Pastikan perizinan download diizinkan pada perangkat.');
  }
};

/**
 * Download file from base64 or Data URL
 */
export const downloadDataUrl = (dataUrl: string, fileName: string) => {
  try {
    // If it's a data url, convert to blob for reliable mobile/APK download
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      downloadBlob(blob, fileName);
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      a.setAttribute('target', '_blank');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 2000);
    }
  } catch (err) {
    console.error('downloadDataUrl error:', err);
  }
};

/**
 * Export XLSX Workbook to Excel file (.xlsx) safely on Web and Mobile APKs
 */
export const exportWorkbookToExcel = (workbook: XLSX.WorkBook, fileName: string) => {
  try {
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    downloadBlob(blob, fileName);
  } catch (err) {
    console.warn('Workbook blob export failed, falling back to XLSX.writeFile:', err);
    XLSX.writeFile(workbook, fileName);
  }
};

/**
 * Universal Print Trigger for A4 Default Paper Format
 */
export const triggerPrint = () => {
  try {
    if (typeof window !== 'undefined' && window.print) {
      // Force repaint before printing
      window.focus();
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      alert('Fitur cetak tidak didukung di peramban/perangkat ini.');
    }
  } catch (err) {
    console.error('Print trigger error:', err);
    alert('Gagal menjalankan perintah cetak.');
  }
};
