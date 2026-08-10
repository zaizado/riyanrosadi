import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, AlertTriangle, DollarSign, FileText, ChevronDown, Check } from 'lucide-react';
import { Member } from '../../types';
import { DEFAULT_TERMINATION_TYPES, SeveranceCalculationInput, TerminationTypeConfig } from '../../types/severance';
import { parseRupiahNum, formatRupiah } from '../../utils/currencyFormatter';

interface SeveranceFormProps {
  selectedMember: Member;
  onCalculate: (input: SeveranceCalculationInput) => void;
  calculatedBy: string;
}

export const SeveranceForm: React.FC<SeveranceFormProps> = ({
  selectedMember,
  onCalculate,
  calculatedBy
}) => {
  const today = new Date().toISOString().slice(0, 10);

  const [terminationDate, setTerminationDate] = useState(today);
  const [terminationTypeId, setTerminationTypeId] = useState<string>('efisiensi');
  
  const initialBaseSalary = selectedMember.upahPokok || 5000000;
  const initialFixedAllowance = selectedMember.tunjanganTetap || 0;

  const [baseSalary, setBaseSalary] = useState<number>(initialBaseSalary);
  const [fixedAllowance, setFixedAllowance] = useState<number>(initialFixedAllowance);
  const [isManualSalary, setIsManualSalary] = useState<boolean>(!selectedMember.upahPokok);

  const [unusedLeaveDays, setUnusedLeaveDays] = useState<number>(0);
  const [returnTravelAmount, setReturnTravelAmount] = useState<number>(0);
  const [otherCompensation, setOtherCompensation] = useState<number>(0);

  useEffect(() => {
    if (selectedMember) {
      if (selectedMember.upahPokok && selectedMember.upahPokok > 0) {
        setBaseSalary(selectedMember.upahPokok);
        setIsManualSalary(false);
      } else {
        setIsManualSalary(true);
      }
      if (selectedMember.tunjanganTetap !== undefined) {
        setFixedAllowance(selectedMember.tunjanganTetap);
      }
    }
  }, [selectedMember]);

  const selectedTermConfig = DEFAULT_TERMINATION_TYPES.find(t => t.id === terminationTypeId) || DEFAULT_TERMINATION_TYPES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: SeveranceCalculationInput = {
      nik: selectedMember.nik,
      memberId: selectedMember.id,
      employeeName: selectedMember.namaLengkap,
      department: selectedMember.departemen,
      position: selectedMember.bagian || selectedMember.jabatanKerja || '-',
      hireDate: selectedMember.tanggalBergabung,
      terminationDate,
      baseSalary,
      fixedAllowance,
      isManualSalaryInput: isManualSalary,
      terminationTypeId,
      unusedLeaveDays,
      returnTravelAmount,
      otherCompensation,
      notes: '',
      calculatedBy
    };

    onCalculate(input);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Calculator className="w-4 h-4 text-red-500" />
          2. PARAMETER PERHITUNGAN PHK &amp; UPAH
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Lengkapi variabel tanggal PHK, jenis alasan pemutusan hubungan kerja, serta komponen upah dasar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tanggal PHK */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-red-400" />
            Tanggal Simulasi PHK <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={terminationDate}
            onChange={(e) => setTerminationDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 font-medium"
          />
          <p className="text-[10px] text-slate-400">
            Tanggal resmi pengakhiran hubungan kerja untuk menghitung kalkulasi masa kerja.
          </p>
        </div>

        {/* Jenis PHK Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-red-400" />
            Jenis / Alasan PHK <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={terminationTypeId}
              onChange={(e) => setTerminationTypeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 font-medium appearance-none cursor-pointer pr-10"
            >
              {DEFAULT_TERMINATION_TYPES.map((type) => (
                <option key={type.id} value={type.id} className="bg-slate-900 text-white">
                  {type.typeName} ({type.severanceMultiplier}x UP, {type.upmkMultiplier}x UPMK)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Info Badge Multiplier Selected */}
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-white/5 text-[11px] text-slate-300 flex items-center justify-between">
            <span className="font-bold text-red-400">
              Multiplier: {selectedTermConfig.severanceMultiplier}x Pesangon | {selectedTermConfig.upmkMultiplier}x UPMK
            </span>
            <span className="text-[10px] text-slate-400">
              UPH 15%: {selectedTermConfig.uphEligible15 ? 'Berhak (15%)' : 'Tidak Berhak'}
            </span>
          </div>
        </div>

        {/* Upah Pokok Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Upah Pokok (Rp) <span className="text-red-500">*</span>
            </span>
            {isManualSalary && (
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                Input Manual
              </span>
            )}
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={baseSalary || ''}
            onChange={(e) => {
              setBaseSalary(parseFloat(e.target.value) || 0);
              setIsManualSalary(true);
            }}
            placeholder="Contoh: 5000000"
            required
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
          />
          <p className="text-[10px] text-slate-400">
            Terbilang: <strong className="text-emerald-400">{formatRupiah(baseSalary)}</strong>
          </p>
        </div>

        {/* Tunjangan Tetap Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Tunjangan Tetap (Rp)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={fixedAllowance || ''}
            onChange={(e) => setFixedAllowance(parseFloat(e.target.value) || 0)}
            placeholder="Contoh: 500000 (Jika ada)"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
          />
          <p className="text-[10px] text-slate-400">
            Total Upah Dasar Perhitungan: <strong className="text-emerald-300">{formatRupiah(baseSalary + fixedAllowance)}</strong>
          </p>
        </div>

        {/* Sisa Cuti Tahunan */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Sisa Cuti Tahunan (Hari)
          </label>
          <input
            type="number"
            min="0"
            max="60"
            value={unusedLeaveDays || ''}
            onChange={(e) => setUnusedLeaveDays(parseInt(e.target.value) || 0)}
            placeholder="Sisa cuti belum diambil (0 - 60)"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 font-bold"
          />
          <p className="text-[10px] text-slate-400">
            Kalkulasi cuti: (Sisa Cuti / 21) × Upah Dasar = <strong className="text-slate-200">{formatRupiah((unusedLeaveDays / 21) * (baseSalary + fixedAllowance))}</strong>
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl hover:shadow-red-900/50 transition-all cursor-pointer flex items-center justify-center gap-3 border border-red-400/40 glow-red-sm"
        >
          <Calculator className="w-5 h-5 animate-pulse" />
          PROSES PERHITUNGAN HAK PESANGON
        </button>
      </div>
    </form>
  );
};
