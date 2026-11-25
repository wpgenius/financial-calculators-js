import { test, expect } from '@playwright/test';

test.beforeEach( async ( { page } ) => {
	await page.goto( '/test/fixtures/index.html' );
	await page.waitForFunction( () => window.esmReady === true );
} );

test( 'the minified build defines FinancialCalculators with the reference values', async ( { page } ) => {
	const out = await page.evaluate( () => {
		const FC = window.FinancialCalculators;
		return {
			version: FC.VERSION,
			sip: Math.round( FC.sip( { monthlyAmount: 25000, annualRate: 12, years: 10 } ).total ),
			emi: FC.formatCurrency( FC.emi( { principal: 100000, annualRate: 7, years: 1 } ).emi ),
			words: FC.amountInWords( 2808477 ),
			grouped: FC.formatNumber( 1234567 ),
			compact: FC.formatCompact( 25000000 ),
		};
	} );
	expect( out.version ).toMatch( /^\d+\.\d+\.\d+$/ );
	expect( out.sip ).toBe( 5808477 );
	expect( out.emi ).toBe( '₹8,653' );
	expect( out.words ).toBe( 'Twenty Eight Lakh Eight Thousand Four Hundred and Seventy Seven' );
	expect( out.grouped ).toBe( '12,34,567' );
	expect( out.compact ).toBe( '2.5Cr' );
} );

test( 'the ES module build exports the same functions and results', async ( { page } ) => {
	const out = await page.evaluate( () => ( {
		same: Object.keys( window.esm ).sort().join() === Object.keys( window.FinancialCalculators ).sort().join(),
		goal: Math.round( window.esm.goal( { presentCost: 1000000, currentSavings: 100000, inflationRate: 6, annualRate: 9, years: 3 } ).monthlyInvestment ),
		bigWords: window.esm.amountInWords( '100000000000000000000' ),
	} ) );
	expect( out.same ).toBe( true );
	expect( out.goal ).toBe( 25602 );
	expect( out.bigWords ).toBe( 'Ten Lakh Crore Crore' );
} );

test( 'the browser build leaves no globals besides FinancialCalculators', async ( { page } ) => {
	const extra = await page.evaluate( () => {
		const frame = document.createElement( 'iframe' );
		document.body.appendChild( frame );
		const clean = new Set( Object.keys( frame.contentWindow ) );
		return Object.keys( window ).filter( ( k ) => ! clean.has( k ) && ! /^\d+$/.test( k ) && ! [ 'esm', 'esmReady' ].includes( k ) );
	} );
	expect( extra ).toEqual( [ 'FinancialCalculators' ] );
} );
