import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sip, lumpsum, swp, goal, emi, calculate, register, types } from '../src/index.js';

const round = Math.round;
const near = ( actual, expected, tolerance = 0.5 ) =>
	assert.ok( Math.abs( actual - expected ) <= tolerance, `${ actual } ≈ ${ expected }` );

test( 'sip: Ara reference, 25,000 a month at 12% for 10 years', () => {
	const r = sip( { monthlyAmount: 25000, annualRate: 12, years: 10 } );
	assert.equal( round( r.invested ), 3000000 );
	assert.equal( round( r.returns ), 2808477 );
	assert.equal( round( r.total ), 5808477 );
	assert.equal( r.months, 120 );
	assert.equal( r.series.length, 11 );
	assert.deepEqual( r.series[ 0 ], { year: 0, month: 0, invested: 0, total: 0 } );
	assert.equal( round( r.series[ 10 ].total ), 5808477 );
} );

test( 'sip: a 1% rate is calculated (the old plugin ignored it)', () => {
	const r = sip( { monthlyAmount: 25000, annualRate: 1, years: 10 } );
	assert.ok( r.total > r.invested );
	// Same value month by month: add the instalment, then a month's growth.
	let value = 0;
	for ( let m = 0; m < 120; m++ ) {
		value = ( value + 25000 ) * ( 1 + 0.01 / 12 );
	}
	near( r.total, value, 1e-6 );
	assert.equal( round( r.total ), 3156375 );
} );

test( 'sip: 0% returns exactly what was invested', () => {
	const r = sip( { monthlyAmount: 1000, annualRate: 0, years: 2 } );
	assert.equal( r.total, 24000 );
	assert.equal( r.returns, 0 );
} );

test( 'sip: half years give a final point at the exact month', () => {
	const r = sip( { monthlyAmount: 1000, annualRate: 12, years: 2.5 } );
	assert.equal( r.months, 30 );
	assert.deepEqual( r.series.map( ( p ) => p.year ), [ 0, 1, 2, 2.5 ] );
} );

test( 'lumpsum: Ara reference, 25,000 at 12% for 10 years', () => {
	const r = lumpsum( { amount: 25000, annualRate: 12, years: 10 } );
	assert.equal( round( r.total ), 77646 );
	assert.equal( round( r.returns ), 52646 );
	assert.equal( r.series[ 0 ].total, 25000 );
} );

test( 'lumpsum: quarterly compounding', () => {
	const r = lumpsum( { amount: 100000, annualRate: 8, years: 5, compoundingPerYear: 4 } );
	near( r.total, 148594.74, 0.01 );
} );

test( 'swp: Ara reference, 10 lakh, 10,000 a month at 10% for 3 years', () => {
	const r = swp( { investment: 1000000, monthlyWithdrawal: 10000, annualRate: 10, years: 3 } );
	assert.equal( r.totalWithdrawn, 360000 );
	// The old plugin truncated (9,26,881); the value is 9,26,881.5…
	assert.equal( Math.trunc( r.finalBalance ), 926881 );
	assert.equal( r.depletedMonth, null );
	near( r.returns, r.finalBalance + 360000 - 1000000, 1e-6 );
} );

test( 'swp: the balance stops at zero and reports the month it ran out', () => {
	const r = swp( { investment: 100000, monthlyWithdrawal: 10000, annualRate: 10, years: 3 } );
	assert.equal( r.finalBalance, 0 );
	assert.equal( r.depletedMonth, 11 );
	assert.ok( r.totalWithdrawn > 100000 && r.totalWithdrawn < 110000 );
	assert.ok( r.series.every( ( p ) => p.balance >= 0 ) );
	assert.equal( r.series.at( -1 ).withdrawn, r.totalWithdrawn );
} );

