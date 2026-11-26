import { test, expect } from '@playwright/test';

// The website demos, from _site/ (npm run site). Chart.js comes from a CDN; the
// tests block it so they never depend on the network, and the results must
// still work without it.
test.beforeEach( async ( { page } ) => {
	await page.route( /cdn\.jsdelivr\.net|api\.github\.com/, ( route ) => route.abort() );
	await page.goto( '/_site/index.html' );
} );

test( 'the SIP demo shows the reference result and updates with the inputs', async ( { page } ) => {
	const demo = page.locator( '#calc-demo' );
	await expect( demo.locator( '.result.main .v' ) ).toHaveText( '₹58,08,477' );
	await expect( demo.locator( '[data-words]' ) ).toHaveText( 'Fifty Eight Lakh Eight Thousand Four Hundred and Seventy Seven rupees' );
	await demo.getByLabel( 'Time period (years)' ).fill( '20' );
	await expect( demo.locator( '.result.main .v' ) ).not.toHaveText( '₹58,08,477' );
	await expect( demo.locator( '[data-code]' ) ).toContainText( "calculate( 'sip'" );
	await expect( demo.locator( '.chart-fallback' ) ).toBeVisible();
} );

test( 'every calculator tab renders results', async ( { page } ) => {
	const demo = page.locator( '#calc-demo' );
	for ( const [ tab, main ] of [ [ 'Lump sum', /₹/ ], [ 'SWP', /₹/ ], [ 'Goal', /₹/ ], [ 'EMI', '₹26,035' ] ] ) {
		await demo.getByRole( 'tab', { name: tab, exact: true } ).click();
		await expect( demo.locator( '.result.main .v' ) ).toHaveText( main );
	}
	await expect( demo.locator( '[data-table] tbody tr' ) ).toHaveCount( 20 );
} );

test( 'the goal demo shows the target year from startYear', async ( { page } ) => {
	const demo = page.locator( '#calc-demo' );
	await demo.getByRole( 'tab', { name: 'Goal', exact: true } ).click();
	const year = new Date().getFullYear() + 5;
	await expect( demo.locator( '[data-note]' ) ).toHaveText( 'Target year: ' + year + '.' );
	await expect( demo.locator( '[data-code]' ) ).toContainText( 'startYear: ' + ( year - 5 ) );
} );

test( 'SWP warns when the money runs out', async ( { page } ) => {
	const demo = page.locator( '#calc-demo' );
	await demo.getByRole( 'tab', { name: 'SWP', exact: true } ).click();
	await demo.getByLabel( 'Monthly withdrawal ($)' ).or( demo.getByLabel( 'Monthly withdrawal (₹)' ) ).fill( '50000' );
	await expect( demo.locator( '[data-note]' ) ).toContainText( 'The money runs out in month' );
} );

test( 'the format switch changes grouping and currency', async ( { page } ) => {
	const demo = page.locator( '#calc-demo' );
	await demo.getByRole( 'button', { name: '$ 1,234,567' } ).click();
	await expect( demo.locator( '.result.main .v' ) ).toHaveText( '$5,808,477' );
} );

test( 'the formatting demo handles amounts beyond 999 crore', async ( { page } ) => {
	const fmt = page.locator( '#format-demo' );
	await fmt.getByLabel( 'Amount' ).fill( '1000000000000' );
	await expect( fmt.locator( '[data-out="in-words"]' ) ).toHaveText( 'One Lakh Crore' );
	await expect( fmt.locator( '[data-out="int-words"]' ) ).toHaveText( 'One Trillion' );
	await expect( fmt.locator( '[data-out="in-number"]' ) ).toHaveText( '10,00,00,00,00,000' );
} );

test( 'the theme toggle switches and remembers dark mode', async ( { page } ) => {
	const html = page.locator( 'html' );
	const before = await html.getAttribute( 'data-theme' );
	await page.getByRole( 'button', { name: 'Dark page theme' } ).click();
	await expect( html ).not.toHaveAttribute( 'data-theme', before );
	await page.reload();
	await expect( html ).not.toHaveAttribute( 'data-theme', before );
} );

test( 'the docs page loads with its table of contents', async ( { page } ) => {
	await page.goto( '/_site/docs.html' );
	await expect( page.getByRole( 'heading', { name: 'Documentation' } ) ).toBeVisible();
	await expect( page.locator( '.toc a' ) ).toHaveCount( 16 );
	await expect( page.locator( '[data-version]' ) ).toHaveText( /^v\d/ );
} );
