import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { formatNumber, formatCurrency, formatCompact, groupDigits, amountInWords } from '../src/index.js';

test( 'formatNumber: Indian and international grouping', () => {
	assert.equal( formatNumber( 5808477 ), '58,08,477' );
	assert.equal( formatNumber( 5808477, { system: 'international' } ), '5,808,477' );
	assert.equal( formatNumber( 123 ), '123' );
	assert.equal( formatNumber( 1234567.891, { decimals: 2 } ), '12,34,567.89' );
	assert.equal( formatNumber( 5808476.6 ), '58,08,477' );
	assert.equal( formatNumber( -1500 ), '-1,500' );
	assert.equal( formatNumber( -0.2 ), '0' );
	assert.equal( formatNumber( 1e15 ), '1,00,00,00,00,00,00,000' );
	assert.throws( () => formatNumber( NaN ), TypeError );
	assert.throws( () => formatNumber( 1, { system: 'roman' } ), RangeError );
	assert.throws( () => formatNumber( 1, { decimals: 1.5 } ), RangeError );
} );

test( 'groupDigits: the hand-made fallback matches Intl', () => {
	assert.equal( groupDigits( '1234567' ), '12,34,567' );
	assert.equal( groupDigits( '1234567', 'international' ), '1,234,567' );
	assert.equal( groupDigits( '100000' ), '1,00,000' );
	assert.equal( groupDigits( '999' ), '999' );
	assert.equal( groupDigits( '1000' ), '1,000' );
	for ( const n of [ 1000, 99999, 100000, 1234567, 98765432101 ] ) {
		assert.equal( groupDigits( String( n ) ), new Intl.NumberFormat( 'en-IN' ).format( n ) );
		assert.equal( groupDigits( String( n ), 'international' ), new Intl.NumberFormat( 'en-US' ).format( n ) );
	}
} );

test( 'formatCurrency: symbol before or after, sign first', () => {
	assert.equal( formatCurrency( 5808477 ), '₹58,08,477' );
	assert.equal( formatCurrency( -1500 ), '-₹1,500' );
	assert.equal( formatCurrency( 1500.5, { symbol: '$', system: 'international', decimals: 2 } ), '$1,500.50' );
	assert.equal( formatCurrency( 1500, { symbol: '€', position: 'after', system: 'international' } ), '1,500 €' );
} );

test( 'formatCompact: short forms for chart axes', () => {
	assert.equal( formatCompact( 0 ), '0' );
	assert.equal( formatCompact( 950 ), '950' );
	assert.equal( formatCompact( 2500 ), '2.5K' );
	assert.equal( formatCompact( 1500000 ), '15L' );
	assert.equal( formatCompact( 25000000 ), '2.5Cr' );
	assert.equal( formatCompact( 1500000000 ), '150Cr' );
	assert.equal( formatCompact( 1500000, { system: 'international' } ), '1.5M' );
	assert.equal( formatCompact( 2e12, { system: 'international' } ), '2T' );
	assert.equal( formatCompact( -1500000 ), '-15L' );
} );

test( 'amountInWords: Ara reference values', () => {
	assert.equal( amountInWords( 2808477 ), 'Twenty Eight Lakh Eight Thousand Four Hundred and Seventy Seven' );
	assert.equal( amountInWords( 3000000 ), 'Thirty Lakh' );
	assert.equal( amountInWords( 1191016 ), 'Eleven Lakh Ninety One Thousand Sixteen' );
	assert.equal( amountInWords( 25000 ), 'Twenty Five Thousand' );
} );

test( 'amountInWords: small numbers and rounding', () => {
	assert.equal( amountInWords( 0 ), 'Zero' );
	assert.equal( amountInWords( 0.4 ), 'Zero' );
	assert.equal( amountInWords( 7 ), 'Seven' );
	assert.equal( amountInWords( 15 ), 'Fifteen' );
	assert.equal( amountInWords( 40 ), 'Forty' );
	assert.equal( amountInWords( 100 ), 'One Hundred' );
	assert.equal( amountInWords( 101 ), 'One Hundred and One' );
	assert.equal( amountInWords( 999.6 ), 'One Thousand' );
	assert.equal( amountInWords( -1500 ), 'Minus One Thousand Five Hundred' );
} );

