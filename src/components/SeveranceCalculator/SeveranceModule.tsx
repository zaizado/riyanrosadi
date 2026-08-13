import React, { useState } from 'react';
import { 
  Calculator, 
  History, 
  Table, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  FileSpreadsheet,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Member, UserAccount, checkIsSuperAdmin } from '../../types';
import { SeveranceCalculationInput, SeveranceCalculationResult, PkbRuleConfig, DEFAULT_PKB_RULE } from '../../types/severance';
import { calculateSeverance } from '../../utils/severanceCalculator';
import { selectActivePkbRule } from '../../utils/pkbRuleSelector';
import { EmployeeSearch } from './EmployeeSearch';
import { SeveranceForm } from './SeveranceForm';
import { SeveranceResultCard } from './SeveranceResultCard';
import { SeveranceHistory } from './SeveranceHistory';
import { SeveranceTableModal } from './SeveranceTableModal';
import { AdminRuleManagementModal } from './AdminRuleManagementModal';
import { SeveranceService } from '../../services/severanceService';
import { SectionHeader, PrimaryButton, SecondaryButton } from '../ui/DesignSystem';
import { getLocalDateISO } from '../../utils/dateUtils';

interface SeveranceModuleProps {
  members: Member[];
  historyItems: SeveranceCalculationResult[];
  currentUser: UserAccount;
  pkbRules?: PkbRuleConfig[];
}

export const SeveranceModule: React.FC<SeveranceModuleProps> = ({
  members,
  historyItems,
  currentUser,
  pkbRules = []
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'history' | 'rules'>('calculator');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [calcResult, setCalcResult] = useState<SeveranceCalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const [customActiveRule, setCustomActiveRule] = useState<PkbRuleConfig | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isSuperAdmin = checkIsSuperAdmin(currentUser);

  const getEffectiveRuleForDate = (dateStr: string): PkbRuleConfig => {
    if (customActiveRule) return customActiveRule;
    return selectActivePkbRule(pkbRules, dateStr);
  };

  const activeRule = getEffectiveRuleForDate(getLocalDateISO());

  const handleCalculate = (input: SeveranceCalculationInput) => {
    setCalcError(null);
    setIsSaved(false);

    const ruleToUse = getEffectiveRuleForDate(input.terminationDate);

    const res = calculateSeverance({
      ...input,
      pkbRule: ruleToUse,
      calculatedBy: currentUser.name
    });

    if (res.error) {
      setCalcError(res.error);
      setCalcResult(null);
    } else if (res.result) {
      setCalcResult(res.result);
    }
  };

  const handleSaveHistory = async (result: SeveranceCalculationResult) => {
    setIsSaving(true);
    try {
      await SeveranceService.saveCalculation(result, currentUser);
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save calculation history', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHistory = async (id: string, nik: string, employeeName: string) => {
    await SeveranceService.deleteCalculation(id, nik, employeeName, currentUser);
  };

  const handleReset = () => {
    setSelectedMember(null);
    setCalcResult(null);
    setCalcError(null);
    setIsSaved(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-900/60 border border-red-500/40 rounded-full text-[10px] font-black uppercase tracking-widest text-red-300 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              MODUL RESMI SBN KASBI PT VCI
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              SIMULASI PESANGON &amp; HAK PHK
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Kalkulator terintegrasi database pekerja &amp; acuan Perjanjian Kerja Bersama (PKB) PT Victory Chingluh Indonesia Pasal 77.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => setShowTableModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Table className="w-4 h-4 text-amber-400" />
              Tabel Pasal 77
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setShowAdminModal(true)}
                className="px-3.5 py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Aturan PKB
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 space-x-1 sm:space-x-3 text-xs font-black uppercase tracking-wider overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-3 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'calculator'
              ? 'bg-red-950/80 text-white border-red-500 shadow-lg'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          <Calculator className="w-4 h-4 text-red-500" />
          Simulasi Baru
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'history'
              ? 'bg-red-950/80 text-white border-red-500 shadow-lg'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4 text-amber-400" />
          Histori Simulasi ({historyItems.length})
        </button>
      </div>

      {/* TAB CONTENT: CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          {/* Step 1: Employee Search */}
          <EmployeeSearch
            members={members}
            onSelectMember={(member) => {
              setSelectedMember(member);
              setCalcResult(null);
              setCalcError(null);
            }}
            selectedMember={selectedMember}
            terminationDate={getLocalDateISO()}
          />

          {/* Step 2: Form */}
          {selectedMember && !calcResult && (
            <SeveranceForm
              selectedMember={selectedMember}
              onCalculate={handleCalculate}
              calculatedBy={currentUser.name}
            />
          )}

          {/* Error Banner */}
          {calcError && (
            <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-200 text-xs animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-red-300">Gagal Memproses Perhitungan</p>
                <p className="mt-1">{calcError}</p>
              </div>
            </div>
          )}

          {/* Step 3: Result Display */}
          {calcResult && (
            <SeveranceResultCard
              calc={calcResult}
              onSaveHistory={handleSaveHistory}
              onReset={handleReset}
              isSaving={isSaving}
              isSaved={isSaved}
            />
          )}
        </div>
      )}

      {/* TAB CONTENT: HISTORY */}
      {activeTab === 'history' && (
        <SeveranceHistory
          historyItems={historyItems}
          onDeleteHistory={handleDeleteHistory}
          currentUser={currentUser}
        />
      )}

      {/* MODALS */}
      <SeveranceTableModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        baseSalary={selectedMember?.upahPokok || 5000000}
      />

      <AdminRuleManagementModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        activeRule={activeRule}
        onRuleUpdated={(updated) => setCustomActiveRule(updated)}
        currentUser={currentUser}
      />
    </div>
  );
};
