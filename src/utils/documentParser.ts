import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using CDN/unpkg if needed or disable worker for small inline texts
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

export interface ParsedDocumentResult {
  rawText: string;
  extractedTitle?: string;
  extractedLeader?: string;
  extractedNotulis?: string;
  extractedParticipants?: string;
  extractedDiscussion?: string;
  extractedDecisions?: string[];
  extractedFollowUps?: { task: string; pic: string; deadline: string }[];
}

/**
 * Parses any uploaded document (.docx, .doc, .pdf, .txt, .md, .csv, .json, .rtf)
 * and returns clean readable plain text and extracted structure.
 */
export const parseUploadedFile = async (file: File): Promise<ParsedDocumentResult> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  let fullCleanText = '';

  // 1. DOCX / DOC Files
  if (['docx', 'doc'].includes(fileExt) || file.type.includes('word')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      fullCleanText = result.value ? result.value.trim() : '';
    } catch (err) {
      console.warn("Mammoth docx parsing failed, trying text fallback:", err);
    }
  }

  // 2. PDF Files
  if (!fullCleanText && (fileExt === 'pdf' || file.type.includes('pdf'))) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const textChunks: string[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          // @ts-ignore
          .map((item: any) => item.str)
          .join(' ');
        textChunks.push(pageText);
      }
      fullCleanText = textChunks.join('\n\n').trim();
    } catch (err) {
      console.warn("PDF parsing failed, trying fallback text extractor:", err);
    }
  }

  // 3. Plain Text, Markdown, CSV, JSON, Log, RTF or Fallback
  if (!fullCleanText) {
    try {
      const raw = await file.text();
      // Remove unprintable binary control characters (keep newlines and printable text)
      fullCleanText = raw
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } catch (err) {
      console.error("Text reading error:", err);
    }
  }

  // If text is still empty or looks like raw binary ZIP/XML tags (e.g. PK docProps), clean it up
  if (fullCleanText.includes('PK') && fullCleanText.includes('docProps')) {
    fullCleanText = fullCleanText
      .replace(/<[^>]+>/g, ' ') // Strip XML tags
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep ASCII printable
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!fullCleanText) {
    fullCleanText = `[Dokumen ${file.name}] Tidak dapat mengekstrak teks otomatis. Silakan ketik atau tempel catatan secara manual.`;
  }

  // Structure extraction
  return processTextToStructure(fullCleanText);
};

const processTextToStructure = (text: string): ParsedDocumentResult => {
  const result: ParsedDocumentResult = {
    rawText: text
  };

  const lines = text.split(/\r?\n/);
  const decisions: string[] = [];

  let isReadingDecisions = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();

    // Header Metadata Extraction
    if ((lower.startsWith('judul') || lower.startsWith('topik')) && lower.includes(':')) {
      result.extractedTitle = trimmed.split(':').slice(1).join(':').trim();
    } else if ((lower.startsWith('pimpinan') || lower.startsWith('ketua')) && lower.includes(':')) {
      result.extractedLeader = trimmed.split(':').slice(1).join(':').trim();
    } else if ((lower.startsWith('notulis') || lower.startsWith('pencatat')) && lower.includes(':')) {
      result.extractedNotulis = trimmed.split(':').slice(1).join(':').trim();
    } else if ((lower.startsWith('peserta') || lower.startsWith('hadir')) && lower.includes(':')) {
      result.extractedParticipants = trimmed.split(':').slice(1).join(':').trim();
    } else if (lower.includes('keputusan') || lower.includes('kesepakatan')) {
      isReadingDecisions = true;
    } else if (isReadingDecisions && (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+[\.\)]/.test(trimmed))) {
      decisions.push(trimmed.replace(/^[-*\d\.\)]+/, '').trim());
    }
  });

  if (decisions.length > 0) {
    result.extractedDecisions = decisions;
  }

  return result;
};
