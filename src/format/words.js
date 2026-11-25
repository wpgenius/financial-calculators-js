/**
 * Amounts in words, in the Indian (lakh, crore) or international (million,
 * billion...) system, with no limit on size: above the largest named unit
 * the words repeat ("One Thousand Crore", "One Thousand Decillion").
 */

const ONES = [ '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
	'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
	'Eighteen', 'Nineteen' ];
const TENS = [ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' ];
const INTERNATIONAL_SCALES = [ '', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion',
	'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion' ];

// 0–99.
function belowHundred( n ) {
	if ( n < 20 ) {
		return ONES[ n ];
	}
	return [ TENS[ Math.floor( n / 10 ) ], ONES[ n % 10 ] ].filter( Boolean ).join( ' ' );
}

// 0–999: "Four Hundred and Seventy Seven".
function belowThousand( n ) {
	const hundreds = Math.floor( n / 100 );
	const rest = n % 100;
	if ( ! hundreds ) {
		return belowHundred( rest );
	}
	return `${ ONES[ hundreds ] } Hundred` + ( rest ? ` and ${ belowHundred( rest ) }` : '' );
}

function join( parts ) {
	return parts.filter( Boolean ).join( ' ' );
}

// Digits → words, Indian system: ...crore, lakh, thousand, hundreds.
function indian( digits ) {
	digits = digits.replace( /^0+/, '' );
	if ( digits === '' ) {
		return '';
	}
	if ( digits.length > 7 ) {
		const crores = indian( digits.slice( 0, -7 ) );
		return join( [ crores && `${ crores } Crore`, indian( digits.slice( -7 ) ) ] );
	}
	const n = Number( digits );
	const lakh = Math.floor( n / 1e5 );
	const thousand = Math.floor( ( n % 1e5 ) / 1e3 );
	const rest = n % 1e3;
	return join( [
		lakh && `${ belowHundred( lakh ) } Lakh`,
		thousand && `${ belowHundred( thousand ) } Thousand`,
		belowThousand( rest ),
	] );
}

// Digits → words, international system: groups of three.
function international( digits ) {
	digits = digits.replace( /^0+/, '' );
	if ( digits === '' ) {
		return '';
	}
	const maxDigits = INTERNATIONAL_SCALES.length * 3;
	if ( digits.length > maxDigits ) {
		const top = international( digits.slice( 0, -( maxDigits - 3 ) ) );
		const last = INTERNATIONAL_SCALES[ INTERNATIONAL_SCALES.length - 1 ];
		return join( [ top && `${ top } ${ last }`, international( digits.slice( -( maxDigits - 3 ) ) ) ] );
	}
	const parts = [];
	for ( let end = digits.length, scale = 0; end > 0; end -= 3, scale++ ) {
		const group = Number( digits.slice( Math.max( 0, end - 3 ), end ) );
		if ( group ) {
			parts.unshift( join( [ belowThousand( group ), INTERNATIONAL_SCALES[ scale ] ] ) );
		}
	}
	return join( parts );
}

/**
 * Spells out an amount, rounded to a whole number.
 *
 * @param {(number|bigint|string)} value  A number, a BigInt, or a string of
 *                                       digits (for amounts beyond 2^53).
 * @param {Object} [options]
 * @param {string} [options.system='indian'] "indian" or "international".
 * @return {string} e.g. 2808477 → "Twenty Eight Lakh Eight Thousand Four Hundred and Seventy Seven".
 */
export function amountInWords( value, { system = 'indian' } = {} ) {
	if ( system !== 'indian' && system !== 'international' ) {
		throw new RangeError( `system must be "indian" or "international", got "${ system }".` );
	}
	let digits;
	let negative = false;
	if ( typeof value === 'number' ) {
		if ( ! Number.isFinite( value ) ) {
			throw new TypeError( `value must be a finite number, got ${ value }.` );
		}
		const rounded = Math.round( Math.abs( value ) );
		negative = value < 0 && rounded !== 0;
		digits = BigInt( rounded ).toString();
	} else if ( typeof value === 'bigint' ) {
		negative = value < 0n;
		digits = ( negative ? -value : value ).toString();
	} else if ( typeof value === 'string' && /^-?\d+$/.test( value.trim() ) ) {
		const trimmed = value.trim();
		negative = trimmed.startsWith( '-' ) && /[1-9]/.test( trimmed );
		digits = trimmed.replace( '-', '' );
	} else {
		throw new TypeError( `value must be a number, a BigInt or a string of digits, got ${ String( value ) }.` );
	}

	const words = system === 'indian' ? indian( digits ) : international( digits );
	if ( words === '' ) {
		return 'Zero';
	}
	return negative ? `Minus ${ words }` : words;
}
