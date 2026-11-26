import { finiteResult, readInputs, readInteger, readNumber, readStartYear, toMonths, yearlySeries } from '../utils.js';

/**
 * Lump sum (one-time investment), compounded a given number of times a year.
 *
 * @param {Object} inputs
 * @param {number} inputs.amount                 Amount invested once, at the start.
 * @param {number} inputs.annualRate             Expected return, % a year.
 * @param {number} inputs.years                  Duration in years (fractions allowed).
 * @param {number} [inputs.startYear]   Optional calendar year of the start; series points get calendarYear.
 * @param {number} [inputs.compoundingPerYear=1] 1 yearly, 4 quarterly, 12 monthly.
 * @return {{invested: number, returns: number, total: number, months: number,
 *          series: Array<{year: number, month: number, invested: number, total: number}>}}
 */
export function lumpsum( inputs ) {
	const { amount, annualRate, years, compoundingPerYear = 1, startYear } = readInputs( inputs );
	const invested = readNumber( 'amount', amount );
	const rate = readNumber( 'annualRate', annualRate ) / 100;
	const months = toMonths( years );
	const firstYear = readStartYear( startYear );
	const k = readInteger( 'compoundingPerYear', compoundingPerYear, 1 );

	const valueAt = ( month ) => invested * Math.pow( 1 + rate / k, ( k * month ) / 12 );
	const total = valueAt( months );

	return finiteResult( {
		invested,
		returns: total - invested,
		total,
		months,
		series: yearlySeries( months, ( month ) => ( {
			invested,
			total: valueAt( month ),
		} ), firstYear ),
	} );
}
