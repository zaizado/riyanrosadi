import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  User, 
  ShieldAlert, 
  Users, 
  RefreshCw,
  Search,
  Key,
  Building2,
  Phone,
  X,
  Plus
} from 'lucide-react';
import { UserAccount, UserRole, AuditLog, checkIsSuperAdmin } from '../types';
import { ConfirmModal } from './ConfirmModal';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { STRUKTUR_PENGURUS_DATA } from '../data/strukturPengurusData';

import { auth } from '../lib/firebase';
import { updatePassword } from 'firebase/auth';

interface SuperAdminModuleProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (newUser: UserAccount) => void;
  onUpdateUser: (updatedUser: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onLogAudit?: (modul: AuditLog['modul'], aksi: string, detail: string) => void;
}

export const SuperAdminModule: React.FC<SuperAdminModuleProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onLogAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'password' | 'manage_accounts' | 'security_info'>('password');

  // Find Super Admin Account (or default)
  const superAdminAccount = users.find(u => u.isSuperAdmin || u.username === 'sbnkasbivci1' || u.role === 'Super Admin') || currentUser;

  // Tab 1: Super Admin Password Form State
  const [saUsername, setSaUsername] = useState(superAdminAccount.username || 'sbnkasbivci1');
  const [saOldPassword, setSaOldPassword] = useState('');
  const [saNewPassword, setSaNewPassword] = useState('');
  const [saConfirmPassword, setSaConfirmPassword] = useState('');
  const [showSaOldPass, setShowSaOldPass] = useState(false);
  const [showSaNewPass, setShowSaNewPass] = useState(false);
  const [saMessage, setSaMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab 2: Manage Accounts State
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [deleteAccConfirmObj, setDeleteAccConfirmObj] = useState<UserAccount | null>(null);
  const [resetPassModalAccount, setResetPassModalAccount] = useState<UserAccount | null>(null);
  const [quickNewPass, setQuickNewPass] = useState('');
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Form data for creating/editing accounts
  const [accountForm, setAccountForm] = useState<{
    name: string;
    username: string;
    password?: string;
    nik: string;
    role: UserRole;
    department: string;
    phoneNumber: string;
    email: string;
  }>({
    name: '',
    username: '',
    password: '',
    nik: '',
    role: 'Pengurus',
    department: 'Assembly',
    phoneNumber: '',
    email: ''
  });

  const rolesList: UserRole[] = [
    'Super Admin',
    'Ketua',
    'Sekretaris',
    'Pengurus',
    'Administrator'
  ];

  // Handler: Update Super Admin Password / Username
  const handleSaveSuperAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaMessage(null);

    if (!saNewPassword || saNewPassword.length < 6) {
      setSaMessage({ type: 'error', text: 'Password baru minimal 6 karakter!' });
      return;
    }

    if (saNewPassword !== saConfirmPassword) {
      setSaMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, saNewPassword);
      } else {
        throw new Error('Sesi Firebase Auth tidak ditemukan. Silakan login kembali.');
      }

      const updatedSA: UserAccount = {
        ...superAdminAccount,
        username: saUsername.trim() || 'sbnkasbivci1',
        role: 'Super Admin',
        isSuperAdmin: true
      };

      onUpdateUser(updatedSA);
      if (onLogAudit) {
        onLogAudit('Sistem', 'Ubah Password Super Admin', `Super Admin mengubah username menjadi (${updatedSA.username}) dan memperbarui password via Firebase Auth.`);
      }

      setSaMessage({ type: 'success', text: 'Password Super Admin berhasil diperbarui via Firebase Authentication!' });
      setSaOldPassword('');
      setSaNewPassword('');
      setSaConfirmPassword('');
    } catch (err: any) {
      console.error('SA Password update error:', err);
      setSaMessage({ type: 'error', text: err.message || 'Gagal memperbarui password Super Admin via Firebase Auth.' });
    }
  };

  // Handler: Toggle password visibility in table
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Handler: Open Add Account Modal
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountError(null);
    setAccountForm({
      name: '',
      username: '',
      password: '',
      nik: `VCI-${Math.floor(10000 + Math.random() * 90000)}`,
      role: 'Pengurus',
      department: 'Assembly',
      phoneNumber: '0812' + Math.floor(10000000 + Math.random() * 90000000),
      email: ''
    });
    setIsAddAccountModalOpen(true);
  };

  // Handler: Open Edit Account Modal
  const handleOpenEditAccount = (acc: UserAccount) => {
    setEditingAccount(acc);
    setAccountError(null);
    setAccountForm({
      name: acc.name,
      username: acc.username || '',
      nik: acc.nik,
      role: acc.role,
      department: acc.department || 'Assembly',
      phoneNumber: acc.phoneNumber || '',
      email: acc.email || ''
    });
    setIsAddAccountModalOpen(true);
  };

  // Handler: Save Add/Edit Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name || !accountForm.username) return;

    setIsSubmittingAccount(true);
    setAccountError(null);

    try {
      if (editingAccount) {
        const updated: UserAccount = {
          ...editingAccount,
          name: accountForm.name.trim(),
          username: accountForm.username.trim(),
          nik: accountForm.nik.trim(),
          role: accountForm.role,
          department: accountForm.department,
          phoneNumber: accountForm.phoneNumber.trim(),
          email: accountForm.email.trim() || `${accountForm.username.trim()}@sbn-kasbi-vci.or.id`
        };
        await onUpdateUser(updated);
      } else {
        const uniqueSuffix = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
          : Math.random().toString(36).substring(2, 10);

        const newAcc: UserAccount = {
          id: `usr-${Date.now()}-${uniqueSuffix}`,
          name: accountForm.name.trim(),
          username: accountForm.username.trim(),
          nik: accountForm.nik.trim(),
          role: accountForm.role,
          department: accountForm.department,
          phoneNumber: accountForm.phoneNumber.trim(),
          email: accountForm.email.trim() || `${accountForm.username.trim()}@sbn-kasbi-vci.or.id`,
          avatarUrl: cheAvatar
        };
        await onAddUser(newAcc);
      }
      setIsAddAccountModalOpen(false);
    } catch (err: any) {
      console.error('SuperAdminModule: Gagal menyimpan data akun:', err);
      setAccountError(err?.message || 'Gagal menyimpan data akun pengurus ke Firestore.');
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  // Handler: Quick Reset Password Info
  const handleQuickResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassModalAccount) return;

    if (onLogAudit) {
      onLogAudit('Sistem', 'Reset Password Akun', `Super Admin memicu permintaan reset password akun ${resetPassModalAccount.name} (${resetPassModalAccount.username}).`);
    }

    setResetPassModalAccount(null);
    setQuickNewPass('');
  };

  const isSuperAdmin = currentUser.role === 'Super Admin' || currentUser.username === 'superadmin' || currentUser.isSuperAdmin;
  const baseUsers = isSuperAdmin ? users : users.filter(u => u.id === currentUser.id || u.username === currentUser.username);

  // Filter accounts
  const filteredUsers = baseUsers.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.nik.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-white">Akses Terbatas: Khusus Super Admin</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Menu Kontrol Utama dan Kelola Akun Pengurus hanya dapat diakses oleh akun <strong className="text-amber-400">Super Admin</strong>. Akun pengurus biasa tidak memiliki otorisasi untuk mengubah kredensial utama aplikasi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Menu Akses Super Admin</h1>
              <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded uppercase tracking-wider">
                Akses Terproteksi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola kredensial login Super Admin & pendaftaran akun pengurus resmi SBN KASBI PT VCI
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('password')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'password'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password Super Admin</span>
          </button>
          <button
            onClick={() => setActiveTab('manage_accounts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'manage_accounts'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kelola Akun Admin ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('security_info')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'security_info'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Info Akses</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CHANGE SUPER ADMIN PASSWORD */}
      {activeTab === 'password' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ubah Password Login Super Admin</h2>
              <p className="text-xs text-slate-400">
                Ganti password default (<b>superadmin1</b>) dengan password keamanan pilihan Anda.
              </p>
            </div>
          </div>

          {saMessage && (
            <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
              saMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {saMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />}
              <span>{saMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSuperAdminPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Username Super Admin
              </label>
              <input
                type="text"
                value={saUsername}
                onChange={(e) => setSaUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                placeholder="sbnkasbivci1"
              />
              <p className="text-[10px] text-slate-500 mt-1">Username default: <b>sbnkasbivci1</b></p>
            </div>

            {superAdminAccount.password && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Password Lama Super Admin
                </label>
                <div className="relative">
                  <input
                    type={showSaOldPass ? "text" : "password"}
                    value={saOldPassword}
                    onChange={(e) => setSaOldPassword(e.target.value)}
                    placeholder="Masukkan password lama..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSaOldPass(!showSaOldPass)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {showSaOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Password Baru Super Admin *
                </label>
                <div className="relative">
                  <input
                    type={showSaNewPass ? "text" : "password"}
                    value={saNewPassword}
                    onChange={(e) => setSaNewPassword(e.target.value)}
                    required
                    placeholder="Minimal 4 karakter..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSaNewPass(!showSaNewPass)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {showSaNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Konfirmasi Password Baru *
                </label>
                <input
                  type="password"
                  value={saConfirmPassword}
                  onChange={(e) => setSaConfirmPassword(e.target.value)}
                  required
                  placeholder="Ulangi password baru..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Password Super Admin</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANAGE ADMIN ACCOUNTS */}
      {activeTab === 'manage_accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari akun (Username, Nama, NIK, Role)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleOpenAddAccount}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0 justify-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Buat Akun Admin Baru</span>
            </button>
          </div>

          {/* Accounts Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Pengurus / Nama</th>
                    <th className="p-3.5">Username Login</th>
                    <th className="p-3.5">Autentikasi</th>
                    <th className="p-3.5">Role Hak Akses</th>
                    <th className="p-3.5">NIK & Jabatan</th>
                    <th className="p-3.5 text-center">Aksi / Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                        Tidak ditemukan data akun pengurus.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((acc) => {
                      const isSuper = acc.isSuperAdmin || acc.role === 'Super Admin' || acc.username === 'sbnkasbivci1';

                      return (
                        <tr key={acc.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={acc.avatarUrl || cheAvatar}
                                alt={acc.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-red-950 shrink-0"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = cheAvatar;
                                }}
                              />
                              <div>
                                <p className="font-bold text-white flex items-center gap-1.5">
                                  <span>{acc.name}</span>
                                  {isSuper && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded uppercase">
                                      Super Admin
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400">{acc.email || '-'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono font-bold text-slate-200 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                              {acc.username || '-'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40 inline-flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              Firebase Auth
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              acc.role === 'Super Admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : acc.role === 'Ketua'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : acc.role === 'Sekretaris'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {acc.role}
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-300">
                            <p className="font-medium text-slate-200">{acc.department || '-'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">NIK: {acc.nik}</p>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setResetPassModalAccount(acc)}
                                className="p-1.5 bg-slate-800 text-amber-400 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                                title="Set Password Baru"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditAccount(acc)}
                                className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                                title="Edit Akun"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {!isSuper && (
                                <button
                                  onClick={() => setDeleteAccConfirmObj(acc)}
                                  className="p-1.5 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 rounded-lg border border-rose-800/40 transition-colors cursor-pointer"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY INFO */}
      {activeTab === 'security_info' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sistem Keamanan & Hak Akses Pengurus</h2>
              <p className="text-xs text-slate-400">Panduan proteksi aplikasi dari akses pihak luar yang tidak berhak</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-amber-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Akses Kredensial Super Admin
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Super Admin memiliki wewenang tertinggi untuk mengatur password utama, mengedit hak akses pengurus, dan mereset kredensial login.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300">
                <p>Default Username: <b>sbnkasbivci1</b></p>
                <p>Default Password: <b>superadmin1</b></p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Pendaftaran Akun Pengurus Resmi
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Hanya akun pengurus yang telah didaftarkan oleh Super Admin yang berhak menggunakan fitur pengelolaan data anggota, advokasi, dan pembagian sembako.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ACCOUNT */}
      {isAddAccountModalOpen && (
        <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-4 sm:p-6 shadow-2xl relative max-w-lg">
            <button
              onClick={() => setIsAddAccountModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-1.5 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingAccount ? 'Edit Akun Pengurus' : 'Buat Akun Admin / Pengurus Baru'}
                </h3>
                <p className="text-xs text-slate-400">Atur username & password login pengurus resmi</p>
              </div>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              {accountError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{accountError}</span>
                </div>
              )}
              
              {/* Dropdown pilih NIK dari Struktur Pengurus (Point 11 requirement) */}
              {!editingAccount && (
                <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 space-y-1.5">
                  <label className="text-xs font-black text-amber-400 block uppercase tracking-wider">
                    Pilih NIK Pengurus Resmi (Struktur Pengurus SBN KASBI) *
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedNik = e.target.value;
                      if (!selectedNik) return;
                      const p = STRUKTUR_PENGURUS_DATA.find((item) => item.nik === selectedNik);
                      if (p) {
                        const cleanUsername = p.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
                        setAccountForm({
                          ...accountForm,
                          nik: p.nik,
                          name: p.nama,
                          username: cleanUsername,
                          department: p.jabatan,
                          phoneNumber: p.noHp || accountForm.phoneNumber,
                          email: `${cleanUsername}@sbn-kasbi-vci.or.id`
                        });
                      }
                    }}
                    className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-3 py-2 text-xs text-amber-200 font-bold focus:outline-none"
                  >
                    <option value="">-- Pilih NIK / Nama Pengurus --</option>
                    {STRUKTUR_PENGURUS_DATA.map((p) => (
                      <option key={p.id} value={p.nik}>
                        {p.nik} - {p.nama} ({p.jabatan})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-300/80 italic">
                    Memilih NIK akan otomatis mengisi Nama, Username, Password, dan Jabatan dari data resmi pengurus.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nama Lengkap Pengurus *</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  required
                  placeholder="Contoh: Ahmad Subagyo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Username Login *</label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  required
                  placeholder="Contoh: ahmad_admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Role Hak Akses *</label>
                  <select
                    value={accountForm.role}
                    onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value as UserRole })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {rolesList.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">NIK Karyawan / No. Pengurus</label>
                  <input
                    type="text"
                    value={accountForm.nik}
                    onChange={(e) => setAccountForm({ ...accountForm, nik: e.target.value })}
                    placeholder="VCI-12345"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Jabatan (Struktur Pengurus) *</label>
                  <select
                    value={accountForm.department}
                    onChange={(e) => setAccountForm({ ...accountForm, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="">-- Pilih Jabatan --</option>
                    {Array.from(new Set(STRUKTUR_PENGURUS_DATA.map((p) => p.jabatan))).map((jbt) => (
                      <option key={jbt} value={jbt}>
                        {jbt}
                      </option>
                    ))}
                    {accountForm.department && !Array.from(new Set(STRUKTUR_PENGURUS_DATA.map((p) => p.jabatan))).includes(accountForm.department) && (
                      <option value={accountForm.department}>{accountForm.department}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nomor HP / Whatsapp</label>
                  <input
                    type="text"
                    value={accountForm.phoneNumber}
                    onChange={(e) => setAccountForm({ ...accountForm, phoneNumber: e.target.value })}
                    placeholder="0812..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmittingAccount}
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAccount}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAccount ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Akun</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK RESET PASSWORD */}
      {resetPassModalAccount && (
        <div className="mobile-modal-backdrop">
          <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl relative max-w-md">
            <button
              onClick={() => setResetPassModalAccount(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Password Akun</h3>
                <p className="text-xs text-slate-400">Set password baru untuk <b>{resetPassModalAccount.name}</b></p>
              </div>
            </div>

            <form onSubmit={handleQuickResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Password Baru Login
                </label>
                <input
                  type="text"
                  value={quickNewPass}
                  onChange={(e) => setQuickNewPass(e.target.value)}
                  required
                  placeholder="Ketik password baru..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassModalAccount(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE ACCOUNT MODAL */}
      <ConfirmModal
        isOpen={!!deleteAccConfirmObj}
        title="Hapus Hak Akses Pengurus"
        message={`Apakah Anda yakin ingin menghapus akun dan mencabut hak akses pengurus ${deleteAccConfirmObj?.name} (${deleteAccConfirmObj?.username}) melalui Pengaturan Super Admin?`}
        confirmText="Ya, Hapus & Cabut Akses"
        cancelText="Batal"
        type="danger"
        icon="trash"
        onConfirm={() => {
          if (deleteAccConfirmObj) {
            onDeleteUser(deleteAccConfirmObj.id);
            setDeleteAccConfirmObj(null);
          }
        }}
        onCancel={() => setDeleteAccConfirmObj(null)}
      />

    </div>
  );
};
