/**
 * financial-calculators: financial formulas, number formatting and amounts
 * in words. No dependencies.
 *
 * Browser: the build files define the global `FinancialCalculators`.
 * Modules: import { sip, formatNumber } from '@wpgenius/financial-calculators'.
 */

export { sip, lumpsum, swp, goal, emi, calculate, register, types } from './calculators/index.js';
export { formatNumber, formatCurrency, formatCompact, groupDigits } from './format/number.js';
export { amountInWords } from './format/words.js';

/* global __VERSION__ */
/** Library version, stamped in by the build ("development" when running from src/). */
export const VERSION = typeof __VERSION__ === 'string' ? __VERSION__ : 'development';