test( 'goal: Ara reference, 10 lakh goal, 1 lakh saved, 6% inflation, 9% return, 3 years', () => {
	const r = goal( { presentCost: 1000000, currentSavings: 100000, inflationRate: 6, annualRate: 9, years: 3 } );
	assert.equal( round( r.futureCost ), 1191016 );
	assert.equal( round( r.monthlyInvestment ), 25602 );
	near( r.series.at( -1 ).total, r.futureCost, 0.01 );
} );

test( 'goal: savings may be 0', () => {
	const r = goal( { presentCost: 1000000, inflationRate: 6, annualRate: 9, years: 3 } );
	assert.equal( r.savingsFutureValue, 0 );
	assert.ok( r.monthlyInvestment > 25602 );
} );

test( 'goal: savings above the goal need no monthly investment', () => {
	const r = goal( { presentCost: 100000, currentSavings: 500000, inflationRate: 6, annualRate: 9, years: 3 } );
	assert.equal( r.shortfall, 0 );
	assert.equal( r.monthlyInvestment, 0 );
	assert.equal( r.totalInvested, 0 );
} );

test( 'emi: Ara reference, 1 lakh at 7% for 1 year', () => {
	const r = emi( { principal: 100000, annualRate: 7, years: 1 } );
	assert.equal( round( r.emi ), 8653 );
	assert.equal( round( r.totalInterest ), 3832 );
	assert.equal( round( r.totalPayment ), 103832 );
	assert.equal( r.schedule.length, 1 );
	near( r.schedule[ 0 ].principalPaid, 100000, 1e-6 );
	assert.equal( r.schedule[ 0 ].balance, 0 );
} );

test( 'emi: 30 lakh home loan at 8.5% for 20 years, yearly schedule adds up', () => {
	const r = emi( { principal: 3000000, annualRate: 8.5, years: 20 } );
	assert.equal( round( r.emi ), 26035 );
	assert.equal( r.schedule.length, 20 );
	const principal = r.schedule.reduce( ( sum, row ) => sum + row.principalPaid, 0 );
	const interest = r.schedule.reduce( ( sum, row ) => sum + row.interestPaid, 0 );
	near( principal, 3000000, 1e-4 );
	near( interest, r.totalInterest, 0.01 );
	assert.equal( r.schedule.at( -1 ).balance, 0 );
	assert.ok( r.schedule[ 0 ].interestPaid > r.schedule[ 0 ].principalPaid );
} );

test( 'emi: 0% interest splits the loan evenly', () => {
	const r = emi( { principal: 120000, annualRate: 0, years: 1 } );
	assert.equal( r.emi, 10000 );
	assert.equal( r.totalInterest, 0 );
} );

test( 'inputs: numeric strings are accepted, bad values throw', () => {
	assert.equal( round( sip( { monthlyAmount: '25000', annualRate: '12', years: '10' } ).total ), 5808477 );
	assert.throws( () => sip( { monthlyAmount: 'abc', annualRate: 12, years: 10 } ), TypeError );
	assert.throws( () => sip( { monthlyAmount: 1000, annualRate: -1, years: 10 } ), RangeError );
	assert.throws( () => sip( { monthlyAmount: 1000, annualRate: 12, years: 0 } ), RangeError );
	assert.throws( () => emi( { principal: NaN, annualRate: 7, years: 1 } ), TypeError );
	assert.throws( () => lumpsum( { amount: 1, annualRate: 1, years: 1, compoundingPerYear: 0 } ), RangeError );
} );

test( 'calculate, types and register', () => {
	assert.deepEqual( types(), [ 'sip', 'lumpsum', 'swp', 'goal', 'emi' ] );
	assert.equal( round( calculate( 'emi', { principal: 100000, annualRate: 7, years: 1 } ).emi ), 8653 );
	assert.throws( () => calculate( 'nope', {} ), /Unknown calculator "nope"/ );
	assert.throws( () => calculate( 'toString', {} ), /Unknown calculator/ );
	register( 'double', ( { value } ) => ( { result: value * 2 } ) );
	assert.deepEqual( calculate( 'double', { value: 21 } ), { result: 42 } );
	assert.throws( () => register( '', () => {} ), TypeError );
} );
