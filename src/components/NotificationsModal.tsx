import React, { useEffect } from 'react';
import { X, Bell, CheckCircle2, Clock, Activity, ShieldAlert, Volume2 } from 'lucide-react';
import { AuditLog } from '../types';
import { playNotificationSound } from '../lib/audio';

interface NotificationsModalProps {
  auditLogs: AuditLog[];
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ auditLogs, onClose }) => {
  useEffect(() => {
    playNotificationSound();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full text-white p-6 shadow-2xl flex flex-col justify-between relative">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">Notifikasi Aktivitas Organisasi</h2>
                <p className="text-[11px] text-slate-400">Pemberitahuan real-time pengurus SBN KASBI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="py-4 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-slate-200">{log.userNama} ({log.userRole})</span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-100">
                  <span className="px-1.5 py-0.5 text-[9px] bg-red-950 text-red-400 border border-red-800/60 rounded">
                    {log.modul}
                  </span>
                  <span>{log.aksi}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{log.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Audio Test */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => playNotificationSound()}
            className="w-full py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/60 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Uji Suara Notifikasi HP</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
          >
            Tutup Notifikasi
          </button>
        </div>

      </div>
    </div>
  );
};
