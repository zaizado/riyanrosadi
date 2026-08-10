export function formatRupiah(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'Rp 0';
  }
  const formatted = Math.round(value).toLocaleString('id-ID');
  return `Rp ${formatted}`;
}

export function parseRupiahNum(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
