# financial-calculators

[![npm](https://img.shields.io/npm/v/financial-calculators)](https://www.npmjs.com/package/financial-calculators)
[![Latest release](https://img.shields.io/github/v/release/wpgenius/financial-calculators-js)](https://github.com/wpgenius/financial-calculators-js/releases/latest)
[![CI](https://github.com/wpgenius/financial-calculators-js/actions/workflows/ci.yml/badge.svg)](https://github.com/wpgenius/financial-calculators-js/actions/workflows/ci.yml)
[![Licence: GPL-3.0-or-later](https://img.shields.io/github/license/wpgenius/financial-calculators-js)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/financial-calculators)](https://www.npmjs.com/package/financial-calculators)
[![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/financial-calculators)](https://www.jsdelivr.com/package/npm/financial-calculators)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/financial-calculators)](https://bundlephobia.com/package/financial-calculators)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)

Financial calculators in plain JavaScript, with **no dependencies**: SIP, lump
sum, SWP, goal and loan EMI formulas with yearly series ready for charts,
Indian and international number formatting, and amounts in words.

**[Live demos](https://wpgenius.github.io/financial-calculators-js/)** · **[Documentation](https://wpgenius.github.io/financial-calculators-js/docs.html)** · **[Releases](https://github.com/wpgenius/financial-calculators-js/releases)**

## Features

- **Five calculators:** SIP, lump sum (yearly, quarterly or monthly compounding), SWP, time-based goal and loan EMI with a yearly repayment schedule.
- **Chart-ready:** every result has a `series` with one point per year.
- **Honest edge cases:** SWP stops at zero and reports the month the money runs out; a goal already covered by savings needs 0 a month; 0% rates work.
- **Indian and international formatting:** 12,34,567 or 1,234,567; 15L and 2.5Cr or 1.5M for chart axes; any currency symbol, before or after.
- **Amounts in words** in lakh/crore or million/billion, with no size limit.
- **Small and typed:** about 3 KB minified and gzipped, TypeScript types included, unit-tested against reference values. Works in browsers and Node.js 20+.

## Install

From npm:

```bash
npm install financial-calculators
```

```js
import { sip, formatCurrency, amountInWords } from 'financial-calculators';
```

Or from the jsDelivr CDN, which defines the global `FinancialCalculators`:

```html
<script src="https://cdn.jsdelivr.net/npm/financial-calculators@1/dist/financial-calculators.min.js"></script>
```

`@1` follows the latest 1.x release; pin an exact version (such as `@1.0.0`) in
production. Or download `financial-calculators.min.js`, the readable
`financial-calculators.js` or the ES module `financial-calculators.esm.js` from
the [latest release](https://github.com/wpgenius/financial-calculators-js/releases/latest).

## Quick start

```html
<script src="https://cdn.jsdelivr.net/npm/financial-calculators@1/dist/financial-calculators.min.js"></script>
<script>
  const { sip, emi, formatCurrency, formatCompact, amountInWords } = FinancialCalculators;

  const plan = sip( { monthlyAmount: 25000, annualRate: 12, years: 10 } );
  formatCurrency( plan.total );   // "₹58,08,477"
  amountInWords( plan.total );    // "Fifty Eight Lakh Eight Thousand Four Hundred and Seventy Seven"
  plan.series.map( ( p ) => formatCompact( p.total ) ); // [ "0", "3.2L", … "58.1L" ] for a chart

  const loan = emi( { principal: 3000000, annualRate: 8.5, years: 20 } );
  formatCurrency( loan.emi );     // "₹26,035"
  loan.schedule[ 0 ];             // { year: 1, principalPaid, interestPaid, balance }
</script>
```

## API

| Function | Returns |
|---|---|
| `sip( { monthlyAmount, annualRate, years } )` | `{ invested, returns, total, months, series }` |
| `lumpsum( { amount, annualRate, years, compoundingPerYear } )` | `{ invested, returns, total, months, series }` |
| `swp( { investment, monthlyWithdrawal, annualRate, years } )` | `{ investment, totalWithdrawn, finalBalance, returns, depletedMonth, months, series }` |
| `goal( { presentCost, currentSavings, inflationRate, annualRate, years } )` | `{ futureCost, savingsFutureValue, shortfall, monthlyInvestment, totalInvested, months, series, … }` |
| `emi( { principal, annualRate, years } )` | `{ emi, principal, totalInterest, totalPayment, months, schedule, series }` |
| `calculate( type, inputs )`, `types()`, `register( type, fn )` | Run a calculator by name, list them, add one |
| `formatNumber( value, { system, decimals } )` | `"58,08,477"` or `"5,808,477"` |
| `formatCurrency( value, { symbol, position, system, decimals } )` | `"₹58,08,477"`, `"1,500 €"` |
| `formatCompact( value, { system, decimals } )` | `"15L"`, `"2.5Cr"`, `"1.5M"` |
| `amountInWords( value, { system } )` | `"Fifty Eight Lakh …"` |
| `groupDigits( digits, system )`, `VERSION` | Hand-made grouping; the library version |

The details follow; the [documentation](https://wpgenius.github.io/financial-calculators-js/docs.html) has the same with more examples.

### Calculators

Every calculator takes one object of inputs and returns plain numbers
(unrounded: round when you display them). Rates are % a year (`12` for 12%).
`years` may have fractions; it is rounded to whole months. Inputs may be
numbers or numeric strings; a missing, non-numeric or negative input throws
a `TypeError` or `RangeError`.

Each result has `months` and a `series`: one point at month 0, 12, 24... and a
last point at the final month, each with `year` and `month` plus the values
listed below.

#### `sip( { monthlyAmount, annualRate, years } )`

Same amount invested at the start of every month, compounded monthly.

Returns `{ invested, returns, total, months, series }`, series points
`{ year, month, invested, total }`.

```js
sip( { monthlyAmount: 25000, annualRate: 12, years: 10 } ).total; // 5808477.3…
```

#### `lumpsum( { amount, annualRate, years, compoundingPerYear = 1 } )`

One-time investment. `compoundingPerYear`: 1 yearly, 4 quarterly, 12 monthly.

Returns `{ invested, returns, total, months, series }`, series points
`{ year, month, invested, total }`.

#### `swp( { investment, monthlyWithdrawal, annualRate, years } )`

Fixed withdrawal at the start of every month; the rest grows monthly. The
balance never goes below zero.

Returns `{ investment, totalWithdrawn, finalBalance, returns, depletedMonth,
months, series }`. `returns` = finalBalance + totalWithdrawn − investment.
`depletedMonth` is the month (1-based) the money ran out, or `null`. Series
points `{ year, month, balance, withdrawn }` (withdrawn is cumulative).

#### `goal( { presentCost, currentSavings = 0, inflationRate, annualRate, years } )`

What a goal costs after inflation, and the monthly investment needed on top of
the savings already put aside (which keep growing). When the savings cover the
goal, the monthly investment is 0.

Returns `{ presentCost, futureCost, savingsFutureValue, shortfall,
monthlyInvestment, totalInvested, months, series }`, series points
`{ year, month, goalCost, savings, investments, total }`.

#### `emi( { principal, annualRate, years } )`

Loan instalment, interest reducing monthly.

Returns `{ emi, principal, totalInterest, totalPayment, months, schedule,
series }`. `schedule` has one row per loan year (the last may be shorter):
`{ year, principalPaid, interestPaid, balance }`. Series points
`{ year, month, balance, principalPaid, interestPaid }` (cumulative).

#### By name

```js
types();                          // [ 'sip', 'lumpsum', 'swp', 'goal', 'emi' ]
calculate( 'emi', { principal: 100000, annualRate: 7, years: 1 } ).emi; // 8652.67…
register( 'myCalc', ( inputs ) => ( { … } ) ); // add or replace a calculator
```

### Formatting

`system` is `'indian'` (default) or `'international'`.

| Function | Example |
|---|---|
| `formatNumber( value, { system, decimals = 0 } )` | `formatNumber( 5808477 )` → `"58,08,477"` |
| `formatCurrency( value, { symbol = '₹', position = 'before', system, decimals = 0 } )` | `formatCurrency( -1500 )` → `"-₹1,500"`; `position: 'after'` → `"1,500 €"` |
| `formatCompact( value, { system, decimals = 1 } )` | `formatCompact( 1500000 )` → `"15L"`; international → `"1.5M"` |
| `amountInWords( value, { system } )` | `amountInWords( 1e12 )` → `"One Lakh Crore"` |
| `groupDigits( digits, system )` | `groupDigits( '1234567' )` → `"12,34,567"` |

`formatNumber` uses `Intl.NumberFormat` when the runtime has the `en-IN`
locale, and the same grouping by hand otherwise. `amountInWords` rounds to a
whole number and also takes a `BigInt` or a string of digits for amounts
beyond 2^53. `VERSION` is the library version.

## Contributing

Bug reports, ideas and pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md). Report security problems privately as described in [SECURITY.md](SECURITY.md); questions go to [Discussions](https://github.com/wpgenius/financial-calculators-js/discussions).

Needs Node 20 or later.

```bash
npm ci
```

| Command | What it does |
|---|---|
| `npm test` | Unit tests (`node --test`), including reference values from the original calculators |
| `npm run lint` | ESLint |
| `npm run build` | Builds the three files into `dist/` |
| `npm run test:dist` | Checks the build files and the browser global |
| `npm run test:types` | Checks the TypeScript types (`types/`) against `test/types.ts` |
| `npm run size` | Checks the minified file against its size budget |
| `npm run site` | Assembles the website (`site/` + `dist/`) into `_site/` |
| `npm run test:e2e` | Browser tests with Playwright (run `npx playwright install chromium` once, and `build` + `site` first) |

Add a calculator: one file in `src/calculators/`, one line in
`src/calculators/index.js`, tests in `test/`, types in `types/`, and docs.

## How changes ship

```
issue  →  branch  →  pull request (Closes #N)  →  squash merge to main  →  automatic release
```

- `main` is protected: changes go through pull requests, merged with squash.
- Every PR closes an issue (the *Linked issue* check), and CI must pass.
- A merge that changes `src/` makes a release: the version in `package.json`
  goes up (a patch, or minor/major with the `release:minor` / `release:major`
  label), `dist/` is rebuilt and `CHANGELOG.md` gets a section listing the
  issues closed. A "Release vX.Y.Z" commit and its tag are pushed to `main`,
  the GitHub release gets the three build files, and the package is published
  to npm as [`financial-calculators`](https://www.npmjs.com/package/financial-calculators)
  with trusted publishing. Docs, tests, CI and config changes make no release.
- Pull requests never edit `dist/` or `CHANGELOG.md`; the release writes them.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
