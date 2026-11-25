# financial-calculators-js

Financial calculators in plain JavaScript with no dependencies: SIP, lump sum,
SWP, goal and EMI formulas, Indian and international number formatting, and
amounts in words. Used by the CalcWise WordPress plugin.

The library code arrives in the first pull request.

## How changes ship

```
issue  →  branch  →  pull request (Closes #N)  →  squash merge to main  →  automatic release
```

- `main` is protected: changes go through pull requests, merged with squash.
- Every PR closes an issue (the *Linked issue* check).
- A merge that changes `src/` publishes a GitHub release with the build files.
  The version comes from the tags: a patch bump, or minor/major with the
  `release:minor` / `release:major` label.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
