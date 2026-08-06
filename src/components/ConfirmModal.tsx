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
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-left my-auto max-h-[90vh] overflow-y-auto">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${
            type === 'danger' 
              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
              : type === 'warning'
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
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
            <h3 className="text-base font-black text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 font-bold text-xs rounded-xl text-white shadow-sm transition-all cursor-pointer ${
              type === 'danger' 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
