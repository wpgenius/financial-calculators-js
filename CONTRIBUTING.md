# Contributing to financial-calculators-js

Thanks for helping. Bug reports, ideas, docs fixes and code are all welcome. Please follow the [code of conduct](CODE_OF_CONDUCT.md), and report security problems privately as described in [SECURITY.md](SECURITY.md).

## Set up and build

You need Node.js 20 or later (22 recommended, see `.nvmrc`).

```bash
git clone https://github.com/wpgenius/financial-calculators-js.git
cd financial-calculators-js
npm install
npm run build   # dist/financial-calculators.js, .min.js and .esm.js
npm run site    # assemble the website (site/ + dist/) into _site/
```

## Tests

```bash
npm run lint
npm test                          # unit tests (node --test, test/*.test.js)
npm run test:types                # TypeScript types against test/types.ts
npm run build && npm run test:dist   # the build files and the browser global
npm run size                      # the minified file against its size budget
npx playwright install chromium   # once, downloads the test browser
npm run test:e2e                  # browser tests (test/e2e/): build files and the website demos
```

CI runs all of these on every pull request. When you change a formula, add a unit test with a value checked by hand or against a trusted calculator. When you change the public API, update `types/financial-calculators.d.ts`, `test/types.ts`, the README and `site/docs.html` in the same PR.

| Folder | What it is |
|---|---|
| `src/` | The library. Edit these. |
| `test/` | Unit tests, type tests and browser tests. |
| `types/` | TypeScript types for the public API. Keep them in step with `src/`. |
| `site/` | The website on GitHub Pages: demos and documentation. |
| `scripts/` | Build, size and test helpers. |
| `dist/` | Built files, written by the release workflow. Don't edit or commit. |

## How a change gets in

1. **Open an issue** describing the bug or the change, or comment on an existing one. One issue per change.
2. **Work on a branch** in your fork.
3. **Open a pull request** that closes the issue: put `Closes #12` (one line per issue) in the description. The changelog lists one line per issue closed.
4. CI must pass. A maintainer reviews it and **squash-merges** it, so your PR becomes one commit on `main` with the PR title and description as its message.

### What a pull request may change

- Change `src/`, `types/`, `test/`, `site/` and the docs as needed.
- **Don't commit `dist/` or `CHANGELOG.md`**, and don't change the version in `package.json`. The release workflow writes them when your PR is merged. CI fails if a PR touches `dist/` or `CHANGELOG.md`.
- Keep the library free of runtime dependencies, and keep it working from a plain `<script>` tag.

## Releases and version numbers

Releases are automatic: when a PR that changes `src/` is merged, the release workflow bumps the version, rebuilds `dist/`, writes the changelog, publishes a GitHub release and publishes the package to npm. PRs that change only the website, docs, tests or CI make no release.

The version goes up by a **patch** (1.2.0 → 1.2.1) by default. A maintainer adds a label to the PR before merging for a bigger bump:

| Label | Bump | Use for |
|---|---|---|
| *(none)* | Patch | Bug fixes and small improvements |
| `release:minor` | Minor (1.2.0 → 1.3.0) | New calculators, options or result fields; backward compatible |
| `release:major` | Major (1.2.0 → 2.0.0) | Changes that can break existing code |

## Adding a calculator

1. One file in `src/calculators/`, using the helpers in `src/utils.js` (`readNumber`, `toMonths`, `yearlySeries`).
2. One line in `src/calculators/index.js`, and the export in `src/index.js`.
3. Unit tests in `test/calculators.test.js`, types in `types/financial-calculators.d.ts`, a section in the README and `site/docs.html`, and ideally a demo on the website.

## Style

- Plain modern JavaScript (ES2020), no dependencies. Tabs for indentation, spaces inside parentheses, as in the existing code. `npm run lint` checks the rest.
- Every calculator returns plain, unrounded numbers; rounding and formatting belong to the caller.
- Comments explain *why*, not *what*.
