import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as lib from '../src/index.js';

test( 'the TypeScript types declare every export, and nothing more', () => {
	const dts = readFileSync( new URL( '../types/financial-calculators.d.ts', import.meta.url ), 'utf8' );
	const declared = new Set( [ ...dts.matchAll( /^export (?:function|const) (\w+)/gm ) ].map( ( m ) => m[ 1 ] ) );
	assert.deepEqual( [ ...declared ].sort(), Object.keys( lib ).sort() );
} );
