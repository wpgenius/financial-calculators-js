// Fails when a build file grows past its budget (minified and gzipped bytes).
// Raise a budget on purpose, in the same PR as the change that needs it.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const budgets = [
	{ file: 'dist/financial-calculators.min.js', min: 10 * 1024, gzip: 4 * 1024 },
	{ file: 'dist/financial-calculators.esm.js', min: 20 * 1024, gzip: 6 * 1024 },
];

let failed = false;
for ( const { file, min, gzip } of budgets ) {
	const source = readFileSync( file );
	const size = source.length;
	const zipped = gzipSync( source, { level: 9 } ).length;
	const ok = size <= min && zipped <= gzip;
	failed ||= ! ok;
	console.log( `${ ok ? 'ok  ' : 'FAIL' } ${ file }: ${ size } B (budget ${ min }), ${ zipped } B gzipped (budget ${ gzip })` );
}
if ( failed ) {
	console.error( 'A build file is over its size budget (scripts/size.mjs).' );
	process.exit( 1 );
}
