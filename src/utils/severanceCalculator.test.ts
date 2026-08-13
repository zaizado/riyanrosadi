import { describe, it, expect } from 'vitest';
import { calculateSeverance, getSeveranceMonths, getUPMKMonths } from './severanceCalculator';
import { calculateServicePeriod } from './servicePeriodCalculator';

describe('Severance Calculator Unit Tests (PKB PT VCI)', () => {
  const wage = 5000000; // Rp 5.000.000

  // Test 1: Masa kerja 1 hari setelah tanggal masuk
  it('1 day after hire date (2024-01-01 to 2024-01-02)', () => {
    const period = calculateServicePeriod('2024-01-01', '2024-01-02');
    expect(period.years).toBe(0);
    expect(period.months).toBe(0);
    expect(period.days).toBe(1);
  });

  // Test 2: Tepat 1 tahun
  it('Exactly 1 year (2025-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2025-01-01', '2026-01-01');
    expect(period.years).toBe(1);
    expect(period.months).toBe(0);
    expect(period.days).toBe(0);

    const sevMonths = getSeveranceMonths(period.years);
    const upmkMonths = getUPMKMonths(period.years);

    expect(sevMonths).toBe(2);
    expect(upmkMonths).toBe(0);
  });

  // Test 3: 1 hari sebelum 1 tahun
  it('1 day before 1 year (2025-01-01 to 2025-12-31)', () => {
    const period = calculateServicePeriod('2025-01-01', '2025-12-31');
    expect(period.years).toBe(0);
    expect(period.months).toBe(11);
    expect(period.days).toBe(30);

    const sevMonths = getSeveranceMonths(period.years);
    expect(sevMonths).toBe(1); // < 1 tahun = 1 bulan pesangon
  });

  // Test 4: Tepat 2 tahun
  it('Exactly 2 years (2024-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2024-01-01', '2026-01-01');
    expect(period.years).toBe(2);
    expect(period.months).toBe(0);
    expect(period.days).toBe(0);
  });

  // Test 5: 1 hari sebelum 3 tahun
  it('1 day before 3 years (2023-01-01 to 2025-12-31)', () => {
    const period = calculateServicePeriod('2023-01-01', '2025-12-31');
    expect(period.years).toBe(2);
    expect(period.months).toBe(11);
    expect(period.days).toBe(30);
  });

  // Test 6: Tepat 3 tahun
  it('Exactly 3 years (2023-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2023-01-01', '2026-01-01');
    expect(period.years).toBe(3);
    expect(period.months).toBe(0);
    expect(period.days).toBe(0);
    expect(getUPMKMonths(period.years)).toBe(2); // 3 - < 6 tahun = 2 bulan UPMK
  });

  // Test 7: Tepat 8 tahun
  it('Exactly 8 years (2018-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2018-01-01', '2026-01-01');
    expect(period.years).toBe(8);
    expect(period.months).toBe(0);
    expect(period.days).toBe(0);

    const sevMonths = getSeveranceMonths(period.years);
    const upmkMonths = getUPMKMonths(period.years);

    expect(sevMonths).toBe(9);
    expect(upmkMonths).toBe(3); // 6 - < 9 tahun is 3 months
  });

  // Test 8: Lebih dari 20 tahun (25 tahun)
  it('More than 20 years (2001-01-01 to 2026-01-01)', () => {
    const period = calculateServicePeriod('2001-01-01', '2026-01-01');
    expect(period.years).toBe(25);
    expect(period.months).toBe(0);
    expect(period.days).toBe(0);

    expect(getSeveranceMonths(period.years)).toBe(9);
    expect(getUPMKMonths(period.years)).toBe(10); // >= 24 tahun is 10 months
  });

  // Test 9: Boundary dates (31 Jan, 28 Feb, 29 Feb leap year, 30 Apr, 31 Dec -> 1 Jan)
  it('Month & leap year boundaries (2024 leap year 29 Feb to 2025 28 Feb)', () => {
    const period = calculateServicePeriod('2024-02-29', '2025-02-28');
    expect(period.years).toBe(0);
    expect(period.months).toBe(11);
    expect(period.days).toBe(30);
  });

  it('Dec 31 to Jan 1 next year (2024-12-31 to 2025-01-01)', () => {
    const period = calculateServicePeriod('2024-12-31', '2025-01-01');
    expect(period.years).toBe(0);
    expect(period.months).toBe(0);
    expect(period.days).toBe(1);
  });

  // Test 10: Full calculation check with multipliers
  it('Full calculation with 4 years service', () => {
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

  // Test 11: Tanggal PHK sebelum tanggal masuk -> ERROR
  it('Termination date before hire date returns error', () => {
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
});
