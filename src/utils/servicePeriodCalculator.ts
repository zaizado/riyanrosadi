import { ServicePeriodResult } from '../types/severance';

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

  const hireDate = new Date(hireDateStr);
  const terminationDate = new Date(terminationDateStr);

  if (isNaN(hireDate.getTime()) || isNaN(terminationDate.getTime())) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      formattedText: 'Format tanggal tidak valid',
      error: 'Format tanggal tidak valid.'
    };
  }

  // Set times to midnight UTC to prevent timezone offsets affecting calculation
  const hire = new Date(Date.UTC(hireDate.getFullYear(), hireDate.getMonth(), hireDate.getDate()));
  const term = new Date(Date.UTC(terminationDate.getFullYear(), terminationDate.getMonth(), terminationDate.getDate()));

  if (term < hire) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      formattedText: 'Tanggal PHK Kurang dari Tanggal Masuk',
      error: 'Tanggal PHK tidak boleh lebih awal dari tanggal masuk kerja.'
    };
  }

  let years = term.getUTCFullYear() - hire.getUTCFullYear();
  let months = term.getUTCMonth() - hire.getUTCMonth();
  let days = term.getUTCDate() - hire.getUTCDate();

  if (days < 0) {
    months--;
    // Get total days in previous month
    const prevMonthLastDay = new Date(Date.UTC(term.getUTCFullYear(), term.getUTCMonth(), 0)).getUTCDate();
    days += prevMonthLastDay;
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
