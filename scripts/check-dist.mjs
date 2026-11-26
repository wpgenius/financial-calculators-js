// Checks the build: each file exists, the browser files define the global
// FinancialCalculators (run in a bare sandbox, like a <script> tag), the ES
// module and the CommonJS file export the same names, and all give the same
// SIP result.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const expectedExports = [
	'VERSION', 'amountInWords', 'calculate', 'emi', 'formatCompact', 'formatCurrency',
	'formatNumber', 'goal', 'groupDigits', 'lumpsum', 'register', 'sip', 'swp', 'types',
];
const sipInputs = { monthlyAmount: 25000, annualRate: 12, years: 10 };

for ( const file of [ 'financial-calculators.js', 'financial-calculators.min.js' ] ) {
	const sandbox = {};
	sandbox.window = sandbox;
	runInNewContext( readFileSync( `dist/${ file }`, 'utf8' ), sandbox );
	const lib = sandbox.FinancialCalculators;
	assert.ok( lib, `${ file } defines FinancialCalculators` );
	assert.deepEqual( Object.keys( lib ).sort(), expectedExports, `${ file } exports` );
	assert.equal( Math.round( lib.sip( sipInputs ).total ), 5808477, `${ file } SIP` );
	console.log( `ok ${ file } (version ${ lib.VERSION })` );
}

const esm = await import( new URL( '../dist/financial-calculators.esm.js', import.meta.url ) );
assert.deepEqual( Object.keys( esm ).sort(), expectedExports, 'esm exports' );
assert.equal( Math.round( esm.sip( sipInputs ).total ), 5808477, 'esm SIP' );
console.log( `ok financial-calculators.esm.js (version ${ esm.VERSION })` );

const cjs = createRequire( import.meta.url )( '../dist/financial-calculators.cjs' );
assert.deepEqual( Object.keys( cjs ).sort(), expectedExports, 'cjs exports' );
assert.equal( Math.round( cjs.sip( sipInputs ).total ), 5808477, 'cjs SIP' );
assert.ok( existsSync( 'dist/financial-calculators.d.cts' ), 'CommonJS types' );
console.log( `ok financial-calculators.cjs (version ${ cjs.VERSION })` );
