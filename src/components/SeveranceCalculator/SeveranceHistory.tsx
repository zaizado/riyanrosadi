import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Printer, 
  Trash2, 
  Eye, 
  FileText, 
  UserCheck, 
  Calendar, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { SeveranceCalculationResult } from '../../types/severance';
import { formatRupiah } from '../../utils/currencyFormatter';
import { generateSeverancePdf } from './SeverancePdfGenerator';
import { ConfirmModal } from '../ConfirmModal';
import { UserAccount, checkIsSuperAdmin } from '../../types';

interface SeveranceHistoryProps {
  historyItems: SeveranceCalculationResult[];
  onDeleteHistory: (id: string, nik: string, employeeName: string) => Promise<void>;
  currentUser: UserAccount;
}

export const SeveranceHistory: React.FC<SeveranceHistoryProps> = ({
  historyItems,
  onDeleteHistory,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<SeveranceCalculationResult | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SeveranceCalculationResult | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = checkIsSuperAdmin(currentUser);

  const filteredItems = historyItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.nik || '').toLowerCase().includes(q) ||
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q) ||
      (item.terminationType || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteHistory(itemToDelete.id, itemToDelete.nik, itemToDelete.employeeName);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete calculation history', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-white/10 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIK, Nama Pekerja, atau Departemen..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-red-500 font-medium"
          />
        </div>

        <div className="text-xs text-slate-400 font-bold self-end sm:self-auto">
          Total Recorded: <strong className="text-white">{filteredItems.length}</strong> Simulasi
        </div>
      </div>

      {/* History Cards List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-white/10 rounded-2xl space-y-2">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">Belum ada histori simulasi pesangon tersimpan.</p>
          <p className="text-xs text-slate-500">
            Lakukan simulasi pada tab <span className="text-red-400 font-bold">Simulasi Baru</span> dan tekan simpan untuk merekam hasil.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-white/10 hover:border-red-500/40 rounded-xl p-4 space-y-3 shadow-lg transition-all"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-white">{item.employeeName}</h4>
                    <span className="px-2 py-0.2 text-[9px] font-bold bg-slate-800 text-slate-300 rounded border border-white/10 font-mono">
                      {item.nik}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.department} • {item.position}
                  </p>
                </div>

                <span className="px-2.5 py-1 text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/30 rounded-lg">
                  {item.terminationType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Masa Kerja</span>
                  <p className="font-bold text-slate-200 text-xs">{item.formattedServicePeriod}</p>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Hak PHK</span>
                  <p className="font-black text-emerald-400 text-xs">{formatRupiah(item.totalAmount)}</p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5">
                <span>Diperhitungkan: {new Date(item.calculatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} oleh {item.calculatedBy}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateSeverancePdf(item)}
                    title="Cetak PDF"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-red-400" />
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setItemToDelete(item)}
                      title="Hapus Record"
                      className="p-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg border border-red-500/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Hapus Record Simulasi"
        message={`Apakah Anda yakin ingin menghapus record simulasi pesangon untuk NIK ${itemToDelete?.nik} (${itemToDelete?.employeeName})? Tindakan ini akan dicatat dalam audit system.`}
        confirmText="Ya, Hapus Record"
        cancelText="Batal"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
