import {
  SeveranceCalculationInput,
  SeveranceCalculationResult,
  PkbRuleConfig,
  DEFAULT_PKB_RULE,
  DEFAULT_TERMINATION_TYPES,
} from '../types/severance';
import { calculateServicePeriod } from './servicePeriodCalculator';

export function getSeveranceMonths(yearsOfService: number, rule: PkbRuleConfig = DEFAULT_PKB_RULE): number {
  const table = rule.severanceTable || DEFAULT_PKB_RULE.severanceTable;
  const match = table.find(
    (bracket) => yearsOfService >= bracket.minYears && yearsOfService < bracket.maxYears
  );
  if (match) return match.months;
  
  // Fallback for >= 8 years if table end is reached
  if (yearsOfService >= 8) return 9;
  return 1;
}

export function getUPMKMonths(yearsOfService: number, rule: PkbRuleConfig = DEFAULT_PKB_RULE): number {
  const table = rule.upmkTable || DEFAULT_PKB_RULE.upmkTable;
  const match = table.find(
    (bracket) => yearsOfService >= bracket.minYears && yearsOfService < bracket.maxYears
  );
  if (match) return match.months;

  if (yearsOfService >= 24) return 10;
  return 0;
}

export function calculateSeverance(
  input: SeveranceCalculationInput
): { result?: SeveranceCalculationResult; error?: string } {
  // 1. Validation
  if (!input.nik || input.nik.trim() === '') {
    return { error: 'NIK pekerja wajib diisi.' };
  }

  if (!input.hireDate) {
    return { error: 'Tanggal masuk kerja wajib diisi.' };
  }

  if (!input.terminationDate) {
    return { error: 'Tanggal PHK/simulasi wajib diisi.' };
  }

  const period = calculateServicePeriod(input.hireDate, input.terminationDate);
  if (period.error) {
    return { error: period.error };
  }

  const baseSalary = Math.max(0, input.baseSalary || 0);
  const fixedAllowance = Math.max(0, input.fixedAllowance || 0);
  const calculationBase = baseSalary + fixedAllowance;

  if (calculationBase <= 0) {
    return { error: 'Upah dasar perhitungan (Upah Pokok + Tunjangan Tetap) harus lebih besar dari Rp 0.' };
  }

  const rule = input.pkbRule || DEFAULT_PKB_RULE;
  const termTypes = rule.terminationTypesConfig || DEFAULT_TERMINATION_TYPES;
  const termConfig = termTypes.find((t) => t.id === input.terminationTypeId);

  if (!termConfig) {
    return { error: 'Jenis PHK belum dipilih atau tidak valid.' };
  }

  // 2. Base Months
  const severanceMonths = getSeveranceMonths(period.years, rule);
  const upmkMonths = getUPMKMonths(period.years, rule);

  // 3. Multipliers
  const severanceMultiplier = termConfig.severanceMultiplier;
  const upmkMultiplier = termConfig.upmkMultiplier;

  // 4. Severance & UPMK amounts
  const severanceBaseAmount = severanceMonths * calculationBase;
  const severanceAmount = severanceBaseAmount * severanceMultiplier;

  const upmkBaseAmount = upmkMonths * calculationBase;
  const upmkAmount = upmkBaseAmount * upmkMultiplier;

  // 5. UPH 15% Calculation
  const uphEligible15 = input.uphEligible15Override !== undefined
    ? input.uphEligible15Override
    : termConfig.uphEligible15;

  // UPH 15% is 15% of (Actual Severance Amount + Actual UPMK Amount)
  const uph15Amount = uphEligible15 ? 0.15 * (severanceAmount + upmkAmount) : 0;

  // 6. Unused Leave & Other UPH Components
  const unusedLeaveDays = Math.max(0, input.unusedLeaveDays || 0);
  let unusedLeaveAmount = 0;
  if (input.manualUnusedLeaveAmount !== undefined && input.manualUnusedLeaveAmount > 0) {
    unusedLeaveAmount = input.manualUnusedLeaveAmount;
  } else if (unusedLeaveDays > 0) {
    // Standard daily rate: calculationBase / 21
    unusedLeaveAmount = Math.round((unusedLeaveDays / 21) * calculationBase);
  }

  const returnTravelAmount = Math.max(0, input.returnTravelAmount || 0);
  const otherCompensation = Math.max(0, input.otherCompensation || 0);

  const totalUphAmount = uph15Amount + unusedLeaveAmount + returnTravelAmount + otherCompensation;

  // 7. Total Amount
  const totalAmount = severanceAmount + upmkAmount + totalUphAmount;

  const result: SeveranceCalculationResult = {
    id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nik: input.nik.trim(),
    memberId: input.memberId || '',
    employeeName: input.employeeName || 'Pekerja',
    department: input.department || '-',
    position: input.position || '-',
    hireDate: input.hireDate,
    terminationDate: input.terminationDate,
    yearsOfService: period.years,
    monthsOfService: period.months,
    daysOfService: period.days,
    formattedServicePeriod: period.formattedText,

    baseSalary,
    fixedAllowance,
    calculationBase,
    isManualSalaryInput: Boolean(input.isManualSalaryInput),

    terminationType: termConfig.typeName,
    terminationTypeId: termConfig.id,

    severanceMonths,
    severanceMultiplier,
    severanceBaseAmount,
    severanceAmount,

    upmkMonths,
    upmkMultiplier,
    upmkBaseAmount,
    upmkAmount,

    uphEligible15,
    uph15Amount,

    unusedLeaveDays,
    unusedLeaveAmount,
    returnTravelAmount,
    otherCompensation,
    totalUphAmount,

    totalAmount,

    pkbVersion: rule.versionName || DEFAULT_PKB_RULE.versionName,
    calculatedAt: new Date().toISOString(),
    calculatedBy: input.calculatedBy || 'Pengurus SBN KASBI',
    notes: input.notes || termConfig.notes || ''
  };

  return { result };
}
