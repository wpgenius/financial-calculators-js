import { sip } from './sip.js';
import { lumpsum } from './lumpsum.js';
import { swp } from './swp.js';
import { goal } from './goal.js';
import { emi } from './emi.js';

/**
 * Every calculator, by type. New calculators (FD, step-up SIP, RD, PPF, CAGR,
 * retirement) are added as a file in this folder and one line here.
 */
const registry = { sip, lumpsum, swp, goal, emi };

/**
 * The calculator types available.
 *
 * @return {string[]} Types, e.g. [ 'sip', 'lumpsum', 'swp', 'goal', 'emi' ].
 */
export function types() {
	return Object.keys( registry );
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
	if ( typeof type !== 'string' || ! Object.prototype.hasOwnProperty.call( registry, type ) ) {
		throw new Error( `Unknown calculator "${ type }". Available: ${ types().join( ', ' ) }.` );
	}
	return registry[ type ]( inputs );
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
	registry[ type ] = fn;
}

export { sip, lumpsum, swp, goal, emi };
