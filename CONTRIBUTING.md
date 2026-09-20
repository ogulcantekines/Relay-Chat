# Contributing

Use short-lived branches and keep each commit focused on a reviewable behavior.
Examples: `fix/socket-auth`, `feat/message-search`, `docs/local-setup`.

```bash
git switch -c fix/your-change
npm run lint
# Set MONGO_URI explicitly to a disposable database and select a free PORT first.
npm run test:all
```

See the [README](README.md#verify-changes) for full test setup. Each test starts its
own server; the browser test needs a built frontend and Playwright Chromium.
`npm run test:all` builds the frontend before running all suites.

## Commits and review

Use Conventional Commit subjects such as `fix: validate socket sessions` or
`docs: explain local Docker setup`. Group related fixes, keep truthful timestamps,
and explain the behavior change when it is not obvious from the diff. Keep secrets,
local reports, database exports and personal study notes outside Git.

Before opening a pull request, run the relevant checks and describe what changed,
why, and how it was verified. Include real screenshots for visible changes. Add
regression coverage for security boundaries or bugs with a reproducible failure;
avoid tests that merely restate an implementation.

## GitHub setup after publication

The local repository includes CI configuration, but no GitHub rules are created by
these files. After the first workflow run, configure a ruleset for `main` requiring
pull requests and the CI/security checks. Disallow force pushes and branch deletion.
Choose squash merge if one commit per completed change is preferable.

[GitHub's protected-branch documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
explains the repository-side settings. A passing local test run is not evidence
that GitHub Actions has already run.

## Where to add tests

- HTTP flows: `scripts/smoke-test.js`.
- Realtime events: `scripts/realtime-test.js`.
- Security/authorization regressions: `scripts/security-test.js`.
- User-visible desktop/mobile behavior: `scripts/ui-test.js`.

All suites use `scripts/test-server.js` to isolate their process configuration and
reject occupied ports. Never run them against a production database.
