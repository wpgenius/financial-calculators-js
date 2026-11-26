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
	readSystem( system );
	if ( typeof digits !== 'string' || ! /^\d+$/.test( digits ) ) {
		throw new TypeError( `digits must be a string of digits, such as "1234567", got ${ String( digits ) }.` );
	}
	if ( digits.length <= 3 ) {
		return digits;
	}
	const last3 = digits.slice( -3 );
	const rest = digits.slice( 0, -3 );
	const size = system === 'indian' ? 2 : 3;
	const pattern = new RegExp( `\\B(?=(\\d{${ size }})+(?!\\d))`, 'g' );
	return rest.replace( pattern, ',' ) + ',' + last3;
}

// A positive number below 10^21 as plain decimal digits, from its shortest
// form (what Intl rounds too): 1.005 → "1.005", 1e-7 → "0.0000001".
function plainDigits( absolute ) {
	const text = String( absolute );
	if ( ! text.includes( 'e' ) ) {
		return text;
	}
	const [ mantissa, exponent ] = text.split( 'e' );
	const [ whole, fraction = '' ] = mantissa.split( '.' );
	const digits = whole + fraction;
	const point = whole.length + Number( exponent );
	return point <= 0 ? '0.' + '0'.repeat( -point ) + digits : digits.slice( 0, point ) + '.' + digits.slice( point );
}

// Rounds plain digits half away from zero, like Intl: toFixed would round
// 1.005 to "1.00" because the stored binary value is just below it.
function roundDigits( plain, decimals ) {
	const [ whole, fraction = '' ] = plain.split( '.' );
	if ( fraction.length <= decimals ) {
		return [ whole, fraction.padEnd( decimals, '0' ) ];
	}
	let kept = whole + fraction.slice( 0, decimals );
	if ( fraction[ decimals ] >= '5' ) {
		kept = ( BigInt( kept ) + 1n ).toString().padStart( kept.length, '0' );
	}
	const end = kept.length - decimals;
	return [ kept.slice( 0, end ).replace( /^0+(?=\d)/, '' ) || '0', kept.slice( end ) ];
}

function formatByHand( value, decimals, system ) {
	const absolute = Math.abs( value );
	// At 10^21 and above a double has no fraction, and String() switches to
	// exponent notation; BigInt keeps every digit.
	const [ whole, fraction ] = absolute >= 1e21
		? [ BigInt( absolute ).toString(), '0'.repeat( decimals ) ]
		: roundDigits( plainDigits( absolute ), decimals );
	const sign = value < 0 && /[1-9]/.test( whole + fraction ) ? '-' : '';
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
	if ( position !== 'before' && position !== 'after' ) {
		throw new RangeError( `position must be "before" or "after", got "${ position }".` );
	}
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
	const units = COMPACT_UNITS[ system ];
	// The largest unit the value reaches; then move up a unit when rounding
	// reaches the next one (999,999 → "1M", not "1,000K").
	let index = units.findIndex( ( [ size ] ) => absolute >= size );
	if ( index === -1 ) {
		if ( Math.round( absolute ) < units[ units.length - 1 ][ 0 ] ) {
			return formatNumber( value, { system, decimals: 0 } );
		}
		index = units.length - 1;
	}
	const rounded = ( i ) => Number( ( absolute / units[ i ][ 0 ] ).toFixed( decimals ) );
	while ( index > 0 && rounded( index ) * units[ index ][ 0 ] >= units[ index - 1 ][ 0 ] ) {
		index--;
	}
	const short = rounded( index );
	// Only the digits needed, up to decimals: 1.5 stays "1.5", never "1.50".
	const places = ( String( short ).split( '.' )[ 1 ] || '' ).length;
	return `${ sign }${ formatNumber( short, { system, decimals: Math.min( places, decimals ) } ) }${ units[ index ][ 1 ] }`;
}
