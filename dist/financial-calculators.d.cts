// Types for financial-calculators. Keep in step with src/ (test/types.ts checks them).

/** A numeric input: a number, or a string holding one. */
export type NumericInput = number | string;

/** Number grouping: Indian (12,34,567) or international (1,234,567). */
export type NumberSystem = 'indian' | 'international';

/** Every series point has the year (fractions for a last partial year) and the month. */
export interface SeriesPoint {
	year: number;
	month: number;
	/** The whole calendar year the point falls in (startYear + whole years), when the calculator got a startYear. */
	calendarYear?: number;
}

/** Optional input on every calculator: the calendar year of the start (such as 2026). */
export interface StartYearInput {
	startYear?: NumericInput;
}

export interface SipInputs extends StartYearInput {
	/** Amount invested at the start of every month. */
	monthlyAmount: NumericInput;
	/** Expected return, % a year (12 for 12%). */
	annualRate: NumericInput;
	/** Duration in years, one month to 1,000; fractions are rounded to whole months. */
	years: NumericInput;
}

export interface GrowthPoint extends SeriesPoint {
	invested: number;
	total: number;
}

export interface SipResult {
	invested: number;
	returns: number;
	total: number;
	months: number;
	series: GrowthPoint[];
}

export interface LumpsumInputs extends StartYearInput {
	/** Amount invested once, at the start. */
	amount: NumericInput;
	annualRate: NumericInput;
	years: NumericInput;
	/** A whole number: 1 yearly (default), 4 quarterly, 12 monthly. */
	compoundingPerYear?: NumericInput;
}

export type LumpsumResult = SipResult;

export interface SwpInputs extends StartYearInput {
	/** Amount invested at the start. */
	investment: NumericInput;
	/** Amount withdrawn at the start of every month. */
	monthlyWithdrawal: NumericInput;
	annualRate: NumericInput;
	years: NumericInput;
}

export interface SwpPoint extends SeriesPoint {
	balance: number;
	/** Total withdrawn so far. */
	withdrawn: number;
}

export interface SwpResult {
	investment: number;
	totalWithdrawn: number;
	/** Never below 0. */
	finalBalance: number;
	/** finalBalance + totalWithdrawn − investment. */
	returns: number;
	/** The month (1-based) the money ran out, or null. */
	depletedMonth: number | null;
	months: number;
	series: SwpPoint[];
}

export interface GoalInputs extends StartYearInput {
	/** What the goal costs today. */
	presentCost: NumericInput;
	/** Savings already put aside for it (default 0). */
	currentSavings?: NumericInput;
	/** Inflation, % a year. */
	inflationRate: NumericInput;
	/** Expected return, % a year. */
	annualRate: NumericInput;
	/** Years until the goal. */
	years: NumericInput;
}

export interface GoalPoint extends SeriesPoint {
	goalCost: number;
	savings: number;
	investments: number;
	total: number;
}

export interface GoalResult {
	presentCost: number;
	futureCost: number;
	savingsFutureValue: number;
	shortfall: number;
	/** 0 when the savings already cover the goal. */
	monthlyInvestment: number;
	totalInvested: number;
	months: number;
	/** The calendar year the goal falls in (startYear + whole years), when a startYear was given. */
	targetYear?: number;
	series: GoalPoint[];
}

export interface EmiInputs extends StartYearInput {
	/** Loan amount. */
	principal: NumericInput;
	/** Interest, % a year. */
	annualRate: NumericInput;
	/** Tenure in years. */
	years: NumericInput;
}

export interface EmiScheduleRow {
	/** Loan year, from 1. */
	year: number;
	principalPaid: number;
	interestPaid: number;
	/** Balance left at the end of that year. */
	balance: number;
}

export interface EmiPoint extends SeriesPoint {
	balance: number;
	/** Cumulative. */
	principalPaid: number;
	/** Cumulative. */
	interestPaid: number;
}

export interface EmiResult {
	emi: number;
	principal: number;
	totalInterest: number;
	totalPayment: number;
	months: number;
	schedule: EmiScheduleRow[];
	series: EmiPoint[];
}

export interface CalculatorMap {
	sip: { inputs: SipInputs; result: SipResult };
	lumpsum: { inputs: LumpsumInputs; result: LumpsumResult };
	swp: { inputs: SwpInputs; result: SwpResult };
	goal: { inputs: GoalInputs; result: GoalResult };
	emi: { inputs: EmiInputs; result: EmiResult };
}

export type CalculatorType = keyof CalculatorMap;

export function sip( inputs: SipInputs ): SipResult;
export function lumpsum( inputs: LumpsumInputs ): LumpsumResult;
export function swp( inputs: SwpInputs ): SwpResult;
export function goal( inputs: GoalInputs ): GoalResult;
export function emi( inputs: EmiInputs ): EmiResult;

/** Runs a calculator by type. Throws on an unknown type. */
export function calculate<T extends CalculatorType>( type: T, inputs: CalculatorMap[ T ][ 'inputs' ] ): CalculatorMap[ T ][ 'result' ];
export function calculate( type: string, inputs: Record<string, unknown> ): unknown;

/** The calculator types available. */
export function types(): string[];

/** Adds or replaces a calculator. */
export function register( type: string, fn: ( inputs: any ) => unknown ): void;

export interface NumberOptions {
	system?: NumberSystem;
	/** Digits after the decimal point, 0 to 20. Default 0. */
	decimals?: number;
}

export interface CurrencyOptions extends NumberOptions {
	/** Default '₹'. */
	symbol?: string;
	/** 'before' (₹100, default) or 'after' (100 €). */
	position?: 'before' | 'after';
}

export interface CompactOptions {
	system?: NumberSystem;
	/** Most digits after the decimal point. Default 1. */
	decimals?: number;
}

/** formatNumber( 5808477 ) → "58,08,477". */
export function formatNumber( value: number, options?: NumberOptions ): string;
/** formatCurrency( -1500 ) → "-₹1,500". */
export function formatCurrency( value: number, options?: CurrencyOptions ): string;
/** formatCompact( 1500000 ) → "15L"; international → "1.5M". */
export function formatCompact( value: number, options?: CompactOptions ): string;
/** groupDigits( '1234567' ) → "12,34,567". */
export function groupDigits( digits: string, system?: NumberSystem ): string;
/** Your own words for amountInWords (for translations). Missing keys fall back to English. */
export interface WordsOptions {
	/** 20 strings for 0–19 (index 0 is unused, usually ''). */
	ones?: string[];
	/** 10 strings: '', '', twenty … ninety. */
	tens?: string[];
	/**
	 * 100 strings for 0–99, used instead of ones and tens: for languages whose
	 * numbers up to 99 aren't "tens + ones" (Hindi: 21 is "इक्कीस"). Index 0 is unused.
	 */
	belowHundred?: string[];
	hundred?: string;
	/** Between hundreds and the rest ("and"); '' leaves it out. */
	and?: string;
	zero?: string;
	minus?: string;
	indian?: { thousand?: string; lakh?: string; crore?: string };
	/** 12 strings: '', thousand, million … decillion. */
	international?: string[];
}

export interface AmountInWordsOptions {
	system?: NumberSystem;
	words?: WordsOptions;
}

/** amountInWords( 2808477 ) → "Twenty Eight Lakh Eight Thousand Four Hundred and Seventy Seven". */
export function amountInWords( value: number | bigint | string, options?: AmountInWordsOptions ): string;

/** Library version, e.g. "1.0.0". */
export const VERSION: string;

/** The browser builds define this global. */
declare global {
	interface Window {
		FinancialCalculators: typeof import( './financial-calculators.cjs' );
	}
}
