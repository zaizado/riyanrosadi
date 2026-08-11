export interface SeveranceBracket {
  minYears: number;
  maxYears: number; // Use 999 for infinity (e.g. >= 8 or >= 24)
  months: number;
  label?: string;
}

export interface UpmkBracket {
  minYears: number;
  maxYears: number;
  months: number;
  label?: string;
}

export interface TerminationTypeConfig {
  id: string;
  typeName: string;
  severanceMultiplier: number;
  upmkMultiplier: number;
  uphEligible15: boolean;
  notes?: string;
  isSpecialRule?: boolean;
}

export interface PkbRuleConfig {
  id: string;
  versionName: string;
  effectiveFrom: string;
  effectiveUntil: string;
  isActive: boolean;
  severanceTable: SeveranceBracket[];
  upmkTable: UpmkBracket[];
  terminationTypesConfig: TerminationTypeConfig[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ServicePeriodResult {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  formattedText: string;
  error?: string;
}

export interface SeveranceCalculationInput {
  nik: string;
  memberId: string;
  employeeName: string;
  department: string;
  position: string;
  hireDate: string; // YYYY-MM-DD
  terminationDate: string; // YYYY-MM-DD
  baseSalary: number;
  fixedAllowance: number;
  isManualSalaryInput?: boolean;
  terminationTypeId: string;
  unusedLeaveDays?: number;
  manualUnusedLeaveAmount?: number;
  returnTravelAmount?: number;
  otherCompensation?: number;
  uphEligible15Override?: boolean;
  notes?: string;
  calculatedBy: string;
  pkbRule?: PkbRuleConfig;
}

export interface SeveranceCalculationResult {
  id: string;
  nik: string;
  memberId: string;
  employeeName: string;
  department: string;
  position: string;
  hireDate: string;
  terminationDate: string;
  yearsOfService: number;
  monthsOfService: number;
  daysOfService: number;
  formattedServicePeriod: string;
  
  baseSalary: number;
  fixedAllowance: number;
  calculationBase: number;
  isManualSalaryInput: boolean;
  
  terminationType: string;
  terminationTypeId: string;
  
  severanceMonths: number;
  severanceMultiplier: number;
  severanceBaseAmount: number;
  severanceAmount: number;
  
  upmkMonths: number;
  upmkMultiplier: number;
  upmkBaseAmount: number;
  upmkAmount: number;
  
  uphEligible15: boolean;
  uph15Amount: number;
  
  unusedLeaveDays: number;
  unusedLeaveAmount: number;
  returnTravelAmount: number;
  otherCompensation: number;
  totalUphAmount: number;
  
  totalAmount: number;
  
  pkbVersion: string;
  calculatedAt: string;
  calculatedBy: string;
  notes?: string;
}

export const DEFAULT_SEVERANCE_BRACKETS: SeveranceBracket[] = [
  { minYears: 0, maxYears: 1, months: 1, label: '< 1 Tahun' },
  { minYears: 1, maxYears: 2, months: 2, label: '1 - < 2 Tahun' },
  { minYears: 2, maxYears: 3, months: 3, label: '2 - < 3 Tahun' },
  { minYears: 3, maxYears: 4, months: 4, label: '3 - < 4 Tahun' },
  { minYears: 4, maxYears: 5, months: 5, label: '4 - < 5 Tahun' },
  { minYears: 5, maxYears: 6, months: 6, label: '5 - < 6 Tahun' },
  { minYears: 6, maxYears: 7, months: 7, label: '6 - < 7 Tahun' },
  { minYears: 7, maxYears: 8, months: 8, label: '7 - < 8 Tahun' },
  { minYears: 8, maxYears: 999, months: 9, label: '≥ 8 Tahun' },
];

export const DEFAULT_UPMK_BRACKETS: UpmkBracket[] = [
  { minYears: 0, maxYears: 3, months: 0, label: '< 3 Tahun' },
  { minYears: 3, maxYears: 6, months: 2, label: '3 - < 6 Tahun' },
  { minYears: 6, maxYears: 9, months: 3, label: '6 - < 9 Tahun' },
  { minYears: 9, maxYears: 12, months: 4, label: '9 - < 12 Tahun' },
  { minYears: 12, maxYears: 15, months: 5, label: '12 - < 15 Tahun' },
  { minYears: 15, maxYears: 18, months: 6, label: '15 - < 18 Tahun' },
  { minYears: 18, maxYears: 21, months: 7, label: '18 - < 21 Tahun' },
  { minYears: 21, maxYears: 24, months: 8, label: '21 - < 24 Tahun' },
  { minYears: 24, maxYears: 999, months: 10, label: '≥ 24 Tahun' },
];

export const DEFAULT_TERMINATION_TYPES: TerminationTypeConfig[] = [
  {
    id: 'efisiensi',
    typeName: 'Efisiensi / Penutupan Perusahaan (Bukan Kerugian)',
    severanceMultiplier: 2,
    upmkMultiplier: 1,
    uphEligible15: true,
    notes: '2× Uang Pesangon, 1× UPMK, UPH 15% sesuai Pasal 77 PKB'
  },
  {
    id: 'pensiun',
    typeName: 'Pensiun (Memasuki Usia Pensiun)',
    severanceMultiplier: 2,
    upmkMultiplier: 1,
    uphEligible15: true,
    notes: '2× Uang Pesangon, 1× UPMK, UPH 15% sesuai Pasal 77 PKB'
  },
  {
    id: 'sakit_berkepanjangan',
    typeName: 'Sakit Berkepanjangan (>12 Bulan) / Cacat Akibat Kerja',
    severanceMultiplier: 2,
    upmkMultiplier: 1,
    uphEligible15: true,
    notes: '2× Uang Pesangon, 1× UPMK, UPH 15%'
  }
];

export const DEFAULT_PKB_RULE: PkbRuleConfig = {
  id: 'pkb_2024_2026',
  versionName: 'PKB PT VCI 2024-2026',
  effectiveFrom: '2024-01-01',
  effectiveUntil: '2026-12-31',
  isActive: true,
  severanceTable: DEFAULT_SEVERANCE_BRACKETS,
  upmkTable: DEFAULT_UPMK_BRACKETS,
  terminationTypesConfig: DEFAULT_TERMINATION_TYPES,
  updatedAt: new Date().toISOString(),
  updatedBy: 'SBN KASBI System'
};
