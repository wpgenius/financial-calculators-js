# Changelog

All notable changes, newest first. The release workflow writes each section
from the issues the merged pull requests closed; don't edit it by hand.

## 1.2.0 – 2026-11-26

### Changes
- Tiny rates lose precision (#29)
- Let amountInWords take all 100 words below a hundred (#30)
- Add a CommonJS build and fix the package entry points (#31)
- calendarYear and targetYear can be fractional (#32)
- formatCompact keeps trailing zeros (#33)
- compoundingPerYear accepts fractions (#34)
- Numeric strings in hex, binary or octal are accepted (#35)
- Public helpers validate inputs inconsistently (#36)
- register() silently drops reserved names (#37)
- Fallback formatter rounds half values differently from Intl (#38)
- Switch the licence to MIT (#39)
- Test against Excel reference values and with property-based tests (#40)
- Document supported environments (#41)

## 1.1.1 – 2026-11-26

### Changes
- formatCompact shows 1,000K instead of 1M at unit boundaries (#21)
- emi() returns NaN for long or high-interest loans (#22)
- Calculators return Infinity or NaN for huge inputs, and the formatters then throw (#23)
- No upper limit on years: huge durations freeze the page (#24)
- Calling a calculator without inputs gives a destructuring error (#25)
- formatCurrency accepts any position value (#26)
- Hand-made number formatting garbles values of 10^21 and above (#27)

## 1.1.0 – 2026-11-25

### Changes
- Release: write the new CHANGELOG section below the intro (#15)
- Reuse Intl.NumberFormat instances in formatNumber (#17)
- Let amountInWords take translated words (#18)
- Add an optional startYear to the calculators (#19)

## 1.0.1 – 2026-11-25

### Changes
- Release like Foldbox: version in package.json, CHANGELOG.md and dist/ in a release commit (#3)
- Publish to npm as financial-calculators with trusted publishing (#4)
- Add a GitHub Pages site with live demos and docs (#5)
- README: badges, demo and docs links, CDN install, quick start (#6)
- Add TypeScript types and a fuller exports map (#7)
- Test the build in a real browser with Playwright, and check its size (#8)
- Add SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md and issue forms (#9)
- Publish to npm as @wpgenius/financial-calculators (#12)
- Fix the Pages deploy: deploy in its own job after the build (#13)

## 1.0.0 – 2026-11-25

### Changes
- Add the calculators, formatters and amounts in words (first release) (#1)
