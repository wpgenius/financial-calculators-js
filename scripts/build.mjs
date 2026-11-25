// Builds the three release files into dist/:
//   financial-calculators.js      readable, defines the global FinancialCalculators
//   financial-calculators.min.js  the same, minified
//   financial-calculators.esm.js  ES module (import { sip } from ...)
// The version comes from package.json.
import { build } from 'esbuild';
import { readFileSync, rmSync } from 'node:fs';

const pkg = JSON.parse( readFileSync( new URL( '../package.json', import.meta.url ) ) );
// The release workflow bumps package.json first, so the build carries the new version.
const version = pkg.version;
const banner = `/*! financial-calculators ${ version } | ${ pkg.license } | ${ pkg.homepage } */`;

const common = {
	entryPoints: [ 'src/index.js' ],
	bundle: true,
	target: 'es2020',
	legalComments: 'inline',
	banner: { js: banner },
	define: { __VERSION__: JSON.stringify( version ) },
	logLevel: 'info',
};

rmSync( 'dist', { recursive: true, force: true } );
await Promise.all( [
	build( { ...common, format: 'iife', globalName: 'FinancialCalculators', outfile: 'dist/financial-calculators.js' } ),
	build( { ...common, format: 'iife', globalName: 'FinancialCalculators', minify: true, outfile: 'dist/financial-calculators.min.js' } ),
	build( { ...common, format: 'esm', outfile: 'dist/financial-calculators.esm.js' } ),
] );
