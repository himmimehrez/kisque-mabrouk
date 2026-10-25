/**
 * Algerian Dinars & Date formatting utilities
 */

export function formatDZD(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0,00 DA';
  }
  
  // Format with French locale spacing and two decimal points
  const formatted = new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} DA`;
}

export function formatDZDShort(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 DA';
  }
  const formatted = new Intl.NumberFormat('fr-DZ', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return `${formatted} DA`;
}

export function formatDateDZ(dateString: string | Date | undefined): string {
  if (!dateString) return '-';
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(d.getTime())) return '-';
  
  return new Intl.DateTimeFormat('fr-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTimeDZ(dateString: string | Date | undefined): string {
  if (!dateString) return '-';
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('fr-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Generate sequential reference numbers
 */
export function generateReference(prefix: string, count: number): string {
  const currentYear = new Date().getFullYear();
  const padded = String(count + 1).padStart(4, '0');
  return `${prefix}-${currentYear}-${padded}`;
}

/**
 * Algerian standard denominations for cash register change calculation
 */
export const ALGERIAN_CURRENCY_NOTES = [2000, 1000, 500, 200, 100, 50, 20, 10];
