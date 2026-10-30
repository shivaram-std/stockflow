/**
 * Currency Formatting Utility for StockFlow
 * Formats monetary amounts in Indian Rupee (₹) standard currency notation.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  // Format with standard Indian numbering system with 2 decimal places
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
