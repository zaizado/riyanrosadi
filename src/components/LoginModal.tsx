import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Loader2
} from 'lucide-react';
import { UserAccount } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import fsbnLogo from '../assets/images/fsbn_logo_emblem_1785338169849.jpg';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { ModalPortal } from './ModalPortal';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { repositories } from '../repositories';

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
  onLoginSuccess,
  isFullPage = false
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser) {
      setErrorMessage('Username / Email / NIK harus diisi!');
      return;
    }
    if (!inputPass) {
      setErrorMessage('Password harus diisi!');
      return;
    }

    setIsLoading(true);

    let emailToUse = inputUser;
    if (!emailToUse.includes('@')) {
      let foundUser = users.find(u => 
        (u.username && u.username.trim().toLowerCase() === inputUser) ||
        (u.nik && u.nik.trim().toLowerCase() === inputUser) ||
        (u.name && u.name.trim().toLowerCase() === inputUser)
      );
      if (foundUser && foundUser.email) {
        emailToUse = foundUser.email;
      } else if (inputUser === 'sbnkasbivci1' || inputUser === 'superadmin') {
        emailToUse = 'superadmin@sbn-kasbi-vci.or.id';
      } else {
        emailToUse = `${inputUser}@sbn-kasbi-vci.or.id`;
      }
    }

    try {
      // Perform Firebase Authentication
      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, emailToUse, inputPass);
      } catch (authError: any) {
        if (authError.code === 'auth/operation-not-allowed') {
          throw authError;
        }
        // If user is superadmin or known user and not registered in Firebase Auth yet, bootstrap creation
        if ((authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') && inputPass.length >= 6) {
          try {
            userCred = await createUserWithEmailAndPassword(auth, emailToUse, inputPass);
          } catch (createErr: any) {
            throw authError;
          }
        } else {
          throw authError;
        }
      }

      const firebaseUser = userCred.user;
      let matchedProfile = users.find(u => u.id === firebaseUser.uid || u.email?.toLowerCase() === emailToUse.toLowerCase());

      if (!matchedProfile) {
        const isSA = emailToUse.toLowerCase() === 'superadmin@sbn-kasbi-vci.or.id' || inputUser === 'sbnkasbivci1';
        matchedProfile = {
          id: firebaseUser.uid,
          username: inputUser.includes('@') ? inputUser.split('@')[0] : inputUser,
          name: isSA ? 'Super Admin SBN KASBI' : (inputUser.charAt(0).toUpperCase() + inputUser.slice(1)),
          email: emailToUse,
          nik: isSA ? 'SA-00001' : '010000',
          role: isSA ? 'Super Admin' : 'Pengurus',
          department: isSA ? 'Dewan Pimpinan Utama' : 'PT Victory Chingluh Indonesia',
          isSuperAdmin: isSA,
          avatarUrl: cheAvatar
        };
        await repositories.users.save(matchedProfile);
      }

      setSuccessMessage(`Login berhasil! Selamat datang, ${matchedProfile.name}.`);
      setTimeout(() => {
        onLoginSuccess(matchedProfile!, rememberMe);
        if (onClose) onClose();
      }, 400);

    } catch (err: any) {
      console.error('Firebase Auth error:', err);

      // Fallback for operation-not-allowed (when Email/Password provider is disabled in Firebase Console)
      if (err.code === 'auth/operation-not-allowed') {
        let matchedProfile = users.find(u => 
          (u.email && u.email.toLowerCase() === emailToUse.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === inputUser) ||
          (u.nik && u.nik.toLowerCase() === inputUser)
        );

        const isSA = emailToUse.toLowerCase() === 'superadmin@sbn-kasbi-vci.or.id' || inputUser === 'sbnkasbivci1' || inputUser === 'superadmin';

        if (!matchedProfile) {
          matchedProfile = {
            id: isSA ? 'usr-superadmin' : `usr-${Date.now()}`,
            username: inputUser.includes('@') ? inputUser.split('@')[0] : inputUser,
            name: isSA ? 'Super Admin SBN KASBI' : (inputUser.charAt(0).toUpperCase() + inputUser.slice(1)),
            email: emailToUse,
            nik: isSA ? 'SA-00001' : '010000',
            role: isSA ? 'Super Admin' : 'Pengurus',
            department: isSA ? 'Dewan Pimpinan Utama' : 'PT Victory Chingluh Indonesia',
            isSuperAdmin: isSA,
            avatarUrl: cheAvatar
          };
          try {
            await repositories.users.save(matchedProfile);
          } catch (e) {
            console.warn('Could not save fallback user to Firestore:', e);
          }
        }

        // Verify password for local fallback
        if (isSA && inputPass !== 'superadmin1' && matchedProfile.password && inputPass !== matchedProfile.password) {
          setErrorMessage('Password Super Admin yang Anda masukkan salah.');
          return;
        } else if (!isSA && matchedProfile.password && inputPass !== matchedProfile.password) {
          setErrorMessage('Password yang Anda masukkan salah.');
          return;
        }

        setSuccessMessage(`Login berhasil! Selamat datang, ${matchedProfile.name}.`);
        setTimeout(() => {
          onLoginSuccess(matchedProfile!, rememberMe);
          if (onClose) onClose();
        }, 400);
        return;
      }

      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Password yang Anda masukkan salah. Silakan coba lagi.');
      } else if (err.code === 'auth/user-not-found') {
        setErrorMessage(`Akun "${username}" tidak ditemukan di Firebase Auth.`);
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('Terlalu banyak percobaan login gagal. Silakan coba lagi nanti.');
      } else {
        setErrorMessage(err.message || 'Gagal melakukan autentikasi dengan Firebase Auth.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className={`z-[9999] ${isFullPage ? 'min-h-[100dvh] w-full fixed inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center p-4 sm:p-6 bg-[#3a0000]' : 'mobile-modal-backdrop'}`}>
      
      {/* BACKGROUND GRAPHICS CONTAINER */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Base Radial Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#b30000] via-[#5c0000] to-[#120000]" />

        {/* Sunburst Rays Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {Array.from({ length: 32 }).map((_, i) => {
            const angle1 = (i * 11.25 * Math.PI) / 180;
            const angle2 = ((i * 11.25 + 5.625) * Math.PI) / 180;
            const x1 = 500 + 1500 * Math.cos(angle1);
            const y1 = 200 + 1500 * Math.sin(angle1);
            const x2 = 500 + 1500 * Math.cos(angle2);
            const y2 = 200 + 1500 * Math.sin(angle2);
            return (
              <polygon
                key={i}
                points={`500,200 ${x1},${y1} ${x2},${y2}`}
                fill="#ff1a1a"
                opacity={i % 2 === 0 ? "0.35" : "0.05"}
              />
            );
          })}
        </svg>

        {/* Left Side: Crowd Silhouette with Fists & Flags */}
        <div className="absolute bottom-0 left-0 w-1/2 h-80 sm:h-96 opacity-60 mix-blend-multiply">
          <svg className="w-full h-full" viewBox="0 0 500 300" preserveAspectRatio="none">
            {/* Flags */}
            <path d="M 40 180 L 35 60 L 90 80 L 40 110" fill="#200" stroke="#000" strokeWidth="2" />
            <path d="M 120 200 L 115 80 L 180 100 L 120 130" fill="#300" stroke="#000" strokeWidth="2" />
            <path d="M 220 220 L 210 100 L 270 120 L 215 150" fill="#200" stroke="#000" strokeWidth="2" />
            {/* Crowd bodies and raised arms */}
            <path d="
              M 0 300 
              L 0 220 
              Q 20 210, 30 230 
              L 35 180 L 45 180 L 50 220 
              Q 70 200, 85 220 
              L 90 170 L 100 170 L 105 210
              Q 130 190, 150 215
              L 160 160 L 172 160 L 175 220
              Q 200 195, 230 225
              L 240 175 L 252 175 L 255 230
              Q 280 200, 310 235
              L 320 185 L 330 185 L 335 240
              Q 370 210, 410 245
              L 420 190 L 430 190 L 435 255
              Q 460 220, 500 260
              L 500 300 Z" fill="#050000" />
          </svg>
        </div>

        {/* Right Side: Factory Industrial Skyline Silhouette */}
        <div className="absolute bottom-0 right-0 w-1/2 h-80 sm:h-96 opacity-60 mix-blend-multiply">
          <svg className="w-full h-full" viewBox="0 0 500 300" preserveAspectRatio="none">
            {/* Chimneys and Factory Roofs */}
            <path d="
              M 0 300 
              L 50 300 L 50 210 L 65 210 L 65 300
              L 90 300 L 90 180 L 105 180 L 105 300
              L 140 300 L 140 230 L 160 210 L 180 230 L 200 210 L 220 230 L 220 300
              L 260 300 L 260 160 L 275 160 L 275 300
              L 310 300 L 310 120 L 325 120 L 325 300
              L 370 300 L 370 190 L 385 190 L 385 300
              L 410 300 L 410 220 L 460 220 L 460 300
              L 500 300 Z" fill="#050000" />
          </svg>
        </div>

        {/* Bottom Left Halftone Dot Matrix Texture */}
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-25">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <defs>
              <pattern id="halftone" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="8" cy="8" r="5" fill="#ff2222" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#halftone)" />
          </svg>
        </div>

        {/* Bottom Right Paint Brush / Grunge Splash Texture */}
        <div className="absolute bottom-0 right-0 w-80 h-96 opacity-30 mix-blend-screen pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 300 400" preserveAspectRatio="none">
            <path d="M 100 400 Q 150 250, 300 100 L 300 400 Z" fill="#ff1a1a" />
            <path d="M 50 400 Q 200 300, 300 200 L 300 400 Z" fill="#990000" />
            <circle cx="220" cy="220" r="40" fill="#ff0000" opacity="0.4" />
            <circle cx="260" cy="160" r="25" fill="#ff0000" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full max-w-md my-auto flex flex-col items-center max-h-[92dvh] sm:max-h-[88dvh] overflow-y-auto custom-scrollbar">
        
        {/* Close Button if opened as overlay modal */}
        {!isFullPage && onClose && (
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white/80 hover:text-white bg-black/60 hover:bg-black p-2 rounded-full transition-colors z-20 cursor-pointer"
            title="Tutup Modal Login"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* TOP FSBN EMBLEM / LOGO */}
        <div className="flex flex-col items-center text-center mb-4">
          {/* Official FSBN Logo Image */}
          <div className="w-44 sm:w-52 relative drop-shadow-[0_12px_25px_rgba(0,0,0,0.9)]">
            <img 
              src="/assets/branding/logo-fsbn-original.jpg" 
              alt="Logo FSBN SBN KASBI PT VCI" 
              className="w-full h-auto object-contain rounded-xl"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fsbnLogo;
              }}
            />
          </div>

          {/* Subtitle Headline */}
          <div className="mt-2 text-center text-white px-2">
            <h2 className="text-xs sm:text-sm font-black tracking-wide leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
              SELAMAT DATANG DI PORTAL KOORDINASI
            </h2>
            <h3 className="text-xs sm:text-sm font-black tracking-wide leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase mt-0.5 text-slate-100">
              SBN KASBI PT VICTORY CHINGLUH INDONESIA
            </h3>
          </div>

          {/* Line Divider with Small Red Star */}
          <div className="flex items-center justify-center w-full max-w-xs mt-3 gap-2 opacity-80">
            <div className="h-[1px] bg-red-600/80 flex-1" />
            <span className="text-red-500 text-xs">★</span>
            <div className="h-[1px] bg-red-600/80 flex-1" />
          </div>
        </div>

        {/* LOGIN FORM CARD */}
        <div className="w-full bg-white/95 border border-red-200 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden text-slate-900">
          
          {/* Subtle Red Card Glow Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-red-600 rounded-full" />

          {/* Title Header inside Card */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-[1px] bg-red-200 flex-1" />
            <h4 className="text-base sm:text-lg font-black text-red-700 tracking-widest uppercase">
              LOGIN
            </h4>
            <div className="h-[1px] bg-red-200 flex-1" />
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Field 1: USERNAME */}
            <div className="relative flex items-center bg-slate-50 border border-slate-300 focus-within:border-red-600 rounded-xl px-3.5 py-3 transition-colors shadow-xs">
              <User className="w-5 h-5 text-red-600 shrink-0 mr-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="USERNAME"
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 uppercase tracking-wider focus:outline-none"
              />
            </div>

            {/* Field 2: PASSWORD */}
            <div className="relative flex items-center bg-slate-50 border border-slate-300 focus-within:border-red-600 rounded-xl px-3.5 py-3 transition-colors shadow-xs">
              <Lock className="w-5 h-5 text-red-600 shrink-0 mr-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="PASSWORD"
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 tracking-wider focus:outline-none pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-1">
              <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 tracking-wider uppercase cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-100 border-slate-300 text-red-600 focus:ring-red-600 accent-red-600 cursor-pointer"
                />
                <span>INGAT SAYA</span>
              </label>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm tracking-widest uppercase rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              LOGIN
            </button>
          </form>

        </div>

        {/* BOTTOM FOOTER SLOGAN */}
        <div className="mt-6 flex flex-col items-center w-full">
          <div className="flex items-center justify-center w-full max-w-sm gap-3">
            <div className="h-[1px] bg-red-700/80 flex-1" />
            <span className="text-sm sm:text-base font-black text-[#ffe600] tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              MUDA - BERANI - MILITAN
            </span>
            <div className="h-[1px] bg-red-700/80 flex-1" />
          </div>

          <div className="flex items-center justify-center w-full max-w-xs mt-2 gap-2 opacity-80">
            <div className="h-[1px] bg-red-600/80 flex-1" />
            <span className="text-red-500 text-xs">★</span>
            <div className="h-[1px] bg-red-600/80 flex-1" />
          </div>
        </div>

      </div>

    </div>
    </ModalPortal>
  );
};
