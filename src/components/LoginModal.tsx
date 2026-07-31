import React, { useState } from 'react';
import { 
  LogIn, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { UserAccount } from '../types';
import { FsbnLogo } from './FsbnLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  users: UserAccount[];
  currentUser: UserAccount;
  onLoginSuccess: (user: UserAccount, rememberMe: boolean) => void;
  isFullPage?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onLoginSuccess,
  isFullPage = false
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputUser = username.trim().toLowerCase();
    if (!inputUser) {
      setErrorMessage('Username harus diisi!');
      return;
    }

    // Find account by username, email, or name
    const foundUser = users.find(u => 
      (u.username && u.username.toLowerCase() === inputUser) ||
      u.name.toLowerCase() === inputUser ||
      u.email.toLowerCase() === inputUser
    );

    if (!foundUser) {
      setErrorMessage(`Akun username "${username}" tidak ditemukan!`);
      return;
    }

    // Check password
    if (foundUser.password && foundUser.password !== password) {
      setErrorMessage('Password yang Anda masukkan salah. Silakan coba lagi.');
      return;
    }

    // Success
    setSuccessMessage(`Login berhasil! Selamat datang, ${foundUser.name}.`);
    setTimeout(() => {
      onLoginSuccess(foundUser, rememberMe);
      if (onClose) onClose();
    }, 400);
  };

  return (
    <div className={`z-50 ${isFullPage ? 'min-h-screen bg-slate-950 flex items-center justify-center p-4' : 'fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4'}`}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative transition-all">
        
        {/* Close button if not forced full page */}
        {!isFullPage && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors z-10"
            title="Tutup Modal Login"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-48 h-48 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center space-x-4 relative z-10">
            <FsbnLogo className="w-14 h-14 rounded-2xl shadow-xl border-2 border-red-500/50 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Login Portal Serikat</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-600 text-white rounded-full uppercase tracking-wider">
                  SBN KASBI
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                PT Victory Chingluh Indonesia
              </p>
            </div>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-red-400" />
                  Username / NIK Karyawan
                </span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username login..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  Password Akses
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan password..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center space-x-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-red-600 focus:ring-red-500/50 accent-red-600 cursor-pointer"
                />
                <span>Ingat Saya (Sesi tetap tersimpan)</span>
              </label>
              <span className="text-[10px] text-slate-500">Otomatis Login</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs rounded-xl shadow-lg shadow-red-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>MASUK APLIKASI</span>
            </button>
          </form>

        </div>

        {/* Footer Security Badge */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Sistem Terenkripsi & Cloud Database
          </span>
          <span className="font-mono text-slate-500">v2.4 Proteksi Resmi</span>
        </div>

      </div>
    </div>
  );
};
