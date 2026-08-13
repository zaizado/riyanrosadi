import { ServicePeriodResult } from '../types/severance';
import { parseLocalDate } from './dateUtils';

interface ParsedYMD {
  year: number;
  month: number;
  day: number;
}

function parseYMD(dateStr: string): ParsedYMD | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return { year, month, day };
}

export function calculateServicePeriod(hireDateStr: string, terminationDateStr: string): ServicePeriodResult {
  if (!hireDateStr || !terminationDateStr) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      formattedText: 'Data tanggal belum lengkap',
      error: 'Tanggal masuk dan tanggal PHK harus diisi dengan benar.'
    };
  }

  const hireYMD = parseYMD(hireDateStr);
  const termYMD = parseYMD(terminationDateStr);

  if (!hireYMD || !termYMD) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      formattedText: 'Format tanggal tidak valid',
      error: 'Format tanggal tidak valid.'
    };
  }

  // Check if term < hire
  const hireVal = hireYMD.year * 10000 + hireYMD.month * 100 + hireYMD.day;
  const termVal = termYMD.year * 10000 + termYMD.month * 100 + termYMD.day;

  if (termVal < hireVal) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      formattedText: 'Tanggal PHK Kurang dari Tanggal Masuk',
      error: 'Tanggal PHK tidak boleh lebih awal dari tanggal masuk kerja.'
    };
  }

  let years = termYMD.year - hireYMD.year;
  let months = termYMD.month - hireYMD.month;
  let days = termYMD.day - hireYMD.day;

  if (days < 0) {
    months--;
    // Get days in previous month relative to termination month
    const prevMonthYear = termYMD.month === 1 ? termYMD.year - 1 : termYMD.year;
    const prevMonth = termYMD.month === 1 ? 12 : termYMD.month - 1;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth, 0).getDate();
    days += daysInPrevMonth;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Tahun`);
  if (months > 0) parts.push(`${months} Bulan`);
  if (days > 0 || (years === 0 && months === 0)) parts.push(`${days} Hari`);

  return {
    years,
    months,
    days,
    totalMonths,
    formattedText: parts.join(', ') || '0 Hari'
  };
}
