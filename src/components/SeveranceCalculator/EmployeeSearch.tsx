import React, { useState } from 'react';
import { Search, UserCheck, AlertCircle, RefreshCw, Briefcase, Calendar, Building, DollarSign } from 'lucide-react';
import { Member } from '../../types';
import { calculateServicePeriod } from '../../utils/servicePeriodCalculator';
import { getLocalDateISO } from '../../utils/dateUtils';
import { formatRupiah } from '../../utils/currencyFormatter';

interface EmployeeSearchProps {
  members: Member[];
  onSelectMember: (member: Member | null) => void;
  selectedMember: Member | null;
  terminationDate: string;
}

export const EmployeeSearch: React.FC<EmployeeSearchProps> = ({
  members,
  onSelectMember,
  selectedMember,
  terminationDate
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim().toLowerCase();

    if (!query) {
      setSearchError('Silakan masukkan NIK atau nama pekerja terlebih dahulu.');
      setIsSearched(true);
      return;
    }

    setSearchError(null);
    setIsSearched(true);

    // Matching logic for NIK or Name
    const found = members.find((m) => {
      const nikClean = (m.nik || '').toString().toLowerCase().trim();
      const namaClean = (m.namaLengkap || '').toLowerCase().trim();
      const noAnggota = (m.nomorAnggota || '').toLowerCase().trim();

      return (
        nikClean === query ||
        nikClean.endsWith(query) ||
        namaClean.includes(query) ||
        noAnggota === query
      );
    });

    if (found) {
      onSelectMember(found);
    } else {
      onSelectMember(null);
      setSearchError(`Pekerja dengan NIK/Nama "${searchInput}" tidak ditemukan dalam database keanggotaan.`);
    }
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchError(null);
    setIsSearched(false);
    onSelectMember(null);
  };

  const currentPeriod = selectedMember
    ? calculateServicePeriod(selectedMember.tanggalBergabung, terminationDate || getLocalDateISO())
    : null;

  const hasSalaryData = selectedMember && ((selectedMember.upahPokok && selectedMember.upahPokok > 0) || (selectedMember.tunjanganTetap && selectedMember.tunjanganTetap > 0));

  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-red-500" />
            1. PENCARIAN DATA PEKERJA DARI DATABASE
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cari berdasarkan NIK Karyawan atau Nama Lengkap untuk otomatis memuat profil &amp; masa kerja.
          </p>
        </div>

        {selectedMember && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cari Pekerja Lain
          </button>
        )}
      </div>

      {/* Search Input Form */}
      {!selectedMember && (
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Masukkan NIK Karyawan (contoh: 00123) atau Nama Pekerja..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              CARI PEKERJA
            </button>
          </div>

          {searchError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{searchError}</p>
                <p className="text-red-400/80 text-[11px] mt-0.5">
                  Pastikan NIK/Nama yang dimasukkan sudah terdaftar di menu <span className="font-bold text-white">Data Anggota</span>.
                </p>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Found Member Profile Display Card */}
      {selectedMember && (
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 sm:p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white">{selectedMember.namaLengkap}</h4>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-full uppercase">
                    Terverifikasi
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>NIK: <strong className="text-slate-200">{selectedMember.nik}</strong></span>
                  <span>•</span>
                  <span>No. Anggota: <strong className="text-slate-200">{selectedMember.nomorAnggota}</strong></span>
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-red-400 font-bold underline cursor-pointer self-end sm:self-auto"
            >
              Ganti Pekerja
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Building className="w-3 h-3 text-red-400" /> Departemen
              </span>
              <p className="font-bold text-slate-100 truncate">{selectedMember.departemen || '-'}</p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-red-400" /> Bagian / Jabatan
              </span>
              <p className="font-bold text-slate-100 truncate">{selectedMember.bagian || selectedMember.jabatanKerja || '-'}</p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-red-400" /> Tgl Masuk Kerja
              </span>
              <p className="font-bold text-slate-100">
                {selectedMember.tanggalBergabung 
                  ? new Date(selectedMember.tanggalBergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
                  : '-'}
              </p>
            </div>

            <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> Masa Kerja Efektif
              </span>
              <p className="font-black text-emerald-300">
                {currentPeriod ? currentPeriod.formattedText : '-'}
              </p>
            </div>
          </div>

          {/* Salary warning banner if salary is 0/missing */}
          {!hasSalaryData && (
            <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Data upah pokok &amp; tunjangan tetap belum tercatat di database master anggota.</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Anda dapat memasukkan nominal upah secara manual pada formulir perhitungan di bawah ini untuk keperluan simulasi.
                </p>
              </div>
            </div>
          )}

          {hasSalaryData && (
            <div className="p-3 bg-slate-900/90 border border-white/10 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Upah Dasar Master: <strong className="text-emerald-400 ml-1">{formatRupiah((selectedMember.upahPokok || 0) + (selectedMember.tunjanganTetap || 0))}</strong>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-white/10">
                Upah Pokok: {formatRupiah(selectedMember.upahPokok)} | Tunjangan: {formatRupiah(selectedMember.tunjanganTetap)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
