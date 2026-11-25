import { defineConfig, devices } from '@playwright/test';

// Browser tests: the build files and the website demos, served from the repo
// root by scripts/serve.mjs. Run `npm run build && npm run site` first.
export default defineConfig( {
	testDir: 'test/e2e',
	fullyParallel: true,
	forbidOnly: !! process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [ [ 'github' ], [ 'list' ] ] : 'list',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'retain-on-failure',
	},
	projects: [ { name: 'chromium', use: { ...devices[ 'Desktop Chrome' ] } } ],
	webServer: {
		command: 'node scripts/serve.mjs . 4173',
		url: 'http://127.0.0.1:4173/test/fixtures/index.html',
		reuseExistingServer: ! process.env.CI,
	},
} );
