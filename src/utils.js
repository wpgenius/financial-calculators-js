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
	// Decimal strings only ("12", "-1.5", "2e5"): Number() would also read "0x10" as 16.
	const number = typeof value === 'string' && DECIMAL.test( value.trim() ) ? Number( value ) : value;
	if ( typeof number !== 'number' || ! Number.isFinite( number ) ) {
		throw new TypeError( `${ name } must be a finite number, got ${ describe( value ) }.` );
	}
	if ( number < min ) {
		throw new RangeError( `${ name } must be at least ${ min }, got ${ number }.` );
	}
	return number;
}

// How a bad value reads in an error message.
export function describe( value ) {
	if ( Array.isArray( value ) ) {
		return 'an array';
	}
	return typeof value === 'string' ? `"${ value }"` : String( value );
}

const DECIMAL = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * Reads a whole-number input, such as a count of periods.
 *
 * @param {string} name  Input name, for the error message.
 * @param {*}      value Value to read.
 * @param {number} [min=0] Smallest allowed value.
 * @return {number} The value as a whole number.
 * @throws {RangeError} When the value has a fraction or is below min.
 */
export function readInteger( name, value, min = 0 ) {
	const number = readNumber( name, value, min );
	if ( ! Number.isInteger( number ) ) {
		throw new RangeError( `${ name } must be a whole number, got ${ number }.` );
	}
	return number;
}

/** Longest duration a calculator accepts: the loops run once per month. */
export const MAX_YEARS = 1000;

/**
 * Reads a calculator's inputs object.
 *
 * @param {*} inputs
 * @return {Object} The inputs.
 * @throws {TypeError} When inputs is not an object.
 */
export function readInputs( inputs ) {
	if ( ! inputs || typeof inputs !== 'object' || Array.isArray( inputs ) ) {
		throw new TypeError( `inputs must be an object, such as { annualRate: 12, years: 10 }, got ${ describe( inputs ) }.` );
	}
	return inputs;
}

/**
 * Converts a duration in years (fractions allowed) to whole months: at least
 * 1, at most MAX_YEARS × 12.
 *
 * @param {*} years Duration in years.
 * @return {number} Months.
 */
export function toMonths( years ) {
	const value = readNumber( 'years', years );
	if ( value > MAX_YEARS ) {
		throw new RangeError( `years must be at most ${ MAX_YEARS }, got ${ years }.` );
	}
	const months = Math.round( value * 12 );
	if ( months < 1 ) {
		throw new RangeError( `years must be at least one month (1/12), got ${ years }.` );
	}
	return months;
}

/**
 * Checks that every number in a result is finite: huge inputs can overflow
 * to Infinity or NaN, which would only fail later, in the formatting.
 *
 * @param {Object} result A calculator's result.
 * @return {Object} The same result.
 * @throws {RangeError} When a value is not a finite number.
 */
export function finiteResult( result ) {
	const check = ( value ) => {
		if ( typeof value === 'number' && ! Number.isFinite( value ) ) {
			throw new RangeError( 'The result is too large to calculate; use smaller amounts, rates or durations.' );
		}
		if ( value && typeof value === 'object' ) {
			Object.values( value ).forEach( check );
		}
	};
	check( result );
	return result;
}

/**
 * Reads the optional startYear input: a whole calendar year, or undefined.
 *
 * @param {*} startYear
 * @return {(number|undefined)}
 */
export function readStartYear( startYear ) {
	if ( startYear === undefined || startYear === null || startYear === '' ) {
		return undefined;
	}
	return readInteger( 'startYear', startYear, -1e6 );
}

/**
 * Builds a chart series with one point per year (month 0, 12, 24...), plus
 * the last month when the duration is not a whole number of years.
 *
 * @param {number}                   months      Duration in months.
 * @param {function(number): Object} point       Values at a given month.
 * @param {number}                   [startYear] Calendar year of month 0; adds calendarYear,
 *                                               the whole year that month falls in.
 * @return {Array<Object>} Points: { year, month, [calendarYear], ...point(month) }.
 */
export function yearlySeries( months, point, startYear ) {
	const at = ( month ) => {
		const year = month / 12;
		const base = startYear === undefined ? { year, month } : { year, month, calendarYear: startYear + Math.floor( year ) };
		return { ...base, ...point( month ) };
	};
	const series = [];
	for ( let month = 0; month < months; month += 12 ) {
		series.push( at( month ) );
	}
	series.push( at( months ) );
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
	return amount * ( growth( i, n ) / i ) * ( 1 + i );
}

/**
 * (1 + i)^n − 1, accurate for tiny rates too: computed directly, the
 * subtraction loses every digit when i is near 0 (a 1e-13 % rate gave 0).
 *
 * @param {number} i Rate per period.
 * @param {number} n Periods (may be negative).
 * @return {number} The growth.
 */
export function growth( i, n ) {
	return Math.expm1( n * Math.log1p( i ) );
}
