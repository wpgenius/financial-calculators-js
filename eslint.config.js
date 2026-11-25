import js from '@eslint/js';
import globals from 'globals';

export default [
	{ ignores: [ 'dist/', 'node_modules/', 'coverage/' ] },
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
		},
		rules: {
			'no-var': 'error',
			'prefer-const': 'error',
			eqeqeq: 'error',
		},
	},
	{
		// Node-only files: the build and the tests.
		files: [ 'scripts/**', 'test/**', 'eslint.config.js' ],
		languageOptions: {
			ecmaVersion: 'latest',
			globals: globals.node,
		},
	},
];
