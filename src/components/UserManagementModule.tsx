import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Download, 
  RotateCcw, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  X, 
  Key, 
  UserPlus, 
  ShieldAlert,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { UserAccount, UserRole, AuditLog, checkIsSuperAdmin } from '../types';
import { sortAuditLogsNewestFirst } from '../lib/storage';
import { STRUKTUR_PENGURUS_DATA } from '../data/strukturPengurusData';
import { ConfirmModal } from './ConfirmModal';
import { exportFullBackup, resetAllData } from '../lib/storage';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { ModalPortal } from './ModalPortal';
import { SectionHeader, AppCard, ActionCard, PrimaryButton, SecondaryButton, StatusBadge } from './ui/DesignSystem';
import { repositories } from '../repositories';
import { formatUserAccount } from '../hooks/useAppData';

interface UserManagementModuleProps {
  users?: UserAccount[];
  auditLogs: AuditLog[];
  onAddUser: (newUser: UserAccount) => void;
  onUpdateUser: (updatedUser: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onResetSystem: () => void;
  currentUser: UserAccount;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  users = [],
  auditLogs,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onResetSystem,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit_logs' | 'backup'>('users');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // On-demand users list for User Management module
  const [onDemandUsers, setOnDemandUsers] = useState<UserAccount[]>(() => users.length > 0 ? users : [currentUser]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const isSuperAdmin = currentUser.role === 'Super Admin' || currentUser.username === 'superadmin' || currentUser.isSuperAdmin;

  // On-demand fetch users from Firestore when Super Admin views the users tab
  useEffect(() => {
    if (!isSuperAdmin) {
      setOnDemandUsers([currentUser]);
      return;
    }

    let isMounted = true;
    setIsLoadingUsers(true);

    const unsub = repositories.users.subscribe(
      [],
      (items) => {
        if (isMounted) {
          const formatted = items.map(u => formatUserAccount(u));
          setOnDemandUsers(formatted);
          setIsLoadingUsers(false);
        }
      },
      (err) => {
        console.warn('On-demand users subscription warning:', err.message);
        if (isMounted) setIsLoadingUsers(false);
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, [isSuperAdmin, currentUser.id]);

  // Deletion and reset modal state
  const [deleteUserConfirmObj, setDeleteUserConfirmObj] = useState<UserAccount | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    name: '',
    email: '',
    nik: '',
    role: 'Pengurus',
    department: 'Assembly',
    phoneNumber: ''
  });

  const rolesList: UserRole[] = [
    'Ketua',
    'Sekretaris',
    'Bendahara',
    'Pengurus',
    'Anggota'
  ];

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormError(null);
    setFormData({
      name: '',
      email: '',
      nik: `VCI-${Math.floor(10000 + Math.random() * 90000)}`,
      role: 'Pengurus',
      department: 'Assembly',
      phoneNumber: '0812' + Math.floor(10000000 + Math.random() * 90000000),
      avatarUrl: cheAvatar
    });
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditUser = (usr: UserAccount) => {
    setEditingUser(usr);
    setUserFormError(null);
    setFormData({ ...usr });
    setIsAddUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    setUserFormError(null);

    try {
      if (editingUser) {
        await onUpdateUser({
          ...editingUser,
          ...formData
        } as UserAccount);
      } else {
        const uniqueSuffix = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
          : Math.random().toString(36).substring(2, 10);

        const newUsr: UserAccount = {
          id: `usr-${Date.now()}-${uniqueSuffix}`,
          username: (formData.name ? formData.name.toLowerCase().replace(/\s+/g, '_') : 'user'),
          name: formData.name || 'User',
          email: formData.email || 'user@sbn.or.id',
          nik: formData.nik || 'VCI-00000',
          role: (formData.role as UserRole) || 'Pengurus',
          department: formData.department || 'Assembly',
          phoneNumber: formData.phoneNumber || '-',
          avatarUrl: formData.avatarUrl || cheAvatar
        };
        await onAddUser(newUsr);
      }
      setIsAddUserModalOpen(false);
    } catch (err: any) {
      console.error('UserManagementModule: Gagal menyimpan data user:', err);
      setUserFormError(err?.message || 'Gagal menyimpan data akun pengurus ke Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleUsers = isSuperAdmin ? onDemandUsers : onDemandUsers.filter(u => u.id === currentUser.id || u.username === currentUser.username);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <SectionHeader
        icon={ShieldCheck}
        title="Manajemen Akun Pengurus & Audit System"
        description="Hak Akses Role-Based Access Control (RBAC), Backup & Activity Logs"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === 'users' ? 'bg-red-600 text-white border-red-500 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              Akun ({visibleUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === 'audit_logs' ? 'bg-red-600 text-white border-red-500 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              Audit Logs ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === 'backup' ? 'bg-red-600 text-white border-red-500 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              Backup & Reset
            </button>
          </div>
        }
      />

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-300 font-semibold">
              {isSuperAdmin ? 'Daftar Seluruh Akun Pengurus SBN KASBI' : 'Informasi Akun Anda'}
            </span>
            {isSuperAdmin && (
              <button
                onClick={handleOpenAddUser}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-red-900/30"
              >
                <UserPlus className="w-4 h-4" />
                Tambah Akun Pengurus
              </button>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Pengurus</th>
                  <th className="p-3.5">Role Hak Akses</th>
                  <th className="p-3.5">Jabatan</th>
                  <th className="p-3.5">Kontak & NIK</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-600 mb-1" />
                        <p className="font-bold text-slate-300">Tidak ada data akun yang ditampilkan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-850">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={usr.avatarUrl || cheAvatar} 
                            alt={usr.name} 
                            className="w-9 h-9 rounded-full object-cover border border-slate-700" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = cheAvatar;
                            }}
                          />
                          <div>
                            <p className="font-bold text-white">{usr.name}</p>
                            <p className="text-[10px] text-slate-400">{usr.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-950 text-red-400 border border-red-800">
                          {usr.role}
                        </span>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-200">
                        {usr.department || '-'}
                      </td>

                      <td className="p-3.5 text-slate-300">
                        <p className="font-mono text-xs">{usr.nik}</p>
                        <p className="text-[10px] text-slate-400">{usr.phoneNumber}</p>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditUser(usr)}
                            className="p-1.5 rounded-lg bg-slate-800 text-blue-400 hover:bg-slate-700 cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!(usr.isSuperAdmin || usr.username === 'administrator' || usr.username === 'sbnkasbivci1' || usr.id === 'usr-superadmin' || usr.id === currentUser.id) && (
                            <button
                              onClick={() => setDeleteUserConfirmObj(usr)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 hover:border-rose-800 cursor-pointer transition-colors"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Audit Log Perubahan Data & Aktivitas Pengurus
          </h2>

          <div className="space-y-2.5">
            {sortAuditLogsNewestFirst(auditLogs).map((log) => (
              <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-200">{log.userNama} ({log.userRole})</span>
                  <span className="text-slate-500 font-mono text-[10px]">{log.timestamp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-slate-800 text-purple-400 rounded">
                    {log.modul}
                  </span>
                  <p className="font-bold text-slate-100">{log.aksi}</p>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{log.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & SYSTEM RESET */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/40 w-fit">
              <Download className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Export Cadangan Database JSON</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unduh seluruh file backup database (Data Anggota, Advokasi, Sakit, Agenda, Sembako, Audit Logs) untuk disimpan aman secara offline.
            </p>
            <button
              onClick={() => exportFullBackup({ users, auditLogs })}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh File Backup JSON
            </button>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-rose-950 text-rose-400 border border-rose-800/40 w-fit">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Reset System ke Seed Default</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kembalikan seluruh database aplikasi SBN VCI ke kondisi data awal pabrik/demo.
            </p>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Database System
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT USER MODAL */}
      {isAddUserModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
            <div className="mobile-modal-card bg-slate-900 border border-slate-800 text-white p-4 sm:p-6 shadow-2xl relative max-w-md">
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-white mb-4">
                {editingUser ? 'Edit Akun Pengurus' : 'Tambah Akun Pengurus Baru'}
              </h2>

              <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
                {userFormError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{userFormError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Lengkap Pengurus</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Email Login</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">NIK Karyawan</label>
                    <input
                      type="text"
                      value={formData.nik || ''}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Role Jabatan Serikat</label>
                    <select
                      value={formData.role || 'Koordinator Lapangan'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Jabatan (Struktur Pengurus)</label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="">-- Pilih Jabatan --</option>
                    {Array.from(new Set(STRUKTUR_PENGURUS_DATA.map((p) => p.jabatan))).map((jbt) => (
                      <option key={jbt} value={jbt}>
                        {jbt}
                      </option>
                    ))}
                    {formData.department && !Array.from(new Set(STRUKTUR_PENGURUS_DATA.map((p) => p.jabatan))).includes(formData.department) && (
                      <option value={formData.department}>{formData.department}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nomor HP / WA</label>
                  <input
                    type="text"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan User</span>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        </ModalPortal>
      )}

      {/* CONFIRM DELETE USER MODAL */}
      <ConfirmModal
        isOpen={!!deleteUserConfirmObj}
        title="Hapus Akun Pengurus"
        message={`Apakah Anda yakin ingin menghapus akun pengurus ${deleteUserConfirmObj?.name} (@${deleteUserConfirmObj?.username || deleteUserConfirmObj?.email})?`}
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        type="danger"
        icon="trash"
        onConfirm={() => {
          if (deleteUserConfirmObj) {
            onDeleteUser(deleteUserConfirmObj.id);
            setDeleteUserConfirmObj(null);
          }
        }}
        onCancel={() => setDeleteUserConfirmObj(null)}
      />

      {/* CONFIRM RESET DATABASE MODAL */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Seluruh Database Sistem"
        message="PERHATIAN: Tindakan ini akan menghapus seluruh perubahan data dan mengembalikan database aplikasi ke kondisi awal demo/pabrik!"
        confirmText="Ya, Reset Database"
        cancelText="Batal"
        type="danger"
        icon="warning"
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetSystem();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

    </div>
  );
};
