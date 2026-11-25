import { readNumber, readStartYear, toMonths, yearlySeries } from '../utils.js';

/**
 * SWP (systematic withdrawal plan): a fixed amount withdrawn at the start of
 * every month; the rest earns the expected return, compounded monthly.
 * The balance never goes below zero: when it runs out, the last withdrawal
 * is whatever is left and depletedMonth says when that happened.
 *
 * @param {Object} inputs
 * @param {number} inputs.investment        Amount invested at the start.
 * @param {number} inputs.monthlyWithdrawal Amount withdrawn each month.
 * @param {number} inputs.annualRate        Expected return, % a year.
 * @param {number} inputs.years             Duration in years (fractions allowed).
 * @param {number} [inputs.startYear]   Optional calendar year of the start; series points get calendarYear.
 * @return {{investment: number, totalWithdrawn: number, finalBalance: number,
 *          returns: number, depletedMonth: (number|null), months: number,
 *          series: Array<{year: number, month: number, balance: number, withdrawn: number}>}}
 *          returns = finalBalance + totalWithdrawn − investment.
 *          depletedMonth is the month (1-based) the balance reached zero, or null.
 */
export function swp( { investment, monthlyWithdrawal, annualRate, years, startYear } ) {
	const start = readNumber( 'investment', investment );
	const withdrawal = readNumber( 'monthlyWithdrawal', monthlyWithdrawal );
	const i = readNumber( 'annualRate', annualRate ) / 100 / 12;
	const months = toMonths( years );
	const firstYear = readStartYear( startYear );

	const balances = [ start ];
	const withdrawnTotals = [ 0 ];
	let balance = start;
	let withdrawn = 0;
	let depletedMonth = null;

	for ( let month = 1; month <= months; month++ ) {
		const take = Math.min( withdrawal, balance );
		balance -= take;
		withdrawn += take;
		if ( balance <= 0 ) {
			balance = 0;
			if ( depletedMonth === null && withdrawal > 0 ) {
				depletedMonth = month;
			}
		} else {
			balance += balance * i;
		}
		balances.push( balance );
		withdrawnTotals.push( withdrawn );
	}

	return {
		investment: start,
		totalWithdrawn: withdrawn,
		finalBalance: balance,
		returns: balance + withdrawn - start,
		depletedMonth,
		months,
		series: yearlySeries( months, ( month ) => ( {
			balance: balances[ month ],
			withdrawn: withdrawnTotals[ month ],
		} ), firstYear ),
	};
}
