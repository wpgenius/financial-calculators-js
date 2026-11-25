// Assembles the website into _site/: site/ plus the current dist/ files.
// Run `npm run build` first.
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';

if ( ! existsSync( 'dist/financial-calculators.min.js' ) ) {
	console.error( 'dist/ is missing: run npm run build first.' );
	process.exit( 1 );
}
rmSync( '_site', { recursive: true, force: true } );
cpSync( 'site', '_site', { recursive: true } );
cpSync( 'dist', '_site/dist', { recursive: true } );
writeFileSync( '_site/.nojekyll', '' );
console.log( 'Website assembled in _site/' );
