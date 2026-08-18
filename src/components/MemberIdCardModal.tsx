import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Edit2, 
  Sparkles, 
  Maximize2,
  Eye,
  Check,
  UserSearch
} from 'lucide-react';
import { Member } from '../types';
import { FsbnLogo } from './FsbnLogo';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import fsbnLogo from '../assets/images/fsbn_official_logo_1786608810054.jpg';
import { compressImage } from '../lib/imageUtils';
import { ModalPortal } from './ModalPortal';
import { MemberSearchSelect } from './MemberSearchSelect';

interface MemberIdCardModalProps {
  member: Member;
  allMembers?: Member[];
  onClose: () => void;
  onUpdateMember?: (updatedMember: Member) => void;
}

// Convert month index (0-11) to Roman numerals (I - XII)
const getRomanMonth = (monthIndex: number): string => {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanMonths[monthIndex] || 'VII';
};

export const MemberIdCardModal: React.FC<MemberIdCardModalProps> = ({
  member: initialMember,
  onClose,
  onUpdateMember
}) => {
  const [selectedMember, setSelectedMember] = useState<Member>(initialMember);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputFsbnRef = useRef<HTMLInputElement>(null);
  const fileInputKasbiRef = useRef<HTMLInputElement>(null);

  // View state: 'front' | 'back'
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  // Scale state: 'realistic' (1:1 scale = 5.4cm x 8.56cm) or 'zoom' (1.5x zoom)
  const [scaleMode, setScaleMode] = useState<'realistic' | 'zoom'>('realistic');

  // Derive Roman month and year
  const currentMonthRoman = getRomanMonth(new Date().getMonth());
  const currentYear = new Date().getFullYear();

  // Calculate sequence number (e.g. 0001, 0002) directly from member data
  const getSequenceNumber = (m: Member) => {
    const digits = m.nomorAnggota?.match(/\d+/g);
    if (digits && digits.length > 0) {
      const lastDigits = digits[digits.length - 1];
      return lastDigits.slice(-4).padStart(4, '0');
    }
    return '0001';
  };

  // Editable fields state
  const [customSequence, setCustomSequence] = useState<string>(getSequenceNumber(initialMember));
  const [jabatan, setJabatan] = useState<string>(initialMember.jabatan || 'ANGGOTA');
  const [fotoUrl, setFotoUrl] = useState<string>(
    initialMember.fotoUrl || cheAvatar
  );
  const [logoFsbnUrl, setLogoFsbnUrl] = useState<string | null>(fsbnLogo);
  const [logoKasbiUrl, setLogoKasbiUrl] = useState<string | null>('/kasbi_logo.svg');

  // Edit toggles
  const [isEditingKta, setIsEditingKta] = useState(false);
  const [isEditingJabatan, setIsEditingJabatan] = useState(false);
  const [isChangingMember, setIsChangingMember] = useState(false);

  // Sync state when member prop changes
  useEffect(() => {
    setSelectedMember(initialMember);
    setCustomSequence(getSequenceNumber(initialMember));
    setJabatan(initialMember.jabatan || 'ANGGOTA');
    setFotoUrl(
      initialMember.fotoUrl || cheAvatar
    );
  }, [initialMember]);

  const handleSelectMember = (newM: Member | null) => {
    if (newM) {
      setSelectedMember(newM);
      setCustomSequence(getSequenceNumber(newM));
      setJabatan(newM.jabatanKerja || 'ANGGOTA');
      setFotoUrl(newM.fotoUrl || cheAvatar);
      setIsChangingMember(false);
    }
  };

  // Photo Upload Handler with compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 350, 350, 0.75);
      setFotoUrl(compressed);
      if (onUpdateMember && selectedMember) {
        onUpdateMember({
          ...selectedMember,
          fotoUrl: compressed
        });
      }
      e.target.value = '';
    }
  };

  const handleLogoFsbnUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 200, 200, 0.75);
      setLogoFsbnUrl(compressed);
      e.target.value = '';
    }
  };

  const handleLogoKasbiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 200, 200, 0.75);
      setLogoKasbiUrl(compressed);
      e.target.value = '';
    }
  };

  // Full KTA string: e.g. "0001 / PP-FSBN / VII / 2026"
  const ktaNumberFormatted = `${customSequence} / PP-FSBN / ${currentMonthRoman} / ${currentYear}`;

  // =========================================================================
  // PRINT FUNCTIONALITY - RELIABLE DIRECT WINDOW PRINT (CR80 & A4 PORTRAIT)
  // =========================================================================
  const handlePrintCard = () => {
    // Direct window print works natively in all browsers
    window.print();
  };

  // =========================================================================
  // HIGH-DEF PORTRAIT PNG DOWNLOAD CANVAS GENERATOR (300 DPI 638x1011)
  // =========================================================================
  const handleDownloadPNG = () => {
    const canvas = document.createElement('canvas');
    // 300 DPI dimensions for Portrait 5.4cm x 8.56cm = 638 x 1011 px
    canvas.width = 638;
    canvas.height = 1011;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Outer Orange Border & Background
    ctx.fillStyle = '#e84e1b';
    ctx.fillRect(0, 0, 638, 1011);

    ctx.lineWidth = 12;
    ctx.strokeStyle = '#c03808';
    ctx.strokeRect(6, 6, 626, 999);

    // Inner White Canvas Box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 20, 598, 971);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(20, 20, 598, 971);

    if (activeSide === 'front') {
      // FRONT PORTRAIT
      // Top Header Box FSBN (Left)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(30, 30, 95, 95);
      ctx.strokeRect(30, 30, 95, 95);
      const fsbnImg = new Image();
      fsbnImg.src = logoFsbnUrl || fsbnLogo;
      try {
        ctx.drawImage(fsbnImg, 32, 32, 91, 91);
      } catch (e) {}

      // Top Header Box KASBI (Right)
      ctx.fillStyle = '#000000';
      ctx.fillRect(513, 30, 95, 95);
      ctx.strokeRect(513, 30, 95, 95);
      const kasbiImg = new Image();
      kasbiImg.src = logoKasbiUrl || '/kasbi_logo.svg';
      try {
        ctx.drawImage(kasbiImg, 515, 32, 91, 91);
      } catch (e) {}

      // Center Header Titles
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      ctx.font = 'bold 18px Arial';
      ctx.fillText('PENGURUS PUSAT', 319, 52);

      ctx.font = '900 19px Arial';
      ctx.fillText('FEDERASI SERIKAT BURUH NUSANTARA', 319, 76);

      ctx.font = 'bold 14px Arial';
      ctx.fillText('Serikat Buruh Anggota - Konfederasi KASBI', 319, 96);

      ctx.font = 'bold 11px Arial';
      ctx.fillText('SK. DISNAKER TANGERANG : 568.4/3283/-DISNAKER/2010', 319, 114);

      // Yellow Address Banner
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(28, 133, 582, 36);
      ctx.strokeRect(28, 133, 582, 36);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 13px Arial';
      ctx.fillText('Jl. Supriadi RT 06 RW 03 Tanah Tinggi, Tangerang', 319, 150);
      ctx.fillText('Email: sbnpoesat@yahoo.com', 319, 163);

      // Orange Title Banner
      ctx.fillStyle = '#e84e1b';
      ctx.fillRect(20, 178, 598, 50);
      ctx.strokeRect(20, 178, 598, 50);

      ctx.fillStyle = '#000000';
      ctx.font = '900 32px Arial';
      ctx.fillText('KARTU ANGGOTA', 319, 215);

      // KTA Number
      ctx.font = 'bold 22px Arial';
      ctx.fillText(`No. KTA : ${ktaNumberFormatted}`, 319, 260);

      // Draw Photo Placeholder Box (Centered in Portrait)
      const photoX = 214;
      const photoY = 280;
      const photoW = 210;
      const photoH = 260;

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(photoX, photoY, photoW, photoH);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(photoX + 2, photoY + 2, photoW - 4, photoH - 4);

      // Load and draw photo
      const img = new Image();
      const photoSrc = fotoUrl || cheAvatar;
      if (photoSrc.startsWith('http://') || photoSrc.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }

      const drawFallbackAndFinish = () => {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          try {
            ctx!.drawImage(fallbackImg, photoX + 2, photoY + 2, photoW - 4, photoH - 4);
          } catch (e) {}
          drawDetailsAndDownload();
        };
        fallbackImg.onerror = () => {
          drawDetailsAndDownload();
        };
        fallbackImg.src = cheAvatar;
      };

      img.onload = () => {
        try {
          ctx!.drawImage(img, photoX + 2, photoY + 2, photoW - 4, photoH - 4);
          drawDetailsAndDownload();
        } catch (e) {
          drawFallbackAndFinish();
        }
      };
      img.onerror = () => {
        drawFallbackAndFinish();
      };
      img.src = photoSrc;

      function drawDetailsAndDownload() {
        ctx!.textAlign = 'left';
        ctx!.fillStyle = '#000000';
        ctx!.font = 'bold 22px Arial';

        let startY = 560;
        const lineGap = 42;

        // Details List
        ctx!.fillText('N a m a', 50, startY);
        ctx!.fillText(':', 210, startY);
        ctx!.fillText(selectedMember.namaLengkap.toUpperCase(), 235, startY);

        startY += lineGap;
        ctx!.fillText('N I K', 50, startY);
        ctx!.fillText(':', 210, startY);
        ctx!.fillText((selectedMember.nik || '-').toUpperCase(), 235, startY);

        startY += lineGap;
        ctx!.fillText('Anggota SBN', 50, startY);
        ctx!.fillText(':', 210, startY);
        ctx!.fillText('PT VICTORY CHINGLUH INDONESIA', 235, startY);

        startY += lineGap;
        ctx!.fillText('Departemen', 50, startY);
        ctx!.fillText(':', 210, startY);
        ctx!.fillText((selectedMember.departemen || '-').toUpperCase(), 235, startY);

        startY += lineGap;
        ctx!.fillText('Jabatan', 50, startY);
        ctx!.fillText(':', 210, startY);
        ctx!.fillText(jabatan.toUpperCase(), 235, startY);

        // Bottom Line & Status
        ctx!.lineWidth = 2;
        ctx!.strokeStyle = '#000000';
        ctx!.beginPath();
        ctx!.moveTo(30, 890);
        ctx!.lineTo(608, 890);
        ctx!.stroke();

        ctx!.textAlign = 'center';
        ctx!.font = 'bold 16px Arial';
        ctx!.fillText('KTA Resmi Pengurus Pusat SBN KASBI', 319, 930);
        ctx!.font = 'bold 14px Arial';
        ctx!.fillText('Masa Berlaku: Aktif Berkelanjutan', 319, 955);

        triggerDownload();
      }
    } else {
      // BACK PORTRAIT
      ctx.fillStyle = '#e84e1b';
      ctx.fillRect(20, 20, 598, 65);
      ctx.strokeRect(20, 20, 598, 65);

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = '900 24px Arial';
      ctx.fillText('KETENTUAN & HAK ANGGOTA SBN', 319, 62);

      ctx.textAlign = 'left';
      ctx.font = 'bold 18px Arial';
      let startY = 130;
      const stepY = 85;

      const rules = [
        '1. KTA ini adalah bukti keanggotaan resmi SBN PT Victory Chingluh Indonesia.',
        '2. Anggota berhak mendapat pendampingan & advokasi perselisihan hubungan industrial.',
        '3. Anggota wajib membayar COS bulanan & mematuhi AD/ART SBN KASBI.',
        '4. KTA wajib dibawa saat menghadiri rapat, konsolidasi, atau aksi organisasi.',
        '5. Apabila kartu ini ditemukan, mohon dikembalikan ke sekretariat SBN Tangerang.'
      ];

      rules.forEach(rule => {
        // Wrap rule text to fit 550px width
        const words = rule.split(' ');
        let line = '';
        let currentY = startY;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 540 && n > 0) {
            ctx.fillText(line, 45, currentY);
            line = '   ' + words[n] + ' ';
            currentY += 28;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 45, currentY);
        startY += stepY;
      });

      // Signature Block
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`Tangerang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 319, 780);
      ctx.fillText('Pengurus Pusat SBN PT Victory Chingluh Indonesia', 319, 810);

      ctx.font = '900 22px Arial';
      ctx.fillText('PENGURUS HARIAN SBN', 319, 930);

      triggerDownload();
    }

    function triggerDownload() {
      const link = document.createElement('a');
      link.download = `KTA_SBN_PORTRAIT_${selectedMember.namaLengkap.replace(/\s+/g, '_')}_${activeSide}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <ModalPortal>
      <div className="mobile-modal-backdrop">
      
      {/* CSS Styles for Realistic Portrait 5.4cm x 8.56cm (54mm x 85.6mm) & Native Window Print */}
      <style>{`
        /* REALISTIC PORTRAIT CR80 PHYSICAL DIMENSIONS: 5.4cm WIDE x 8.56cm HIGH */
        .kta-portrait-card {
          width: 5.4cm;
          height: 8.56cm;
          min-width: 5.4cm;
          min-height: 8.56cm;
          max-width: 5.4cm;
          max-height: 8.56cm;
          box-sizing: border-box;
        }

        .kta-portrait-zoom {
          width: 8.1cm;
          height: 12.84cm;
          min-width: 8.1cm;
          min-height: 12.84cm;
          box-sizing: border-box;
        }

        /* NATIVE PRINT SYSTEM STYLING OVERRIDES */
        @media print {
          /* Hide all App UI during printing */
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }

          /* Force printable card to display cleanly in print mode */
          #print-kta-portal, #print-kta-portal * {
            visibility: visible !important;
          }

          #print-kta-portal {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 999999 !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Main UI Modal Box (Hidden during print) */}
      <div className="mobile-modal-card bg-white border border-slate-200 rounded-3xl max-w-2xl text-slate-900 p-5 sm:p-6 shadow-2xl relative space-y-5 no-print">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600 border border-orange-200 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">Kartu Tanda Anggota (KTA) Digital</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Format Portrait: 5.4 × 8.56 cm
                </span>
              </div>
              <p className="text-xs text-slate-500">Pengurus Pusat FSBN KASBI PT Victory Chingluh Indonesia</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Selector & Custom Edit Controls */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            
            {/* Current Member Display & Switcher */}
            <div className="flex-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 shrink-0">Anggota:</span>
                <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  {selectedMember.namaLengkap} ({selectedMember.nomorAnggota || selectedMember.nik})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingMember(!isChangingMember)}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <UserSearch className="w-3.5 h-3.5 text-orange-600" />
                <span>{isChangingMember ? 'Tutup Pencarian' : 'Cari/Ganti Anggota'}</span>
              </button>
            </div>

            {/* View Mode & Toggles */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Front / Back Side Switcher */}
              <div className="flex bg-slate-200 border border-slate-300 rounded-xl p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveSide('front')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeSide === 'front'
                      ? 'bg-orange-600 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sisi Depan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSide('back')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeSide === 'back'
                      ? 'bg-orange-600 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sisi Belakang
                </button>
              </div>

              {/* Realistic / Zoom Scale Toggle */}
              <button
                type="button"
                onClick={() => setScaleMode(p => p === 'realistic' ? 'zoom' : 'realistic')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                title="Beralih antara Skala Realistis (5.4x8.56cm) dan Zoom HD"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{scaleMode === 'realistic' ? 'Skala 1:1' : 'Zoom 1.5x'}</span>
              </button>
            </div>
          </div>

          {/* Member Search Popup when changing member */}
          {isChangingMember && (
            <div className="pt-2 border-t border-slate-200 bg-white p-3 rounded-xl border">
              <MemberSearchSelect
                selectedMemberId={selectedMember.id}
                onSelectMember={handleSelectMember}
                label="Cari Anggota Berdasarkan NIK atau Nama"
                placeholder="Ketik NIK atau Nama anggota untuk cetak KTA..."
              />
            </div>
          )}

          {/* Quick Edit Buttons Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setIsEditingKta(!isEditingKta)}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isEditingKta
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-xs'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingKta ? 'Selesai Edit No KTA' : 'Edit No KTA'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditingJabatan(!isEditingJabatan)}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isEditingJabatan
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-xs'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingJabatan ? 'Selesai Edit Jabatan' : 'Edit Jabatan'}</span>
            </button>
          </div>

          {/* Inline Editors if toggled */}
          {(isEditingKta || isEditingJabatan) && (
            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {isEditingKta && (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nomor Urut KTA (4 Angka):</label>
                  <input
                    type="text"
                    value={customSequence}
                    onChange={(e) => setCustomSequence(e.target.value)}
                    placeholder="0001"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 font-mono font-bold focus:outline-none focus:border-orange-500 shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Format: {ktaNumberFormatted}</p>
                </div>
              )}

              {isEditingJabatan && (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jabatan dalam KTA:</label>
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="ANGGOTA"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-orange-500 shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Tulis manual jabatan jika bukan sekedar Anggota</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Inputs for Image & Logo Uploads */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputFsbnRef}
          onChange={handleLogoFsbnUpload}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputKasbiRef}
          onChange={handleLogoKasbiUpload}
          accept="image/*"
          className="hidden"
        />

        {/* ========================================================================= */}
        {/* PORTRAIT PHYSICAL KTA CARD CANVAS DISPLAY (5.4 CM WIDE X 8.56 CM HIGH) */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center justify-center py-3 bg-slate-100 rounded-2xl border border-slate-200 p-4 min-h-[380px] overflow-x-auto">
          
          <p className="text-[11px] font-bold text-slate-600 mb-3 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tampilan KTA Portrait ({scaleMode === 'realistic' ? 'Skala Realistis 5.4 × 8.56 cm' : 'Tampilan Zoom 1.5x'})</span>
          </p>

          <div className="flex items-center justify-center">
            {activeSide === 'front' ? (
              /* FRONT SIDE PORTRAIT NODE */
              <div
                className={`bg-[#e84e1b] p-[2.5px] rounded-[10px] border-[2px] border-[#c03808] shadow-2xl text-black select-none relative transition-all ${
                  scaleMode === 'realistic' ? 'kta-portrait-card' : 'kta-portrait-zoom'
                }`}
                style={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}
              >
                {/* White Card Canvas */}
                <div className="bg-white rounded-[7px] border border-black overflow-hidden relative shadow-inner w-full h-full p-[3px] flex flex-col justify-between">
                  
                  {/* Background Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                    <FsbnLogo className="w-48 h-48 text-black" showText={false} />
                  </div>

                  {/* Top Header Section */}
                  <div>
                    <div className="grid grid-cols-[30px_1fr_30px] items-center gap-1 pb-[2px]">
                      
                      {/* Left Logo FSBN */}
                      <div
                        onClick={() => fileInputFsbnRef.current?.click()}
                        className="bg-[#dc2626] border border-black rounded-[3px] p-[0.5px] flex items-center justify-center shadow-xs h-[32px] w-[32px] relative group cursor-pointer overflow-hidden shrink-0"
                        title="Klik untuk ganti Logo FSBN"
                      >
                        <img
                          src={logoFsbnUrl || fsbnLogo}
                          alt="Logo FSBN"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Center Header Titles */}
                      <div className="text-center leading-[1.05]">
                        <h1 className="font-bold text-[6px] tracking-wide text-black uppercase leading-tight">
                          PENGURUS PUSAT
                        </h1>
                        <h2 className="font-black text-[6.5px] tracking-tight text-black uppercase leading-tight">
                          FEDERASI SERIKAT BURUH NUSANTARA
                        </h2>
                        <h3 className="font-bold text-[5.5px] text-black leading-tight">
                          SBA Konfederasi KASBI
                        </h3>
                      </div>

                      {/* Right Logo KASBI */}
                      <div
                        onClick={() => fileInputKasbiRef.current?.click()}
                        className="bg-black border border-black rounded-[3px] p-[0.5px] flex items-center justify-center shadow-xs h-[32px] w-[32px] relative group cursor-pointer overflow-hidden shrink-0"
                        title="Klik untuk ganti Logo KASBI"
                      >
                        <img
                          src={logoKasbiUrl || '/kasbi_logo.svg'}
                          alt="Logo KASBI"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Yellow Address Banner */}
                    <div className="bg-[#ffff00] border border-black rounded-[2px] py-[1px] px-[2px] text-center">
                      <p className="font-bold text-[4.5px] text-black leading-tight">
                        Jl. Supriadi RT. 06 RW. 03 Tanah Tinggi, Tangerang | sbnpoesat@yahoo.com
                      </p>
                    </div>

                    {/* Orange KARTU ANGGOTA Banner */}
                    <div className="bg-[#e84e1b] py-[2px] text-center border-y border-black mt-[1px]">
                      <h2 className="font-black text-[9px] text-black tracking-[0.08em] uppercase leading-none">
                        KARTU ANGGOTA
                      </h2>
                    </div>
                  </div>

                  {/* Body Content: No KTA, Photo, Details */}
                  <div className="flex-1 flex flex-col justify-between pt-[2px] pb-[1px]">
                    
                    {/* No. KTA */}
                    <div className="text-center font-extrabold text-[7px] text-black leading-tight">
                      <span>No. KTA : </span>
                      <span className="font-black text-black">{ktaNumberFormatted}</span>
                    </div>

                    {/* Member Photo Frame Centered */}
                    <div className="flex justify-center my-1">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[42px] h-[52px] bg-slate-100 border border-black overflow-hidden shadow-xs relative group cursor-pointer shrink-0"
                        title="Klik untuk ganti foto anggota"
                      >
                        <img
                          src={fotoUrl || cheAvatar}
                          alt={selectedMember.namaLengkap}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = cheAvatar;
                          }}
                        />
                      </div>
                    </div>

                    {/* Details Table Stacked Cleanly */}
                    <div className="font-black text-[6px] text-black space-y-[1px] leading-tight px-1">
                      <div className="grid grid-cols-[45px_5px_1fr] items-center">
                        <span className="tracking-wider">N a m a</span>
                        <span>:</span>
                        <span className="truncate uppercase font-black">{selectedMember.namaLengkap}</span>
                      </div>

                      <div className="grid grid-cols-[45px_5px_1fr] items-center">
                        <span>N I K</span>
                        <span>:</span>
                        <span className="truncate font-mono font-bold">{selectedMember.nik || '-'}</span>
                      </div>

                      <div className="grid grid-cols-[45px_5px_1fr] items-center">
                        <span>Anggota SBN</span>
                        <span>:</span>
                        <span className="uppercase truncate">PT VICTORY CHINGLUH INDONESIA</span>
                      </div>

                      <div className="grid grid-cols-[45px_5px_1fr] items-center">
                        <span>Departemen</span>
                        <span>:</span>
                        <span className="uppercase truncate">{selectedMember.departemen || '-'}</span>
                      </div>

                      <div className="grid grid-cols-[45px_5px_1fr] items-center">
                        <span>Jabatan</span>
                        <span>:</span>
                        <span className="uppercase font-black text-black truncate">{jabatan}</span>
                      </div>
                    </div>

                    {/* Bottom Status Stripe */}
                    <div className="pt-[1.5px] border-t border-black text-center text-[4px] font-bold text-black space-y-[0.5px]">
                      <p>KTA Resmi Pengurus Pusat SBN KASBI</p>
                      <p className="font-black text-emerald-800">Masa Berlaku: Aktif Berkelanjutan</p>
                    </div>

                  </div>

                </div>
              </div>
            ) : (
              /* BACK SIDE PORTRAIT NODE */
              <div
                className={`bg-[#e84e1b] p-[2.5px] rounded-[10px] border-[2px] border-[#c03808] shadow-2xl text-black select-none relative transition-all ${
                  scaleMode === 'realistic' ? 'kta-portrait-card' : 'kta-portrait-zoom'
                }`}
                style={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}
              >
                <div className="bg-white rounded-[7px] border border-black overflow-hidden relative shadow-inner w-full h-full p-[4px] flex flex-col justify-between">
                  
                  {/* Header Back */}
                  <div className="bg-[#e84e1b] py-[2px] text-center border border-black rounded-[3px]">
                    <h2 className="font-black text-[7px] text-black tracking-wide uppercase leading-none">
                      KETENTUAN & HAK ANGGOTA SBN
                    </h2>
                  </div>

                  {/* Rules Content */}
                  <div className="text-[5.5px] font-extrabold text-black space-y-[3px] leading-tight my-auto">
                    <p>1. KTA ini adalah bukti keanggotaan resmi SBN PT Victory Chingluh Indonesia.</p>
                    <p>2. Anggota berhak mendapat pendampingan & advokasi perselisihan hubungan industrial.</p>
                    <p>3. Anggota wajib membayar COS bulanan & mematuhi AD/ART SBN KASBI.</p>
                    <p>4. KTA wajib dibawa saat menghadiri rapat, konsolidasi, atau aksi organisasi.</p>
                    <p>5. Apabila kartu ditemukan, harap dikembalikan ke sekretariat SBN Tangerang.</p>
                  </div>

                  {/* Signature Section */}
                  <div className="pt-[2px] border-t border-black text-center text-[4.5px] font-black text-black space-y-[1px]">
                    <p>Tangerang, {new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</p>
                    <p className="text-[4px] font-bold text-slate-700">Pengurus Pusat SBN PT Victory Chingluh Indonesia</p>
                    <p className="font-black pt-3 uppercase">PENGURUS HARIAN SBN</p>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* ----------------- ACTION BUTTONS ----------------- */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Native Print Button */}
            <button
              type="button"
              onClick={handlePrintCard}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak KTA Portrait (5,4 × 8,56 cm)</span>
            </button>

            {/* PNG Image Download */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PNG HD (300 DPI)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* PRINT-ONLY PORTAL CONTAINER (ACTIVATES AUTOMATICALLY DURING window.print()) */}
      {/* ========================================================================= */}
      <div id="print-kta-portal" className="hidden print:flex">
        <div className="kta-portrait-card bg-[#e84e1b] p-[2.5px] rounded-[10px] border-[2px] border-[#c03808] text-black">
          <div className="bg-white rounded-[7px] border border-black overflow-hidden relative w-full h-full p-[3px] flex flex-col justify-between">
            {/* Header */}
            <div>
              <div className="grid grid-cols-[30px_1fr_30px] items-center gap-1 pb-[2px]">
                <div className="bg-[#ff0000] border border-black rounded-[3px] p-[1px] flex items-center justify-center h-[30px]">
                  {logoFsbnUrl ? (
                    <img src={logoFsbnUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <FsbnLogo className="w-6 h-6 text-white" showText={true} />
                  )}
                </div>
                <div className="text-center leading-[1.05]">
                  <h1 className="font-bold text-[6px] text-black uppercase">PENGURUS PUSAT</h1>
                  <h2 className="font-black text-[6.5px] text-black uppercase">FEDERASI SERIKAT BURUH NUSANTARA</h2>
                  <h3 className="font-bold text-[5.5px] text-black">SBA Konfederasi KASBI</h3>
                </div>
                <div className="bg-black border border-black rounded-[3px] p-[0.5px] flex items-center justify-center h-[30px] overflow-hidden">
                  <img src={logoKasbiUrl || '/kasbi_logo.svg'} alt="Logo KASBI" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="bg-[#ffff00] border border-black rounded-[2px] py-[1px] text-center">
                <p className="font-bold text-[4.5px] text-black">Jl. Supriadi RT.06 RW.03 Tanah Tinggi, Tangerang | sbnpoesat@yahoo.com</p>
              </div>
              <div className="bg-[#e84e1b] py-[2px] text-center border-y border-black mt-[1px]">
                <h2 className="font-black text-[9px] text-black tracking-[0.08em] uppercase">KARTU ANGGOTA</h2>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col justify-between pt-[2px] pb-[1px]">
              <div className="text-center font-extrabold text-[7px] text-black">
                <span>No. KTA : {ktaNumberFormatted}</span>
              </div>
              <div className="flex justify-center my-1">
                <div className="w-[42px] h-[52px] bg-slate-100 border border-black overflow-hidden shrink-0">
                  <img 
                    src={fotoUrl || cheAvatar} 
                    alt={selectedMember.namaLengkap} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = cheAvatar;
                    }}
                  />
                </div>
              </div>
              <div className="font-black text-[6px] text-black space-y-[1px] px-1">
                <div className="grid grid-cols-[45px_5px_1fr] items-center">
                  <span>N a m a</span><span>:</span><span className="uppercase font-black">{selectedMember.namaLengkap}</span>
                </div>
                <div className="grid grid-cols-[45px_5px_1fr] items-center">
                  <span>N I K</span><span>:</span><span className="font-mono font-bold">{selectedMember.nik || '-'}</span>
                </div>
                <div className="grid grid-cols-[45px_5px_1fr] items-center">
                  <span>Anggota SBN</span><span>:</span><span className="uppercase">PT VICTORY CHINGLUH INDONESIA</span>
                </div>
                <div className="grid grid-cols-[45px_5px_1fr] items-center">
                  <span>Departemen</span><span>:</span><span className="uppercase">{selectedMember.departemen || '-'}</span>
                </div>
                <div className="grid grid-cols-[45px_5px_1fr] items-center">
                  <span>Jabatan</span><span>:</span><span className="uppercase font-black">{jabatan}</span>
                </div>
              </div>
              <div className="pt-[1.5px] border-t border-black text-center text-[4px] font-bold text-black">
                <p>KTA Resmi Pengurus Pusat SBN KASBI - Masa Berlaku: Aktif Berkelanjutan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    </ModalPortal>
  );
};
