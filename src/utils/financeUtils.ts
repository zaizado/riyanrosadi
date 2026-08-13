import { FinanceDailyRecord } from '../types';

export const parseRupiahNum = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export interface CascadedFinanceRecordInfo {
  record: FinanceDailyRecord;
  calculatedSaldoAwal: number;
  calculatedTotalPengeluaran: number;
  calculatedSaldoAkhir: number;
}

export interface FinanceSummaryResult {
  sortedRecordsAsc: FinanceDailyRecord[];
  cascadedMap: Map<string, CascadedFinanceRecordInfo>;
  initialSaldoAwal: number;
  totalPemasukanCos: number;
  totalPengeluaran: number;
  saldoAkhir: number;
}

/**
 * Single source of truth function to calculate finance balance and summary
 * across Finance, Dashboard, Reports, PDF, and Exports.
 */
export function calculateFinanceSummary(records: FinanceDailyRecord[] = []): FinanceSummaryResult {
  const sortedRecordsAsc = [...records].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

  const cascadedMap = new Map<string, CascadedFinanceRecordInfo>();

  let totalPemasukanCos = 0;
  let totalPengeluaran = 0;
  let initialSaldoAwal = 0;
  let currentSaldo = 0;

  if (sortedRecordsAsc.length > 0) {
    initialSaldoAwal = parseRupiahNum(sortedRecordsAsc[0].saldoAwal);
    currentSaldo = initialSaldoAwal;
  }

  sortedRecordsAsc.forEach((rec, idx) => {
    let saldoAwal = parseRupiahNum(rec.saldoAwal);
    if (idx > 0) {
      saldoAwal = currentSaldo;
    }

    const uangCos = parseRupiahNum(rec.uangCosMasuk);
    const itemExpenses = (rec.pengeluaranItems || []).reduce(
      (sum, item) => sum + parseRupiahNum(item.nominal),
      0
    );

    totalPemasukanCos += uangCos;
    totalPengeluaran += itemExpenses;

    const saldoAkhir = saldoAwal + uangCos - itemExpenses;

    cascadedMap.set(rec.id, {
      record: rec,
      calculatedSaldoAwal: saldoAwal,
      calculatedTotalPengeluaran: itemExpenses,
      calculatedSaldoAkhir: saldoAkhir
    });

    currentSaldo = saldoAkhir;
  });

  return {
    sortedRecordsAsc,
    cascadedMap,
    initialSaldoAwal,
    totalPemasukanCos,
    totalPengeluaran,
    saldoAkhir: currentSaldo
  };
}
