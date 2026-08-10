import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { compressImage } from '../lib/imageUtils';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  title?: string;
  facingModeDefault?: 'environment' | 'user';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Ambil Foto dengan Kamera',
  facingModeDefault = 'environment'
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(facingModeDefault);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Camera Stream
  const startCamera = async (mode: 'environment' | 'user') => {
    setIsLoading(true);
    setErrorMsg(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Fitur kamera tidak didukung di peramban ini.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan HP/browser Anda atau pilih dari galeri.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('Kamera tidak ditemukan pada perangkat ini. Silakan gunakan galeri foto.');
      } else {
        setErrorMsg('Gagal membuka kamera: ' + (err.message || 'Terjadi kesalahan sistem'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera(facingMode);
    } else {
      // Stop camera when closed or captured
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode, capturedPhoto]);

  if (!isOpen) return null;

  // Take Snapshot from Video Stream
  const handleTakeSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if user facing camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Compress image to safe base64 size
    try {
      // Convert dataUrl to File to pass to compressImage
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'camera_photo.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(file, 800, 800, 0.8);
      setCapturedPhoto(compressed);
    } catch {
      setCapturedPhoto(dataUrl);
    }
  };

  // Switch Front/Back Camera
  const handleToggleCamera = () => {
    setCapturedPhoto(null);
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Select File From Gallery / Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.8);
        setCapturedPhoto(compressed);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }
  };

  // Confirm and Use Photo
  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      handleCloseModal();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleCloseModal = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedPhoto(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">{title}</h3>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Display / Preview Area */}
        <div className="relative bg-black flex-1 min-h-[280px] sm:min-h-[340px] flex items-center justify-center overflow-hidden">
          {capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Hasil Tangkapan Kamera"
              className="w-full h-full object-contain max-h-[60vh]"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover max-h-[60vh] ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-400" />
                  <p className="text-xs text-slate-300">Menyiapkan kamera...</p>
                </div>
              )}

              {errorMsg && (
                <div className="absolute inset-x-4 bg-rose-950/90 border border-rose-800 rounded-2xl p-4 text-center text-rose-200 text-xs space-y-3 z-10">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p>{errorMsg}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Pilih Dari Galeri
                  </button>
                </div>
              )}
            </>
          )}

          {/* Hidden File Input Fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          {capturedPhoto ? (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Ulangi
              </button>
              <button
                onClick={handleConfirmPhoto}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
              >
                <Check className="w-4 h-4" />
                Gunakan Foto
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                title="Pilih dari Galeri"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Galeri</span>
              </button>

              <button
                onClick={handleTakeSnapshot}
                disabled={!stream || !!errorMsg}
                className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25"
              >
                <Camera className="w-5 h-5" />
                <span>Ambil Foto</span>
              </button>

              <button
                onClick={handleToggleCamera}
                disabled={!stream || !!errorMsg}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                title="Putar Kamera"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Putar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
