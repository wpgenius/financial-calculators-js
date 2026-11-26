// Spreadsheet reference values and property-based tests: invariants that must
// hold for any valid input, checked on random inputs from a seeded generator
// (the same inputs on every run, so a failure can be reproduced).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sip, lumpsum, swp, goal, emi, formatNumber, amountInWords } from '../src/index.js';

const near = ( actual, expected, tolerance ) =>
	assert.ok( Math.abs( actual - expected ) <= tolerance, `${ actual } ≈ ${ expected } (±${ tolerance })` );

// Spreadsheet formulas (Excel, Google Sheets, LibreOffice give the same values).
test( 'matches spreadsheet FV and PMT', () => {
	// =FV(5%/12, 120, -100, 0, 1): 100 a month at the start of each month.
	near( sip( { monthlyAmount: 100, annualRate: 5, years: 10 } ).total, 15592.93, 0.01 );
	// =FV(5%/12, 120, 0, -10000) and =FV(5%, 10, 0, -10000)
	near( lumpsum( { amount: 10000, annualRate: 5, years: 10, compoundingPerYear: 12 } ).total, 16470.09, 0.01 );
	near( lumpsum( { amount: 10000, annualRate: 5, years: 10 } ).total, 16288.95, 0.01 );
	// =PMT(6%/12, 360, -200000), =PMT(5%/12, 180, -100000), =PMT(7%/12, 12, -100000)
	near( emi( { principal: 200000, annualRate: 6, years: 30 } ).emi, 1199.10, 0.01 );
	near( emi( { principal: 100000, annualRate: 5, years: 15 } ).emi, 790.79, 0.01 );
	near( emi( { principal: 100000, annualRate: 7, years: 1 } ).emi, 8652.67, 0.01 );
} );

test( 'tiny rates stay accurate (no loss of precision near 0%)', () => {
	for ( const annualRate of [ 1e-9, 1e-13 ] ) {
		near( sip( { monthlyAmount: 1000, annualRate, years: 10 } ).total, 120000, 0.01 );
		near( emi( { principal: 120000, annualRate, years: 10 } ).emi, 1000, 1e-6 );
	}
} );

// Mulberry32: a small seeded generator.
function generator( seed ) {
	return () => {
		seed = ( seed + 0x6d2b79f5 ) | 0;
		let t = Math.imul( seed ^ ( seed >>> 15 ), 1 | seed );
		t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;
		return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
	};
}

const random = generator( 20261126 );
const between = ( min, max ) => min + random() * ( max - min );
const cases = ( count, make ) => Array.from( { length: count }, make );
const relative = ( a, b ) => Math.abs( a - b ) / Math.max( 1, Math.abs( b ) );
const rate = () => ( random() < 0.1 ? 0 : between( 0, 30 ) );
const years = () => Math.round( between( 1, 480 ) ) / 12;

test( 'sip and lumpsum: invested + returns = total, the series ends at the total and never falls', () => {
	for ( const inputs of cases( 200, () => ( { monthlyAmount: between( 0, 1e6 ), annualRate: rate(), years: years() } ) ) ) {
		const r = sip( inputs );
		assert.ok( relative( r.invested + r.returns, r.total ) < 1e-12, JSON.stringify( inputs ) );
		assert.ok( r.total >= r.invested - 1e-6 );
		assert.ok( relative( r.series.at( -1 ).total, r.total ) < 1e-12 );
		r.series.slice( 1 ).forEach( ( p, k ) => assert.ok( p.total >= r.series[ k ].total ) );
	}
	for ( const inputs of cases( 200, () => ( { amount: between( 0, 1e8 ), annualRate: rate(), years: years(), compoundingPerYear: [ 1, 2, 4, 12 ][ Math.floor( random() * 4 ) ] } ) ) ) {
		const r = lumpsum( inputs );
		assert.ok( relative( r.invested + r.returns, r.total ) < 1e-12, JSON.stringify( inputs ) );
		assert.ok( relative( r.series.at( -1 ).total, r.total ) < 1e-12 );
	}
} );

test( 'emi: the payments repay the loan, interest + principal = total payment, the balance ends at 0', () => {
	for ( const inputs of cases( 200, () => ( { principal: between( 1, 1e8 ), annualRate: rate(), years: years() } ) ) ) {
		const r = emi( inputs );
		const paid = r.schedule.reduce( ( sum, row ) => sum + row.principalPaid, 0 );
		const interest = r.schedule.reduce( ( sum, row ) => sum + row.interestPaid, 0 );
		assert.ok( relative( paid, r.principal ) < 1e-9, JSON.stringify( inputs ) );
		assert.ok( relative( interest, r.totalInterest ) < 1e-9, JSON.stringify( inputs ) );
		assert.ok( relative( r.principal + r.totalInterest, r.totalPayment ) < 1e-12 );
		assert.ok( r.schedule.at( -1 ).balance < 1e-6 * r.principal );
		assert.ok( r.series.every( ( p ) => p.balance >= 0 ) );
	}
} );

test( 'swp: the balance never goes negative and the totals add up', () => {
	for ( const inputs of cases( 200, () => ( { investment: between( 0, 1e8 ), monthlyWithdrawal: between( 0, 1e6 ), annualRate: rate(), years: years() } ) ) ) {
		const r = swp( inputs );
		assert.ok( r.series.every( ( p ) => p.balance >= 0 ), JSON.stringify( inputs ) );
		assert.ok( r.totalWithdrawn <= inputs.monthlyWithdrawal * r.months * ( 1 + 1e-12 ) );
		assert.ok( relative( r.finalBalance + r.totalWithdrawn - r.investment, r.returns ) < 1e-9 );
		assert.equal( r.series.at( -1 ).withdrawn, r.totalWithdrawn );
		if ( r.depletedMonth !== null ) {
			assert.equal( r.finalBalance, 0 );
		}
	}
} );

test( 'goal: savings plus the monthly investment reach the future cost', () => {
	for ( const inputs of cases( 200, () => ( { presentCost: between( 1, 1e8 ), currentSavings: random() < 0.3 ? 0 : between( 0, 1e8 ), inflationRate: between( 0, 15 ), annualRate: rate(), years: years() } ) ) ) {
		const r = goal( inputs );
		assert.ok( r.monthlyInvestment >= 0, JSON.stringify( inputs ) );
		assert.ok( r.series.at( -1 ).total >= r.futureCost * ( 1 - 1e-9 ), JSON.stringify( inputs ) );
		if ( r.shortfall > 0 ) {
			assert.ok( relative( r.series.at( -1 ).total, r.futureCost ) < 1e-9 );
		}
	}
} );

test( 'formatting: the grouped digits read back as the rounded number', () => {
	for ( const value of cases( 300, () => ( random() < 0.5 ? -1 : 1 ) * Math.round( between( 0, 1e15 ) ) ) ) {
		for ( const system of [ 'indian', 'international' ] ) {
			assert.equal( Number( formatNumber( value, { system } ).replace( /,/g, '' ) ), value );
		}
		assert.ok( amountInWords( value ).length > 0 );
	}
} );
