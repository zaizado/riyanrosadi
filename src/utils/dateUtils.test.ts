import { describe, it, expect } from 'vitest';
import {
  getLocalDateISO,
  parseLocalDate,
  formatLocalDate,
  getLocalDateTimeISO
} from './dateUtils';

describe('dateUtils - WIB (Asia/Jakarta) Date Hardening Tests', () => {
  it('should correctly format UTC timestamp corresponding to 00:00 WIB as the current date in WIB', () => {
    // 2026-08-12 17:00:00 UTC = 2026-08-13 00:00:00 WIB
    const utcDate = new Date('2026-08-12T17:00:00Z');
    expect(getLocalDateISO(utcDate)).toBe('2026-08-13');
  });

  it('should correctly handle 01:00 WIB (18:00 UTC previous day)', () => {
    const utcDate = new Date('2026-08-12T18:00:00Z');
    expect(getLocalDateISO(utcDate)).toBe('2026-08-13');
  });

  it('should correctly handle 03:00 WIB (20:00 UTC previous day)', () => {
    const utcDate = new Date('2026-08-12T20:00:00Z');
    expect(getLocalDateISO(utcDate)).toBe('2026-08-13');
  });

  it('should correctly handle 06:59 WIB (23:59 UTC previous day)', () => {
    const utcDate = new Date('2026-08-12T23:59:00Z');
    expect(getLocalDateISO(utcDate)).toBe('2026-08-13');
  });

  it('should correctly handle 07:00 WIB (00:00 UTC same day)', () => {
    const utcDate = new Date('2026-08-13T00:00:00Z');
    expect(getLocalDateISO(utcDate)).toBe('2026-08-13');
  });

  it('should correctly handle 23:59 WIB (16:59 UTC same day)', () => {
    const utcDate = new Date('2026-08-13T16:59:00Z');
    expect(getLocalDateISO(utcDate)).toBe('2026-08-13');
  });

  it('should handle month change boundary (Jan 31 23:59 WIB vs Feb 01 00:00 WIB)', () => {
    const jan31Night = new Date('2026-01-31T16:59:00Z'); // 23:59 WIB Jan 31
    const feb1Midnight = new Date('2026-01-31T17:00:00Z'); // 00:00 WIB Feb 1

    expect(getLocalDateISO(jan31Night)).toBe('2026-01-31');
    expect(getLocalDateISO(feb1Midnight)).toBe('2026-02-01');
  });

  it('should handle year change boundary (Dec 31 23:59 WIB vs Jan 01 00:00 WIB)', () => {
    const dec31Night = new Date('2025-12-31T16:59:00Z'); // 23:59 WIB Dec 31
    const jan1Midnight = new Date('2025-12-31T17:00:00Z'); // 00:00 WIB Jan 1

    expect(getLocalDateISO(dec31Night)).toBe('2025-12-31');
    expect(getLocalDateISO(jan1Midnight)).toBe('2026-01-01');
  });

  it('should handle February 28 and February 29 leap year boundaries', () => {
    // 2024 is a leap year
    const feb28_2024 = new Date('2024-02-28T00:00:00+07:00');
    const feb29_2024 = new Date('2024-02-29T00:00:00+07:00');
    expect(getLocalDateISO(feb28_2024)).toBe('2024-02-28');
    expect(getLocalDateISO(feb29_2024)).toBe('2024-02-29');

    // 2025 is NOT a leap year
    const feb28_2025 = new Date('2025-02-28T00:00:00+07:00');
    expect(getLocalDateISO(feb28_2025)).toBe('2025-02-28');
  });

  it('should parse YYYY-MM-DD cleanly without shifting calendar date', () => {
    const dateObj = parseLocalDate('2026-08-13');
    expect(dateObj.getFullYear()).toBe(2026);
    expect(dateObj.getMonth()).toBe(7); // 0-indexed, 7 = August
    expect(dateObj.getDate()).toBe(13);
  });

  it('should format Indonesian local date strings properly', () => {
    expect(formatLocalDate('2026-08-13')).toContain('13');
    expect(formatLocalDate('2026-08-13')).toContain('Agustus');
    expect(formatLocalDate('2026-08-13')).toContain('2026');
  });
});
