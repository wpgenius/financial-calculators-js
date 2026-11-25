/**
 * Number formatting in the Indian (12,34,567) or international (1,234,567)
 * system. Uses Intl.NumberFormat when the runtime supports the en-IN locale,
 * and the same grouping by hand otherwise, so the output never depends on
 * which locales a browser or Node build ships.
 */

const LOCALES = { indian: 'en-IN', international: 'en-US' };

let intlChecked = false;
let intlWorks = false;

// One formatter per locale and decimals: sliders format many values per frame,
// and building an Intl.NumberFormat is far slower than using one.
const formatters = new Map();

function formatter( system, decimals ) {
	const key = system + ':' + decimals;
	let cached = formatters.get( key );
	if ( ! cached ) {
		cached = new Intl.NumberFormat( LOCALES[ system ], {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
			useGrouping: true,
		} );
		formatters.set( key, cached );
	}
	return cached;
}

function canUseIntl() {
	if ( ! intlChecked ) {
		intlChecked = true;
		try {
			intlWorks =
				new Intl.NumberFormat( 'en-IN' ).format( 1234567 ) === '12,34,567' &&
				new Intl.NumberFormat( 'en-US' ).format( 1234567 ) === '1,234,567';
		} catch {
			intlWorks = false;
		}
	}
	return intlWorks;
}

function readSystem( system ) {
	if ( ! Object.prototype.hasOwnProperty.call( LOCALES, system ) ) {
		throw new RangeError( `system must be "indian" or "international", got "${ system }".` );
	}
	return system;
}

function readDecimals( decimals ) {
	if ( ! Number.isInteger( decimals ) || decimals < 0 || decimals > 20 ) {
		throw new RangeError( `decimals must be a whole number from 0 to 20, got ${ decimals }.` );
	}
	return decimals;
}

/**
 * Groups the digits of a non-negative whole-number string.
 *
 * @param {string} digits Digits only, e.g. "1234567".
 * @param {string} system "indian" or "international".
 * @return {string} e.g. "12,34,567" or "1,234,567".
 */
export function groupDigits( digits, system = 'indian' ) {
	if ( digits.length <= 3 ) {
		return digits;
	}
	const last3 = digits.slice( -3 );
	const rest = digits.slice( 0, -3 );
	const size = readSystem( system ) === 'indian' ? 2 : 3;
	const pattern = new RegExp( `\\B(?=(\\d{${ size }})+(?!\\d))`, 'g' );
	return rest.replace( pattern, ',' ) + ',' + last3;
}

function formatByHand( value, decimals, system ) {
	const fixed = Math.abs( value ).toFixed( decimals );
	const [ whole, fraction ] = fixed.split( '.' );
	const sign = value < 0 && Number( fixed ) !== 0 ? '-' : '';
	return sign + groupDigits( whole, system ) + ( fraction ? '.' + fraction : '' );
}

/**
 * Formats a number with grouping separators.
 *
 * @param {number} value
 * @param {Object} [options]
 * @param {string} [options.system='indian'] "indian" or "international".
 * @param {number} [options.decimals=0]      Digits after the decimal point.
 * @return {string} e.g. formatNumber( 5808477 ) → "58,08,477".
 */
export function formatNumber( value, { system = 'indian', decimals = 0 } = {} ) {
	readSystem( system );
	readDecimals( decimals );
	if ( typeof value !== 'number' || ! Number.isFinite( value ) ) {
		throw new TypeError( `value must be a finite number, got ${ String( value ) }.` );
	}
	// Avoid "-0" for values that round to zero.
	const rounded = Number( value.toFixed( decimals ) );
	const number = rounded === 0 ? 0 : value;
	if ( canUseIntl() ) {
		return formatter( system, decimals ).format( number );
	}
	return formatByHand( number, decimals, system );
}

/**
 * Formats an amount of money: the currency symbol plus the grouped number.
 *
 * @param {number} value
 * @param {Object} [options]
 * @param {string} [options.symbol='₹']       Currency symbol.
 * @param {string} [options.position='before'] "before" (₹100) or "after" (100 €).
 * @param {string} [options.system='indian']  "indian" or "international".
 * @param {number} [options.decimals=0]       Digits after the decimal point.
 * @return {string} e.g. formatCurrency( -1500 ) → "-₹1,500".
 */
export function formatCurrency( value, { symbol = '₹', position = 'before', system = 'indian', decimals = 0 } = {} ) {
	const formatted = formatNumber( value, { system, decimals } );
	const negative = formatted.startsWith( '-' );
	const digits = negative ? formatted.slice( 1 ) : formatted;
	const sign = negative ? '-' : '';
	return position === 'after' ? `${ sign }${ digits } ${ symbol }` : `${ sign }${ symbol }${ digits }`;
}

const COMPACT_UNITS = {
	indian: [ [ 1e7, 'Cr' ], [ 1e5, 'L' ], [ 1e3, 'K' ] ],
	international: [ [ 1e12, 'T' ], [ 1e9, 'B' ], [ 1e6, 'M' ], [ 1e3, 'K' ] ],
};

/**
 * Short form for chart axes and tight spaces.
 *
 * @param {number} value
 * @param {Object} [options]
 * @param {string} [options.system='indian'] "indian" (K, L, Cr) or "international" (K, M, B, T).
 * @param {number} [options.decimals=1]      Most digits after the decimal point.
 * @return {string} e.g. 1500000 → "15L" (indian) or "1.5M" (international).
 */
export function formatCompact( value, { system = 'indian', decimals = 1 } = {} ) {
	readSystem( system );
	readDecimals( decimals );
	if ( typeof value !== 'number' || ! Number.isFinite( value ) ) {
		throw new TypeError( `value must be a finite number, got ${ String( value ) }.` );
	}
	const absolute = Math.abs( value );
	const sign = value < 0 ? '-' : '';
	for ( const [ size, unit ] of COMPACT_UNITS[ system ] ) {
		if ( absolute >= size ) {
			const short = Number( ( absolute / size ).toFixed( decimals ) );
			return `${ sign }${ formatNumber( short, { system, decimals: short % 1 === 0 ? 0 : decimals } ) }${ unit }`;
		}
	}
	return formatNumber( value, { system, decimals: 0 } );
}
