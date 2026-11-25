// A tiny static file server for the browser tests and local previews:
//   node scripts/serve.mjs [folder] [port]   (default: . and 4173)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve( process.argv[ 2 ] || '.' );
const port = Number( process.argv[ 3 ] || process.env.PORT || 4173 );
const types = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.json': 'application/json',
};

createServer( async ( req, res ) => {
	const path = decodeURIComponent( new URL( req.url, 'http://localhost' ).pathname );
	let file = normalize( join( root, path ) );
	if ( file !== root && ! file.startsWith( root + sep ) ) {
		res.writeHead( 403 ).end();
		return;
	}
	if ( path.endsWith( '/' ) ) {
		file = join( file, 'index.html' );
	}
	try {
		const body = await readFile( file );
		res.writeHead( 200, { 'Content-Type': types[ extname( file ) ] || 'application/octet-stream' } ).end( body );
	} catch {
		res.writeHead( 404 ).end( 'Not found' );
	}
} ).listen( port, '127.0.0.1', () => console.log( `Serving ${ root } at http://127.0.0.1:${ port }/` ) );
