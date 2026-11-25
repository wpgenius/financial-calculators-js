# Security policy

## Supported versions

Security fixes go into the latest release only. The library follows semantic versioning, so updating within 1.x is safe.

| Version | Supported |
|---|---|
| Latest 1.x | Yes |
| Older | No |

## Reporting a vulnerability

Please don't report security problems in public issues, discussions or pull requests.

Report them privately through GitHub: open the [**Security** tab](https://github.com/wpgenius/financial-calculators-js/security) and choose **Report a vulnerability**. If you can't use GitHub, email support@wpgenius.in.

Please include:

- what an attacker can do, and with which input;
- the library version (`FinancialCalculators.VERSION`), and the browser or Node.js version if it matters;
- steps or a small script that shows the problem.

## What to expect

- We confirm we've received your report within a few working days.
- We look into it, keep you updated, and agree on a disclosure date with you.
- The fix ships as a new release, and the published advisory credits you unless you'd rather stay anonymous.

## Scope

The library only does arithmetic and builds strings: it never touches the page, the network or storage, and has no dependencies. Its output (numbers and plain text such as amounts in words) is safe to insert as text; inserting it as HTML is up to the page. Wrong results are bugs, not vulnerabilities, unless an input can make the library hang or crash the page (for example a value that loops forever or exhausts memory).
