import React, { useState, useRef, useEffect } from 'react';
import { User, ShieldCheck, Camera, Phone, Mail, Building2, BadgeCheck, Save, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../types';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { compressImage } from '../lib/imageUtils';

interface ProfileModuleProps {
  currentUser: UserAccount;
  onUpdateUser: (updatedUser: UserAccount) => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({ currentUser, onUpdateUser }) => {
  const [photoUrl, setPhotoUrl] = useState(currentUser.avatarUrl || cheAvatar);
  const [phone, setPhone] = useState(currentUser.phoneNumber || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser.avatarUrl) {
      setPhotoUrl(currentUser.avatarUrl);
    }
    setPhone(currentUser.phoneNumber || '');
    setEmail(currentUser.email || '');
  }, [currentUser]);

  // File Upload Handler with Canvas Compression (< 40KB)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 250, 250, 0.65);
      setPhotoUrl(compressed);
      onUpdateUser({
        ...currentUser,
        avatarUrl: compressed,
        phoneNumber: phone || currentUser.phoneNumber,
        email: email || currentUser.email
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalPhoto = photoUrl;
    if (finalPhoto && finalPhoto.length > 100000 && finalPhoto.startsWith('data:image')) {
      finalPhoto = await compressImage(finalPhoto, 250, 250, 0.65);
    }
    onUpdateUser({
      ...currentUser,
      avatarUrl: finalPhoto,
      phoneNumber: phone,
      email: email,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none pb-10">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-[#3d0000] via-[#1a0000] to-[#0d0d0d] border border-red-900/60 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
        
        {/* Photo Avatar with Camera Overlay Button */}
        <div className="relative group shrink-0">
          <img
            src={photoUrl || cheAvatar}
            alt={currentUser.name}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-red-600 shadow-2xl bg-black"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = cheAvatar;
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg border-2 border-black cursor-pointer group-hover:scale-110 transition-transform"
            title="Ubah Foto Profil"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Core Info */}
        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-black uppercase">
            <BadgeCheck className="w-4 h-4 text-red-500" />
            {currentUser.role}
          </div>
          <h1 className="text-2xl font-black text-white">{currentUser.name}</h1>
          <p className="text-xs text-gray-300 font-extrabold tracking-wide">
            NIK KARYAWAN: <span className="text-red-400 font-mono text-sm">{currentUser.nik}</span>
          </p>
          <p className="text-xs text-gray-400">
            Departemen: {currentUser.department || 'Operasional VCI'}
          </p>
        </div>

      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Profil berhasil diperbarui dan tersimpan!</span>
        </div>
      )}

      {/* Edit Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-[#121212] border border-red-950/80 rounded-2xl p-6 space-y-5 shadow-2xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider border-b border-red-950 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-500" />
          Informasi Akun Pengguna
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Field 1: Nama Lengkap (Read-only / info) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Nama Lengkap</label>
            <input
              type="text"
              value={currentUser.name}
              disabled
              className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-3 py-2.5 text-xs text-gray-300 cursor-not-allowed font-bold"
            />
          </div>

          {/* Field 2: NIK (Read-only / info) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">NIK Karyawan</label>
            <input
              type="text"
              value={currentUser.nik}
              disabled
              className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-3 py-2.5 text-xs text-gray-300 cursor-not-allowed font-mono font-bold"
            />
          </div>

          {/* Field 3: Jabatan Organisasi */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Jabatan Organisasi</label>
            <input
              type="text"
              value={currentUser.role}
              disabled
              className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-3 py-2.5 text-xs text-red-400 cursor-not-allowed font-bold"
            />
          </div>

          {/* Field 4: Departemen */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Departemen / Divisi</label>
            <input
              type="text"
              value={currentUser.department || 'VCI Factory'}
              disabled
              className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-3 py-2.5 text-xs text-gray-300 cursor-not-allowed font-bold"
            />
          </div>

          {/* Field 5: Nomor HP / WhatsApp (Editable) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Nomor HP / WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812xxxx"
              className="w-full bg-[#1a1a1a] border border-[#333] focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Field 6: Email (Editable) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Alamat Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@domain.com"
              className="w-full bg-[#1a1a1a] border border-[#333] focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

        </div>

        <div className="pt-3 border-t border-red-950 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/40 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>

      </form>

    </div>
  );
};
