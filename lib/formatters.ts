/**
 * Format a number with commas for readability
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 */
export function formatCurrency(num: number, decimals: number = 2): string {
  const parts = num.toFixed(decimals).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add commas to integer part
  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decimalPart ? `${withCommas}.${decimalPart}` : withCommas;
}

/**
 * Format a number as currency with $ sign and commas
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "$1,234.56"
 */
export function formatCurrencyDisplay(num: number, decimals: number = 2): string {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = formatCurrency(absNum, decimals);
  return isNegative ? `-$${formatted}` : `$${formatted}`;
}
