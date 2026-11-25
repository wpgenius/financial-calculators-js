/**
 * Amounts in words, in the Indian (lakh, crore) or international (million,
 * billion...) system, with no limit on size: above the largest named unit
 * the words repeat ("One Thousand Crore", "One Thousand Decillion").
 *
 * The words are English by default; pass `words` to use your own (for
 * translations). The structure stays the same: hundreds, then tens and ones,
 * then the unit name.
 */

const ENGLISH = {
	ones: [ '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
		'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
		'Eighteen', 'Nineteen' ],
	tens: [ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' ],
	hundred: 'Hundred',
	and: 'and',
	zero: 'Zero',
	minus: 'Minus',
	indian: { thousand: 'Thousand', lakh: 'Lakh', crore: 'Crore' },
	international: [ '', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion',
		'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion' ],
};

const STRING_KEYS = [ 'hundred', 'and', 'zero', 'minus' ];

/**
 * Merges custom words with the English defaults and checks their shape.
 *
 * @param {Object} [custom] Partial words object.
 * @return {Object} A complete words object.
 */
function readWords( custom ) {
	if ( custom === undefined ) {
		return ENGLISH;
	}
	if ( ! custom || typeof custom !== 'object' ) {
		throw new TypeError( 'words must be an object.' );
	}
	const list = ( key, length ) => {
		if ( custom[ key ] === undefined ) {
			return ENGLISH[ key ];
		}
		const value = custom[ key ];
		if ( ! Array.isArray( value ) || value.length !== length || ! value.every( ( w ) => typeof w === 'string' ) ) {
			throw new TypeError( `words.${ key } must be an array of ${ length } strings.` );
		}
		return value;
	};
	const words = {
		ones: list( 'ones', 20 ),
		tens: list( 'tens', 10 ),
		international: list( 'international', ENGLISH.international.length ),
		indian: { ...ENGLISH.indian },
	};
	for ( const key of STRING_KEYS ) {
		if ( custom[ key ] !== undefined && typeof custom[ key ] !== 'string' ) {
			throw new TypeError( `words.${ key } must be a string.` );
		}
		words[ key ] = custom[ key ] ?? ENGLISH[ key ];
	}
	if ( custom.indian !== undefined ) {
		if ( ! custom.indian || typeof custom.indian !== 'object' ) {
			throw new TypeError( 'words.indian must be an object with thousand, lakh and crore.' );
		}
		for ( const key of Object.keys( ENGLISH.indian ) ) {
			if ( custom.indian[ key ] !== undefined ) {
				if ( typeof custom.indian[ key ] !== 'string' ) {
					throw new TypeError( `words.indian.${ key } must be a string.` );
				}
				words.indian[ key ] = custom.indian[ key ];
			}
		}
	}
	return words;
}

function join( parts ) {
	return parts.filter( Boolean ).join( ' ' );
}

// 0–99.
function belowHundred( n, w ) {
	if ( n < 20 ) {
		return w.ones[ n ];
	}
	return join( [ w.tens[ Math.floor( n / 10 ) ], w.ones[ n % 10 ] ] );
}

// 0–999: "Four Hundred and Seventy Seven".
function belowThousand( n, w ) {
	const hundreds = Math.floor( n / 100 );
	const rest = n % 100;
	if ( ! hundreds ) {
		return belowHundred( rest, w );
	}
	return join( [ w.ones[ hundreds ], w.hundred, rest ? w.and : '', rest ? belowHundred( rest, w ) : '' ] );
}

// Digits → words, Indian system: ...crore, lakh, thousand, hundreds.
function indian( digits, w ) {
	digits = digits.replace( /^0+/, '' );
	if ( digits === '' ) {
		return '';
	}
	if ( digits.length > 7 ) {
		const crores = indian( digits.slice( 0, -7 ), w );
		return join( [ crores && `${ crores } ${ w.indian.crore }`, indian( digits.slice( -7 ), w ) ] );
	}
	const n = Number( digits );
	const lakh = Math.floor( n / 1e5 );
	const thousand = Math.floor( ( n % 1e5 ) / 1e3 );
	const rest = n % 1e3;
	return join( [
		lakh && `${ belowHundred( lakh, w ) } ${ w.indian.lakh }`,
		thousand && `${ belowHundred( thousand, w ) } ${ w.indian.thousand }`,
		belowThousand( rest, w ),
	] );
}

// Digits → words, international system: groups of three.
function international( digits, w ) {
	digits = digits.replace( /^0+/, '' );
	if ( digits === '' ) {
		return '';
	}
	const scales = w.international;
	const maxDigits = scales.length * 3;
	if ( digits.length > maxDigits ) {
		const top = international( digits.slice( 0, -( maxDigits - 3 ) ), w );
		const last = scales[ scales.length - 1 ];
		return join( [ top && `${ top } ${ last }`, international( digits.slice( -( maxDigits - 3 ) ), w ) ] );
	}
	const parts = [];
	for ( let end = digits.length, scale = 0; end > 0; end -= 3, scale++ ) {
		const group = Number( digits.slice( Math.max( 0, end - 3 ), end ) );
		if ( group ) {
			parts.unshift( join( [ belowThousand( group, w ), scales[ scale ] ] ) );
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
 * @param {Object} [options.words]           Your own words, merged with the English ones:
 *        ones (20 strings, 0–19), tens (10 strings), hundred, and ('' to leave it out),
 *        zero, minus, indian { thousand, lakh, crore }, international (12 strings:
 *        '', thousand, million … decillion).
 * @return {string} e.g. 2808477 → "Twenty Eight Lakh Eight Thousand Four Hundred and Seventy Seven".
 */
export function amountInWords( value, { system = 'indian', words } = {} ) {
	if ( system !== 'indian' && system !== 'international' ) {
		throw new RangeError( `system must be "indian" or "international", got "${ system }".` );
	}
	const w = readWords( words );
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

	const text = system === 'indian' ? indian( digits, w ) : international( digits, w );
	if ( text === '' ) {
		return w.zero;
	}
	return negative ? join( [ w.minus, text ] ) : text;
}
