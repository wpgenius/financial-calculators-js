# financial-calculators-js

Financial calculators in plain JavaScript, with **no dependencies**:

- **Formulas:** SIP, lump sum, SWP, time-based goal and loan EMI. Each returns
  the totals plus a series with one point per year, ready for a chart.
- **Formatting:** Indian (12,34,567) and international (1,234,567) grouping,
  currency, and short forms for chart axes (15L, 2.5Cr, 1.5M).
- **Amounts in words:** Indian (lakh, crore) and international (million,
  billion...) with no size limit.

About 3 KB gzipped. Used by the CalcWise WordPress plugin.

## Get it

Each [release](https://github.com/wpgenius/financial-calculators-js/releases)
has three files:

| File | Use |
|---|---|
| `financial-calculators.js` | Browser `<script>`, readable. Defines the global `FinancialCalculators`. |
| `financial-calculators.min.js` | The same, minified. |
| `financial-calculators.esm.js` | ES module: `import { sip } from './financial-calculators.esm.js'`. |

```html
<script src="financial-calculators.min.js"></script>
<script>
  const { sip, formatCurrency, amountInWords } = FinancialCalculators;
  const result = sip( { monthlyAmount: 25000, annualRate: 12, years: 10 } );
  formatCurrency( result.total );   // "₹58,08,477"
  amountInWords( result.total );    // "Fifty Eight Lakh Eight Thousand Four Hundred and Seventy Seven"
</script>
```

## Calculators

Every calculator takes one object of inputs and returns plain numbers
(unrounded: round when you display them). Rates are % a year (`12` for 12%).
`years` may have fractions; it is rounded to whole months. Inputs may be
numbers or numeric strings; a missing, non-numeric or negative input throws
a `TypeError` or `RangeError`.

Each result has `months` and a `series`: one point at month 0, 12, 24... and a
last point at the final month, each with `year` and `month` plus the values
listed below.

### `sip( { monthlyAmount, annualRate, years } )`

Same amount invested at the start of every month, compounded monthly.

Returns `{ invested, returns, total, months, series }`, series points
`{ year, month, invested, total }`.

```js
sip( { monthlyAmount: 25000, annualRate: 12, years: 10 } ).total; // 5808477.3…
```

### `lumpsum( { amount, annualRate, years, compoundingPerYear = 1 } )`

One-time investment. `compoundingPerYear`: 1 yearly, 4 quarterly, 12 monthly.

Returns `{ invested, returns, total, months, series }`, series points
`{ year, month, invested, total }`.

### `swp( { investment, monthlyWithdrawal, annualRate, years } )`

Fixed withdrawal at the start of every month; the rest grows monthly. The
balance never goes below zero.

Returns `{ investment, totalWithdrawn, finalBalance, returns, depletedMonth,
months, series }`. `returns` = finalBalance + totalWithdrawn − investment.
`depletedMonth` is the month (1-based) the money ran out, or `null`. Series
points `{ year, month, balance, withdrawn }` (withdrawn is cumulative).

### `goal( { presentCost, currentSavings = 0, inflationRate, annualRate, years } )`

What a goal costs after inflation, and the monthly investment needed on top of
the savings already put aside (which keep growing). When the savings cover the
goal, the monthly investment is 0.

Returns `{ presentCost, futureCost, savingsFutureValue, shortfall,
monthlyInvestment, totalInvested, months, series }`, series points
`{ year, month, goalCost, savings, investments, total }`.

### `emi( { principal, annualRate, years } )`

Loan instalment, interest reducing monthly.

Returns `{ emi, principal, totalInterest, totalPayment, months, schedule,
series }`. `schedule` has one row per loan year (the last may be shorter):
`{ year, principalPaid, interestPaid, balance }`. Series points
`{ year, month, balance, principalPaid, interestPaid }` (cumulative).

### By name

```js
types();                          // [ 'sip', 'lumpsum', 'swp', 'goal', 'emi' ]
calculate( 'emi', { principal: 100000, annualRate: 7, years: 1 } ).emi; // 8652.67…
register( 'myCalc', ( inputs ) => ( { … } ) ); // add or replace a calculator
```

## Formatting

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

## Development

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

Add a calculator: one file in `src/calculators/`, one line in
`src/calculators/index.js`, tests in `test/`.

## How changes ship

```
issue  →  branch  →  pull request (Closes #N)  →  squash merge to main  →  automatic release
```

- `main` is protected: changes go through pull requests, merged with squash.
- Every PR closes an issue (the *Linked issue* check), and CI must pass.
- A merge that changes `src/` publishes a GitHub release with the build
  files; other changes make no release. The version comes from the tags
  (first release 1.0.0): a patch bump, or minor/major with the
  `release:minor` / `release:major` label. Release notes list the issues closed.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
