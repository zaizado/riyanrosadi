/**
 * Centralized Date Utilities for SBN KASBI
 * Timezone Target: Asia/Jakarta (UTC+7)
 */

export const TIMEZONE_WIB = 'Asia/Jakarta';

/**
 * Returns YYYY-MM-DD for a given Date or ISO string in Asia/Jakarta timezone.
 * Default is current time in WIB.
 */
export function getLocalDateISO(dateInput?: Date | string | number | null): string {
  if (!dateInput) {
    const now = new Date();
    return formatToWIBISO(now);
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // If string is already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
      return formatToWIBISO(new Date());
    }
    return formatToWIBISO(parsed);
  }

  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return formatToWIBISO(new Date());
  }
  return formatToWIBISO(d);
}

/**
 * Returns YYYY-MM-DDTHH:mm for a given Date/string in Asia/Jakarta timezone.
 */
export function getLocalDateTimeISO(dateInput?: Date | string | number | null): string {
  const d = !dateInput
    ? new Date()
    : dateInput instanceof Date
    ? dateInput
    : new Date(dateInput);

  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const year = getWIBPart(validDate, 'year');
  const month = getWIBPart(validDate, 'month');
  const day = getWIBPart(validDate, 'day');
  const hour = getWIBPart(validDate, 'hour');
  const minute = getWIBPart(validDate, 'minute');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Parses YYYY-MM-DD string as a local calendar date without timezone shift.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }

  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formats a date string or Date object for Indonesian UI display (Asia/Jakarta).
 */
export function formatLocalDate(
  dateInput: Date | string | number | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '-';

  let dateObj: Date;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    dateObj = parseLocalDate(dateInput);
  } else {
    dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);
  }

  if (isNaN(dateObj.getTime())) return '-';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_WIB,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  };

  return new Intl.DateTimeFormat('id-ID', defaultOptions).format(dateObj);
}

// Private helper to format Date in WIB YYYY-MM-DD
function formatToWIBISO(d: Date): string {
  const year = getWIBPart(d, 'year');
  const month = getWIBPart(d, 'month');
  const day = getWIBPart(d, 'day');
  return `${year}-${month}-${day}`;
}

function getWIBPart(d: Date, part: 'year' | 'month' | 'day' | 'hour' | 'minute'): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE_WIB,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const found = parts.find(p => p.type === part);
  if (!found) return '00';
  if (part === 'hour' && found.value === '24') return '00';
  return found.value.padStart(2, '0');
}
