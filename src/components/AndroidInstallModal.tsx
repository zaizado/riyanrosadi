import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  X, 
  Download, 
  Check, 
  Sparkles, 
  QrCode, 
  ShieldCheck, 
  Share2, 
  ChevronRight, 
  Laptop,
  CheckCircle2,
  ExternalLink,
  Layers,
  Zap
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');

  useEffect(() => {
    // Check if app is already running in standalone / PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('Untuk memasang di Android, buka menu titik tiga (⋮) pada browser Chrome dan pilih "Tambahkan ke Layar Utama" atau "Install Aplikasi".');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-modal-backdrop animate-fadeIn">
      <div className="mobile-modal-card bg-slate-900 border border-red-900/60 text-white p-5 sm:p-6 shadow-2xl relative flex flex-col space-y-5 max-w-xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-lg shadow-red-900/30">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Android Ready
              </span>
              {isInstalled && (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" /> Terpasang
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
              Aplikasi Android SBN KASBI
            </h2>
            <p className="text-xs text-slate-400">
              PT Victory Chingluh Indonesia - Standalone App & WebAPK
            </p>
          </div>
        </div>

        {/* PROMINENT INSTALL BUTTON IF NATIVE PROMPT IS AVAILABLE */}
        {deferredPrompt ? (
          <div className="bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border border-red-500/40 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                Siap Dipasang Langsung!
              </p>
              <p className="text-[11px] text-slate-300">
                Klik tombol untuk menginstall ikon aplikasi di HP Android Anda.
              </p>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs shadow-lg flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Install Sekarang
            </button>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isInstalled 
                  ? 'Aplikasi sudah berjalan dalam mode Standalone Android App.'
                  : 'Dapat dipasang di seluruh smartphone Android (Samsung, Xiaomi, Oppo, Vivo, Realme, DLL).'
                }
              </span>
            </div>
          </div>
        )}

        {/* TAB SWITCHER */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'pwa'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            PWA / WebAPK (Layar Utama)
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'apk'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Build File APK Native
          </button>
        </div>

        {/* TAB 1: PWA / WEBAPK INSTRUCTIONS */}
        {activeTab === 'pwa' && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <h3 className="font-bold text-red-400 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Cara Pasang di HP Android (Google Chrome / Brave / Samsung Internet):
              </h3>
              <ol className="space-y-2.5 text-slate-300 pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-red-800">1</span>
                  <span>Buka halaman aplikasi SBN KASBI ini menggunakan browser <b>Google Chrome</b> di HP Android.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-red-800">2</span>
                  <span>Tekan tombol menu titik tiga (<b>⋮</b>) di pojok kanan atas browser.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-red-800">3</span>
                  <span>Pilih menu <b>"Tambahkan ke Layar Utama"</b> (<i>Add to Home Screen</i>) atau <b>"Install Aplikasi"</b>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-red-800">4</span>
                  <span>Tekan <b>"Install"</b>. Ikon SBN KASBI akan muncul di layar depan HP Anda seperti aplikasi bawaan Google Play Store!</span>
                </li>
              </ol>
            </div>

            {/* FEATURE HIGHLIGHTS */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" /> Scanner QR Cepat
                </p>
                <p className="text-[10px] text-slate-400">Akses kamera HP responsif untuk scan kartu anggota & klaim sembako.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sync Firebase
                </p>
                <p className="text-[10px] text-slate-400">Data kas, iuran & anggota tersinkron otomatis ke cloud real-time.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUILD APK NATIVE INSTRUCTIONS */}
        {activeTab === 'apk' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Panduan Export Ke File `.APK` (Android Binary):
              </h3>
              <p className="text-slate-300">
                Jika Anda ingin membagikan file instalasi <b>.apk</b> langsung ke seluruh anggota via WhatsApp/Telegram tanpa lewat browser:
              </p>
              
              <div className="space-y-2 text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <p className="font-bold text-white text-[11px]">Metode 1: PWABuilder (Gratis & Tanpa Coding)</p>
                  <p className="text-[10px] text-slate-400">
                    1. Salin URL aplikasi web ini.<br/>
                    2. Buka <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-red-400 underline font-bold">PWABuilder.com</a>.<br/>
                    3. Tempelkan URL dan klik <b>"Build Android APK"</b> untuk mengunduh file `.apk` siap install di Android.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <p className="font-bold text-white text-[11px]">Metode 2: Export Capacitor / Android Studio</p>
                  <p className="text-[10px] text-slate-400">
                    1. Download project via menu Settings -&gt; Export Project.<br/>
                    2. Jalankan perintah: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-red-400">npm i @capacitor/core @capacitor/android</code><br/>
                    3. Jalankan: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-red-400">npx cap add android && npx cap open android</code><br/>
                    4. Build APK dari Android Studio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <p className="text-[11px] text-slate-500">
            SBN KASBI VCI Mobile Edition
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
