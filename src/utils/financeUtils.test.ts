import { describe, it, expect } from 'vitest';
import { calculateFinanceSummary } from './financeUtils';
import { FinanceDailyRecord } from '../types';

describe('financeUtils - Single Source of Truth Balance Calculation', () => {
  it('should accurately calculate ending balance with initial balance, income, and expenses', () => {
    // Test case: Saldo awal Rp10.000.000, Pemasukan Rp2.000.000, Pengeluaran Rp1.000.000 => Saldo akhir Rp11.000.000
    const records: FinanceDailyRecord[] = [
      {
        id: 'rec-1',
        tanggal: '2026-08-01',
        saldoAwal: 10000000,
        uangCosMasuk: 2000000,
        keteranganCos: 'COS Agustus',
        pengeluaranItems: [
          { id: 'e1', waktu: '09:00', keterangan: 'Atk', nominal: 1000000, kategori: 'Operasional' }
        ],
        catatanHarian: 'Catatan',
        updatedBy: 'admin',
        updatedAt: '2026-08-01'
      }
    ];

    const summary = calculateFinanceSummary(records);

    expect(summary.initialSaldoAwal).toBe(10000000);
    expect(summary.totalPemasukanCos).toBe(2000000);
    expect(summary.totalPengeluaran).toBe(1000000);
    expect(summary.saldoAkhir).toBe(11000000);
  });

  it('should handle cascading balances across multiple chronological records', () => {
    const records: FinanceDailyRecord[] = [
      {
        id: 'rec-2',
        tanggal: '2026-08-02',
        saldoAwal: 0, // Should be overridden by previous day's ending balance
        uangCosMasuk: 500000,
        pengeluaranItems: [{ id: 'e2', waktu: '10:00', keterangan: 'Snack', nominal: 200000, kategori: 'Rapat' }],
        catatanHarian: '',
        updatedBy: 'admin',
        updatedAt: '2026-08-02'
      },
      {
        id: 'rec-1',
        tanggal: '2026-08-01',
        saldoAwal: 5000000,
        uangCosMasuk: 1000000,
        pengeluaranItems: [{ id: 'e1', waktu: '08:00', keterangan: 'Bensin', nominal: 300000, kategori: 'Transport' }],
        catatanHarian: '',
        updatedBy: 'admin',
        updatedAt: '2026-08-01'
      }
    ];

    const summary = calculateFinanceSummary(records);

    // Day 1 (2026-08-01): SaldoAwal 5.000.000 + 1.000.000 - 300.000 = 5.700.000
    // Day 2 (2026-08-02): SaldoAwal 5.700.000 + 500.000 - 200.000 = 6.000.000
    expect(summary.initialSaldoAwal).toBe(5000000);
    expect(summary.totalPemasukanCos).toBe(1500000);
    expect(summary.totalPengeluaran).toBe(500000);
    expect(summary.saldoAkhir).toBe(6000000);
  });

  it('should return 0 for empty records array', () => {
    const summary = calculateFinanceSummary([]);
    expect(summary.initialSaldoAwal).toBe(0);
    expect(summary.totalPemasukanCos).toBe(0);
    expect(summary.totalPengeluaran).toBe(0);
    expect(summary.saldoAkhir).toBe(0);
  });
});
