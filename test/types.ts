// Compile-only checks for types/financial-calculators.d.ts (npm run test:types).
import {
	sip, lumpsum, swp, goal, emi, calculate, types, register,
	formatNumber, formatCurrency, formatCompact, groupDigits, amountInWords, VERSION,
	type SipResult, type EmiResult, type CalculatorType,
} from '@wpgenius/financial-calculators';

const s: SipResult = sip( { monthlyAmount: 25000, annualRate: '12', years: 10 } );
const total: number = s.total + s.series[ 0 ].invested;
lumpsum( { amount: 1, annualRate: 1, years: 1, compoundingPerYear: 4 } );
const depleted: number | null = swp( { investment: 1, monthlyWithdrawal: 1, annualRate: 1, years: 1 } ).depletedMonth;
const monthly: number = goal( { presentCost: 1, inflationRate: 6, annualRate: 9, years: 3 } ).monthlyInvestment;
const loan: EmiResult = emi( { principal: 100000, annualRate: 7, years: 1 } );
const firstYear: number = loan.schedule[ 0 ].interestPaid;
const viaName: EmiResult = calculate( 'emi', { principal: 1, annualRate: 1, years: 1 } );
const kind: CalculatorType = 'goal';
const all: string[] = types();
register( 'double', ( inputs: { value: number } ) => inputs.value * 2 );
const text: string = formatNumber( 1, { system: 'international', decimals: 2 } )
	+ formatCurrency( 1, { symbol: '$', position: 'after' } )
	+ formatCompact( 1 ) + groupDigits( '1000', 'indian' )
	+ amountInWords( 10n ) + amountInWords( '123' ) + VERSION;
const fromGlobal: string = window.FinancialCalculators.formatNumber( 1 );
const target: number | undefined = goal( { presentCost: 1, inflationRate: 6, annualRate: 9, years: 3, startYear: 2026 } ).targetYear;
const calendar: number | undefined = sip( { monthlyAmount: 1, annualRate: 1, years: 1, startYear: '2026' } ).series[ 0 ].calendarYear;
const translated: string = amountInWords( 100, { words: { hundred: 'सौ', and: '', indian: { lakh: 'लाख' } } } );

// @ts-expect-error: monthlyAmount is required.
sip( { annualRate: 12, years: 10 } );
// @ts-expect-error: unknown number system.
formatNumber( 1, { system: 'roman' } );
// @ts-expect-error: words.hundred is a string.
amountInWords( 1, { words: { hundred: 100 } } );
// @ts-expect-error: position is 'before' or 'after'.
formatCurrency( 1, { position: 'middle' } );

export { total, depleted, monthly, firstYear, viaName, kind, all, text, fromGlobal, target, calendar, translated };
