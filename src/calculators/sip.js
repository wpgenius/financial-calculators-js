import { readNumber, readStartYear, toMonths, yearlySeries, annuityDueValue } from '../utils.js';

/**
 * SIP (systematic investment plan): the same amount invested at the start of
 * every month, compounded monthly.
 *
 * @param {Object} inputs
 * @param {number} inputs.monthlyAmount Amount invested each month.
 * @param {number} inputs.annualRate    Expected return, % a year (12 for 12%).
 * @param {number} inputs.years         Duration in years (fractions allowed).
 * @param {number} [inputs.startYear]   Optional calendar year of the start; series points get calendarYear.
 * @return {{invested: number, returns: number, total: number, months: number,
 *          series: Array<{year: number, month: number, invested: number, total: number}>}}
 */
export function sip( { monthlyAmount, annualRate, years, startYear } ) {
	const amount = readNumber( 'monthlyAmount', monthlyAmount );
	const i = readNumber( 'annualRate', annualRate ) / 100 / 12;
	const months = toMonths( years );
	const firstYear = readStartYear( startYear );

	const total = annuityDueValue( amount, i, months );
	const invested = amount * months;

	return {
		invested,
		returns: total - invested,
		total,
		months,
		series: yearlySeries( months, ( month ) => ( {
			invested: amount * month,
			total: annuityDueValue( amount, i, month ),
		} ), firstYear ),
	};
}
