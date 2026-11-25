/**
 * Shared helpers for the calculators: input checks and the yearly series.
 */

/**
 * Reads a numeric input. Accepts numbers and numeric strings.
 *
 * @param {string} name  Input name, for the error message.
 * @param {*}      value Value to read.
 * @param {number} [min=0] Smallest allowed value.
 * @return {number} The value as a number.
 * @throws {TypeError}  When the value is not a finite number.
 * @throws {RangeError} When the value is below min.
 */
export function readNumber( name, value, min = 0 ) {
	const number = typeof value === 'string' && value.trim() !== '' ? Number( value ) : value;
	if ( typeof number !== 'number' || ! Number.isFinite( number ) ) {
		throw new TypeError( `${ name } must be a finite number, got ${ String( value ) }.` );
	}
	if ( number < min ) {
		throw new RangeError( `${ name } must be at least ${ min }, got ${ number }.` );
	}
	return number;
}

/**
 * Converts a duration in years (fractions allowed) to whole months, at least 1.
 *
 * @param {*} years Duration in years.
 * @return {number} Months.
 */
export function toMonths( years ) {
	const months = Math.round( readNumber( 'years', years ) * 12 );
	if ( months < 1 ) {
		throw new RangeError( `years must be at least one month (1/12), got ${ years }.` );
	}
	return months;
}

/**
 * Builds a chart series with one point per year (month 0, 12, 24...), plus
 * the last month when the duration is not a whole number of years.
 *
 * @param {number}                 months Duration in months.
 * @param {function(number): Object} point  Values at a given month.
 * @return {Array<Object>} Points: { year, month, ...point(month) }.
 */
export function yearlySeries( months, point ) {
	const series = [];
	for ( let month = 0; month < months; month += 12 ) {
		series.push( { year: month / 12, month, ...point( month ) } );
	}
	series.push( { year: months / 12, month: months, ...point( months ) } );
	return series;
}

/**
 * Value of a monthly investment made at the start of each month
 * (annuity due), after n months: P × ((1 + i)^n − 1) / i × (1 + i).
 *
 * @param {number} amount Monthly amount.
 * @param {number} i      Monthly rate (0.01 for 12% a year).
 * @param {number} n      Months.
 * @return {number} Value.
 */
export function annuityDueValue( amount, i, n ) {
	if ( i === 0 ) {
		return amount * n;
	}
	return amount * ( ( Math.pow( 1 + i, n ) - 1 ) / i ) * ( 1 + i );
}