test( 'amountInWords: Indian system beyond 10 digits (no limit)', () => {
	assert.equal( amountInWords( 1e7 ), 'One Crore' );
	assert.equal( amountInWords( 1e10 ), 'One Thousand Crore' );
	assert.equal( amountInWords( 1e12 ), 'One Lakh Crore' );
	assert.equal( amountInWords( 132940859800 ), 'Thirteen Thousand Two Hundred and Ninety Four Crore Eight Lakh Fifty Nine Thousand Eight Hundred' );
	assert.equal( amountInWords( 1e14 ), 'One Crore Crore' );
	assert.equal( amountInWords( '100000000000000000000' ), 'Ten Lakh Crore Crore' );
} );

test( 'amountInWords: international system', () => {
	const intl = { system: 'international' };
	assert.equal( amountInWords( 5808477, intl ), 'Five Million Eight Hundred and Eight Thousand Four Hundred and Seventy Seven' );
	assert.equal( amountInWords( 1e9, intl ), 'One Billion' );
	assert.equal( amountInWords( 1000001, intl ), 'One Million One' );
	assert.equal( amountInWords( 10n ** 33n, intl ), 'One Decillion' );
	assert.equal( amountInWords( 10n ** 36n, intl ), 'One Thousand Decillion' );
	assert.equal( amountInWords( -( 10n ** 6n ), intl ), 'Minus One Million' );
} );

test( 'amountInWords: bad input throws', () => {
	assert.throws( () => amountInWords( NaN ), TypeError );
	assert.throws( () => amountInWords( '12a' ), TypeError );
	assert.throws( () => amountInWords( 1, { system: 'roman' } ), RangeError );
} );

test( 'formatNumber gives the same output when called repeatedly (cached formatters)', () => {
	for ( let i = 0; i < 3; i++ ) {
		assert.equal( formatNumber( 1234567.891, { decimals: 2 } ), '12,34,567.89' );
		assert.equal( formatNumber( 1234567.891, { decimals: 1, system: 'international' } ), '1,234,567.9' );
		assert.equal( formatNumber( 1234567.891 ), '12,34,568' );
	}
} );

