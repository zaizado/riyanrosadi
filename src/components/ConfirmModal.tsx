import React from 'react';
import { AlertTriangle, Trash2, LogOut, CheckCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: 'trash' | 'logout' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger',
  icon = 'trash',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-left">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${
            type === 'danger' 
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60' 
              : type === 'warning'
              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
              : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60'
          }`}>
            {icon === 'logout' ? (
              <LogOut className="w-6 h-6" />
            ) : icon === 'warning' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Trash2 className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-white">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 font-bold text-xs rounded-xl text-white shadow-md transition-all cursor-pointer ${
              type === 'danger' 
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40' 
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
