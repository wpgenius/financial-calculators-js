import { sip } from './sip.js';
import { lumpsum } from './lumpsum.js';
import { swp } from './swp.js';
import { goal } from './goal.js';
import { emi } from './emi.js';

/**
 * Every calculator, by type. New calculators (FD, step-up SIP, RD, PPF, CAGR,
 * retirement) are added as a file in this folder and one line here.
 */
// A Map, so any name works as a type: on a plain object "__proto__" would
// replace the prototype instead of adding a calculator.
const registry = new Map( Object.entries( { sip, lumpsum, swp, goal, emi } ) );

/**
 * The calculator types available.
 *
 * @return {string[]} Types, e.g. [ 'sip', 'lumpsum', 'swp', 'goal', 'emi' ].
 */
export function types() {
	return [ ...registry.keys() ];
}

/**
 * Runs a calculator by type.
 *
 * @param {string} type   Calculator type (see types()).
 * @param {Object} inputs That calculator's inputs.
 * @return {Object} That calculator's result.
 * @throws {Error} When the type is unknown.
 */
export function calculate( type, inputs ) {
	if ( typeof type !== 'string' || ! registry.has( type ) ) {
		throw new Error( `Unknown calculator "${ String( type ) }". Available: ${ types().join( ', ' ) }.` );
	}
	return registry.get( type )( inputs );
}

/**
 * Adds or replaces a calculator, e.g. to try a new one before it is part of
 * the library.
 *
 * @param {string}                   type Calculator type.
 * @param {function(Object): Object} fn   Takes the inputs, returns the result.
 */
export function register( type, fn ) {
	if ( typeof type !== 'string' || type === '' || typeof fn !== 'function' ) {
		throw new TypeError( 'register( type, fn ) needs a type name and a function.' );
	}
	registry.set( type, fn );
}

export { sip, lumpsum, swp, goal, emi };
