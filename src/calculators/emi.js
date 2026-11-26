import { finiteResult, readInputs, readNumber, readStartYear, toMonths, yearlySeries } from '../utils.js';

/**
 * Loan EMI (equated monthly instalment), interest reducing monthly, with a
 * repayment schedule per year.
 *
 * @param {Object} inputs
 * @param {number} inputs.principal  Loan amount.
 * @param {number} inputs.annualRate Interest, % a year.
 * @param {number} inputs.years      Tenure in years (fractions allowed).
 * @param {number} [inputs.startYear]   Optional calendar year of the start; series points get calendarYear.
 * @return {{emi: number, principal: number, totalInterest: number,
 *          totalPayment: number, months: number,
 *          schedule: Array<{year: number, principalPaid: number, interestPaid: number, balance: number}>,
 *          series: Array<{year: number, month: number, balance: number, principalPaid: number, interestPaid: number}>}}
 *          schedule: one row per loan year (the last may be shorter) with what
 *          that year paid; series: cumulative totals for charts.
 */
export function emi( inputs ) {
	const { principal, annualRate, years, startYear } = readInputs( inputs );
	const loan = readNumber( 'principal', principal );
	const i = readNumber( 'annualRate', annualRate ) / 100 / 12;
	const months = toMonths( years );
	const firstYear = readStartYear( startYear );

	// P × i / (1 − (1 + i)^−n): the same as P × i × (1 + i)^n / ((1 + i)^n − 1),
	// but (1 + i)^−n shrinks towards 0 instead of overflowing to Infinity.
	const instalment = i === 0
		? loan / months
		: ( loan * i ) / ( 1 - Math.pow( 1 + i, -months ) );

	const balances = [ loan ];
	const principalPaid = [ 0 ];
	const interestPaid = [ 0 ];
	let balance = loan;
	for ( let month = 1; month <= months; month++ ) {
		const interest = balance * i;
		const repaid = month === months ? balance : instalment - interest;
		balance = Math.max( 0, balance - repaid );
		balances.push( balance );
		principalPaid.push( principalPaid[ month - 1 ] + repaid );
		interestPaid.push( interestPaid[ month - 1 ] + interest );
	}

	const schedule = [];
	for ( let from = 0; from < months; from += 12 ) {
		const to = Math.min( from + 12, months );
		schedule.push( {
			year: schedule.length + 1,
			principalPaid: principalPaid[ to ] - principalPaid[ from ],
			interestPaid: interestPaid[ to ] - interestPaid[ from ],
			balance: balances[ to ],
		} );
	}

	const totalPayment = instalment * months;
	return finiteResult( {
		emi: instalment,
		principal: loan,
		totalInterest: totalPayment - loan,
		totalPayment,
		months,
		schedule,
		series: yearlySeries( months, ( month ) => ( {
			balance: balances[ month ],
			principalPaid: principalPaid[ month ],
			interestPaid: interestPaid[ month ],
		} ), firstYear ),
	} );
}
