import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, Volume2, Trash2, ArrowRight, Info, ExternalLink, ShieldAlert } from 'lucide-react';
import { AuditLog } from '../types';
import { ActiveTab } from './Sidebar';
import { playNotificationSound } from '../lib/audio';
import { sortAuditLogsNewestFirst } from '../lib/storage';
import { ModalPortal } from './ModalPortal';

interface NotificationsModalProps {
  auditLogs: AuditLog[];
  onClose: () => void;
  onClearNotifications?: () => void;
  onDeleteSingleNotification?: (id: string) => void;
  onSelectTab?: (tab: ActiveTab) => void;
}

const mapModulToTab = (modul: AuditLog['modul']): { tab: ActiveTab; label: string } => {
  switch (modul) {
    case 'Data Anggota':
      return { tab: 'members', label: 'Data Anggota SBN' };
    case 'Advokasi':
      return { tab: 'advocacy', label: 'Kasus Advokasi' };
    case 'Anggota Sakit':
      return { tab: 'sick_visits', label: 'Pendampingan Sakit' };
    case 'Agenda':
      return { tab: 'agendas', label: 'Agenda & Kegiatan' };
    case 'Sembako':
      return { tab: 'sembako', label: 'Klaim Sembako' };
    case 'Kendaraan':
      return { tab: 'vehicles', label: 'Kendaraan Operasional' };
    case 'Keuangan':
      return { tab: 'finance', label: 'Kas Keuangan' };
    case 'Penggalangan Dana':
      return { tab: 'fundraising', label: 'Penggalangan Dana & Santunan' };
    case 'Sistem':
      return { tab: 'super_admin', label: 'Pengurus & Sistem' };
    default:
      return { tab: 'dashboard', label: 'Dashboard Utama' };
  }
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  auditLogs,
  onClose,
  onClearNotifications,
  onDeleteSingleNotification,
  onSelectTab
}) => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const sortedLogs = sortAuditLogsNewestFirst(auditLogs);

  useEffect(() => {
    if (auditLogs.length > 0) {
      playNotificationSound();
    }
  }, [auditLogs.length]);

  const handleNavigate = (modul: AuditLog['modul']) => {
    if (onSelectTab) {
      const { tab } = mapModulToTab(modul);
      onSelectTab(tab);
      onClose();
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-end">
        <div className="bg-white border-l border-slate-200 w-full max-w-md h-full text-slate-900 p-4 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden pb-[calc(1.5rem+var(--sab))]">
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-red-100 text-red-600 border border-red-200">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">Notifikasi Aktivitas Organisasi</h2>
                <p className="text-[11px] text-slate-500">Pemberitahuan real-time pengurus SBN KASBI</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              {auditLogs.length > 0 && onClearNotifications && (
                <button
                  type="button"
                  onClick={onClearNotifications}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Bersihkan Semua Notifikasi Akun Ini"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader / Quick Info */}
          {auditLogs.length > 0 && (
            <div className="pt-3 pb-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 shrink-0">
              <span className="font-semibold">{auditLogs.length} Notifikasi Aktif</span>
              <span className="text-[10px] text-slate-500">Klik card untuk detail / ikon sampah untuk hapus</span>
            </div>
          )}

          {/* Notification List Container */}
          <div className="py-4 space-y-2.5 flex-1 overflow-y-auto pr-1">
            {sortedLogs.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-800">Tidak Ada Notifikasi Baru</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Semua pemberitahuan di akun Anda telah dibersihkan. Notifikasi baru dari pengurus lain akan muncul secara real-time.
                </p>
              </div>
            ) : (
              sortedLogs.map((log) => {
                const targetInfo = mapModulToTab(log.modul);
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="p-3.5 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-red-400 space-y-1.5 text-xs transition-all cursor-pointer group shadow-sm relative"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold text-slate-800 group-hover:text-red-700 transition-colors">
                        {log.userNama} ({log.userRole})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono">{log.timestamp}</span>
                        {onDeleteSingleNotification && log.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSingleNotification(log.id!);
                            }}
                            className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Pemberitahuan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                        <span className="px-1.5 py-0.5 text-[9px] bg-red-100 text-red-700 border border-red-200 rounded font-semibold shrink-0">
                          {log.modul}
                        </span>
                        <span className="truncate group-hover:text-red-700">{log.aksi}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                      {log.detail}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-amber-700 font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                      <span>Klik untuk detail & ke {targetInfo.label}</span>
                      <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer with Actions */}
        <div className="pt-4 border-t border-slate-200 space-y-2 shrink-0">
          {auditLogs.length > 0 && onClearNotifications && (
            <button
              type="button"
              onClick={onClearNotifications}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Bersihkan Notifikasi Akun Ini ({auditLogs.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => playNotificationSound()}
            className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Uji Suara Notifikasi HP</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup Notifikasi
          </button>
        </div>

        {/* DETAIL NOTIFICATION POPUP MODAL */}
        {selectedLog && (
          <div className="absolute inset-0 z-20 bg-white p-6 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div>
              {/* Detail Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">Detail Pemberitahuan Aktivitas</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Detail Metadata */}
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200 rounded">
                    Modul: {selectedLog.modul}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">{selectedLog.timestamp}</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Aksi Organisasi:</label>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">{selectedLog.aksi}</p>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Pengurus / Eksekutor:</label>
                  <p className="font-bold text-emerald-700">{selectedLog.userNama} ({selectedLog.userRole})</p>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Detail Pesan:</label>
                  <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs leading-relaxed font-sans shadow-inner">
                    {selectedLog.detail}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => handleNavigate(selectedLog.modul)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Buka Modul {mapModulToTab(selectedLog.modul).label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Kembali ke Daftar Notifikasi
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
    </ModalPortal>
  );
};
