import js from '@eslint/js';
import globals from 'globals';

export default [
	{ ignores: [ 'dist/', 'node_modules/', 'coverage/', '_site/', 'test-results/', 'playwright-report/' ] },
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
		// Node-only files: the build, the helpers and the tests.
		files: [ 'scripts/**', 'test/**', 'eslint.config.js', 'playwright.config.js' ],
		languageOptions: {
			ecmaVersion: 'latest',
			globals: globals.node,
		},
	},
	{
		// The website scripts run in the browser as classic scripts.
		files: [ 'site/**/*.js' ],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'script',
			globals: globals.browser,
		},
	},
	{
		// Browser tests run their callbacks inside the page.
		files: [ 'test/e2e/**' ],
		languageOptions: {
			globals: { ...globals.node, ...globals.browser },
		},
	},
];
