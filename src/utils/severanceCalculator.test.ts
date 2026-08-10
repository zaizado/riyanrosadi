import { describe, it, expect } from 'vitest';
import { calculateSeverance, getSeveranceMonths, getUPMKMonths } from './severanceCalculator';
import { calculateServicePeriod } from './servicePeriodCalculator';

describe('Severance Calculator Unit Tests (PKB PT VCI)', () => {
  const wage = 5000000; // Rp 5.000.000

  // Test 1: Masa kerja 1 tahun
  it('Test 1: Masa kerja 1 tahun (2025-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2025-01-01', '2026-01-01');
    expect(period.years).toBe(1);

    const sevMonths = getSeveranceMonths(period.years);
    const upmkMonths = getUPMKMonths(period.years);

    expect(sevMonths).toBe(2);
    expect(upmkMonths).toBe(0);
  });

  // Test 2: Masa kerja 4 tahun
  it('Test 2: Masa kerja 4 tahun (2022-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2022-01-01', '2026-01-01');
    expect(period.years).toBe(4);

    const sevMonths = getSeveranceMonths(period.years);
    const upmkMonths = getUPMKMonths(period.years);

    expect(sevMonths).toBe(5);
    expect(upmkMonths).toBe(2);

    const res = calculateSeverance({
      nik: '12345',
      memberId: 'm1',
      employeeName: 'Ahmad',
      department: 'Cutting',
      position: 'Operator',
      hireDate: '2022-01-01',
      terminationDate: '2026-01-01',
      baseSalary: wage,
      fixedAllowance: 0,
      terminationTypeId: 'efisiensi', // 2x pesangon, 1x upmk, 15% UPH
      calculatedBy: 'Admin'
    });

    expect(res.error).toBeUndefined();
    const result = res.result!;
    expect(result.severanceMonths).toBe(5);
    expect(result.severanceAmount).toBe(50000000); // 5 * 5M * 2 = 50M
    expect(result.upmkMonths).toBe(2);
    expect(result.upmkAmount).toBe(10000000); // 2 * 5M * 1 = 10M
    expect(result.uph15Amount).toBe(9000000); // 15% * (50M + 10M) = 9M
    expect(result.totalAmount).toBe(69000000); // 50M + 10M + 9M = 69M
  });

  // Test 3: Masa kerja 8 tahun
  it('Test 3: Masa kerja 8 tahun (2018-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2018-01-01', '2026-01-01');
    expect(period.years).toBe(8);

    const sevMonths = getSeveranceMonths(period.years);
    const upmkMonths = getUPMKMonths(period.years);

    expect(sevMonths).toBe(9);
    expect(upmkMonths).toBe(3); // 6 - < 9 tahun is 3 months
  });

  // Test 4: Masa kerja 20 tahun
  it('Test 4: Masa kerja 20 tahun (2006-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2006-01-01', '2026-01-01');
    expect(period.years).toBe(20);

    const sevMonths = getSeveranceMonths(period.years);
    const upmkMonths = getUPMKMonths(period.years);

    expect(sevMonths).toBe(9);
    expect(upmkMonths).toBe(7); // 18 - < 21 tahun is 7 months
  });

  // Test 5: Tanggal PHK sebelum tanggal masuk -> ERROR
  it('Test 5: Tanggal PHK sebelum tanggal masuk returns error', () => {
    const res = calculateSeverance({
      nik: '12345',
      memberId: 'm1',
      employeeName: 'Budi',
      department: 'Sewing',
      position: 'Operator',
      hireDate: '2026-01-01',
      terminationDate: '2022-01-01', // Before hire date!
      baseSalary: wage,
      fixedAllowance: 0,
      terminationTypeId: 'efisiensi',
      calculatedBy: 'Admin'
    });

    expect(res.error).toBe('Tanggal PHK tidak boleh lebih awal dari tanggal masuk kerja.');
    expect(res.result).toBeUndefined();
  });

  // Test 6: NIK tidak diisi / kosong -> ERROR
  it('Test 6: NIK kosong returns error', () => {
    const res = calculateSeverance({
      nik: '',
      memberId: '',
      employeeName: '',
      department: '',
      position: '',
      hireDate: '2022-01-01',
      terminationDate: '2026-01-01',
      baseSalary: wage,
      fixedAllowance: 0,
      terminationTypeId: 'efisiensi',
      calculatedBy: 'Admin'
    });

    expect(res.error).toBe('NIK pekerja wajib diisi.');
  });

  // Test 7: Jenis PHK dengan faktor 2× -> Hanya pesangon yang dikalikan 2×, UPMK tetap 1×
  it('Test 7: Jenis PHK 2x multiplies only severance, not UPMK', () => {
    const res = calculateSeverance({
      nik: '99999',
      memberId: 'm2',
      employeeName: 'Cici',
      department: 'Quality',
      position: 'Inspector',
      hireDate: '2022-01-01',
      terminationDate: '2026-01-01', // 4 years
      baseSalary: 10000000, // 10M
      fixedAllowance: 0,
      terminationTypeId: 'efisiensi', // 2x pesangon, 1x upmk
      calculatedBy: 'Admin'
    });

    const result = res.result!;
    expect(result.severanceMultiplier).toBe(2);
    expect(result.upmkMultiplier).toBe(1);

    // Severance base: 5 months * 10M = 50M -> Multiplied by 2 = 100M
    expect(result.severanceBaseAmount).toBe(50000000);
    expect(result.severanceAmount).toBe(100000000);

    // UPMK base: 2 months * 10M = 20M -> Multiplied by 1 = 20M
    expect(result.upmkBaseAmount).toBe(20000000);
    expect(result.upmkAmount).toBe(20000000);
  });
});