// Hindi words (Devanagari), as a translation example.
const hindi = {
	ones: [ '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस' ],
	tens: [ '', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे' ],
	hundred: 'सौ',
	and: '',
	zero: 'शून्य',
	minus: 'ऋण',
	indian: { thousand: 'हज़ार', lakh: 'लाख', crore: 'करोड़' },
};

test( 'amountInWords: your own words (translation)', () => {
	assert.equal( amountInWords( 3000000, { words: hindi } ), 'तीस लाख' );
	assert.equal( amountInWords( 150000, { words: hindi } ), 'एक लाख पचास हज़ार' );
	assert.equal( amountInWords( 0, { words: hindi } ), 'शून्य' );
	assert.equal( amountInWords( -205, { words: hindi } ), 'ऋण दो सौ पाँच' );
	assert.equal( amountInWords( 1e10, { words: hindi } ), 'एक हज़ार करोड़' );
} );

test( 'amountInWords: partial words merge with English, and "and" can be dropped', () => {
	assert.equal( amountInWords( 101, { words: { and: '' } } ), 'One Hundred One' );
	assert.equal( amountInWords( 2500000, { words: { indian: { lakh: 'Lac' } } } ), 'Twenty Five Lac' );
	const scales = [ '', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion' ];
	assert.equal( amountInWords( 2e9, { system: 'international', words: { international: scales } } ), 'Two billion' );
	assert.equal( amountInWords( 2808477 ), 'Twenty Eight Lakh Eight Thousand Four Hundred and Seventy Seven' );
} );

test( 'amountInWords: badly shaped words throw', () => {
	assert.throws( () => amountInWords( 1, { words: { ones: [ 'a' ] } } ), /ones must be an array of 20 strings/ );
	assert.throws( () => amountInWords( 1, { words: { tens: 'x' } } ), TypeError );
	assert.throws( () => amountInWords( 1, { words: { hundred: 5 } } ), TypeError );
	assert.throws( () => amountInWords( 1, { words: { indian: { lakh: 1 } } } ), TypeError );
	assert.throws( () => amountInWords( 1, { words: 'hindi' } ), TypeError );
} );

test( 'formatCompact moves up a unit when rounding reaches it (#21)', () => {
	assert.equal( formatCompact( 999999, { system: 'international' } ), '1M' );
	assert.equal( formatCompact( 99999 ), '1L' );
	assert.equal( formatCompact( 9999999 ), '1Cr' );
	assert.equal( formatCompact( 999950000, { system: 'international' } ), '1B' );
	assert.equal( formatCompact( 999.6 ), '1K' );
	assert.equal( formatCompact( 999.4 ), '999' );
	assert.equal( formatCompact( -999999, { system: 'international' } ), '-1M' );
	assert.equal( formatCompact( 500000, { system: 'international', decimals: 0 } ), '500K' );
	assert.equal( formatCompact( 1e15, { system: 'international' } ), '1,000T' );
} );

test( 'formatCurrency rejects an unknown position (#26)', () => {
	assert.throws( () => formatCurrency( 5, { position: 'middle' } ), /position must be "before" or "after"/ );
} );

test( 'the hand-made fallback (no en-IN in Intl) keeps every digit of huge numbers (#27)', () => {
	const script = `
		Intl.NumberFormat = function () { throw new Error( 'no locales' ); };
		const { formatNumber } = await import( ${ JSON.stringify( new URL( '../src/index.js', import.meta.url ).href ) } );
		console.log( JSON.stringify( [ formatNumber( 1e21 ), formatNumber( 1e21, { system: 'international', decimals: 2 } ), formatNumber( 1234567.891, { decimals: 2 } ), formatNumber( -1500 ) ] ) );
	`;
	const out = JSON.parse( execFileSync( process.execPath, [ '--input-type=module', '-e', script ], { encoding: 'utf8' } ) );
	assert.deepEqual( out, [ '1,00,00,00,00,00,00,00,00,00,000', '1,000,000,000,000,000,000,000.00', '12,34,567.89', '-1,500' ] );
} );

test( 'the hand-made fallback rounds like Intl: halves away from zero, tiny values, no "-0" (#38)', () => {
	const values = [ [ 1.005, 2 ], [ 2.5, 0 ], [ -2.5, 0 ], [ 0.125, 2 ], [ 1e-7, 2 ], [ 9.995, 2 ], [ 999.5, 0 ], [ -0.004, 2 ], [ 123456.789, 1 ] ];
	const script = `
		Intl.NumberFormat = function () { throw new Error( 'no locales' ); };
		const { formatNumber } = await import( ${ JSON.stringify( new URL( '../src/index.js', import.meta.url ).href ) } );
		console.log( JSON.stringify( ${ JSON.stringify( values ) }.map( ( [ v, decimals ] ) => formatNumber( v, { decimals } ) ) ) );
	`;
	const out = JSON.parse( execFileSync( process.execPath, [ '--input-type=module', '-e', script ], { encoding: 'utf8' } ) );
	assert.deepEqual( out, values.map( ( [ v, decimals ] ) => formatNumber( v, { decimals } ) ) );
	assert.deepEqual( out.slice( 0, 2 ), [ '1.01', '3' ] );
} );

test( 'formatCompact drops trailing zeros (#33)', () => {
	assert.equal( formatCompact( 150000, { decimals: 2 } ), '1.5L' );
	assert.equal( formatCompact( 1234567, { decimals: 2 } ), '12.35L' );
	assert.equal( formatCompact( 2000000, { system: 'international', decimals: 3 } ), '2M' );
} );

test( 'groupDigits checks its inputs (#36)', () => {
	assert.throws( () => groupDigits( 1234567 ), TypeError );
	assert.throws( () => groupDigits( '12a4' ), TypeError );
	assert.throws( () => groupDigits( '12', 'roman' ), RangeError );
} );

test( 'amountInWords: belowHundred gives every word up to 99 (#30)', () => {
	const belowHundred = Array.from( { length: 100 }, ( _, n ) => `w${ n }` );
	assert.equal( amountInWords( 21, { words: { belowHundred } } ), 'w21' );
	assert.equal( amountInWords( 2121, { words: { belowHundred, and: '' } } ), 'w2 Thousand w1 Hundred w21' );
	assert.equal( amountInWords( 4500000, { words: { belowHundred } } ), 'w45 Lakh' );
	assert.equal( amountInWords( 21, { words: { belowHundred }, system: 'international' } ), 'w21' );
	assert.throws( () => amountInWords( 1, { words: { belowHundred: [ 'one' ] } } ), /belowHundred must be an array of 100 strings/ );
} );
