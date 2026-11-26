// Builds the three release files into dist/:
//   financial-calculators.js      readable, defines the global FinancialCalculators
//   financial-calculators.min.js  the same, minified
//   financial-calculators.esm.js  ES module (import { sip } from ...)
//   financial-calculators.cjs     CommonJS (require), with financial-calculators.d.cts
// The version comes from package.json.
import { build } from 'esbuild';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';

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
	build( { ...common, format: 'cjs', platform: 'neutral', outfile: 'dist/financial-calculators.cjs' } ),
] );
// The same types, as a CommonJS declaration file for require().
writeFileSync( 'dist/financial-calculators.d.cts', readFileSync( 'types/financial-calculators.d.ts', 'utf8' ).replace( "import( './financial-calculators.js' )", "import( './financial-calculators.cjs' )" ) );
