import { test } from 'node:test';
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
