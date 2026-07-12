# Contributing

## Workflow

`main` is protected by CI and is meant to stay deployable. Work happens on
short-lived branches that are merged through pull requests.

```bash
git switch -c feat/message-search    # branch off main
# ... make the change ...
npm run lint && npm run test:all     # check before pushing
git push -u origin feat/message-search
gh pr create --fill                  # or open the PR on GitHub
```

Merge once CI is green. Squash merging keeps the history on `main` readable.

## Branch names

| Prefix      | For                                   |
|-------------|---------------------------------------|
| `feat/`     | a new capability                      |
| `fix/`      | a bug fix                             |
| `refactor/` | a change with no behavioural effect   |
| `perf/`     | a performance change                  |
| `docs/`     | documentation only                    |
| `chore/`    | tooling, dependencies, configuration  |
| `ci/`       | workflow changes                      |

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
a `type: summary` subject in the imperative mood, under 72 characters, with
a body that explains why the change was needed when that is not obvious.

```
fix: stop message bubbles collapsing to one character per line

The bubble had max-width: 78%, but its parent was a min-w-0 flex column
with no resolved width, so the percentage resolved against zero.
```

## Checks

Every push and pull request runs:

| Workflow   | Checks                                                     |
|------------|------------------------------------------------------------|
| `ci`       | lint, frontend build, HTTP smoke test, socket test, Docker  |
| `security` | CodeQL, `npm audit` on both workspaces, gitleaks            |

Run the same checks locally before opening a pull request:

```bash
npm run lint
npm run test:all
docker compose up --build
```

## Tests

`scripts/smoke-test.js` drives the REST API end to end. `scripts/realtime-test.js`
connects two real Socket.IO clients and asserts that events reach the other
side. Both start their own server and need a reachable `MONGO_URI`.

New endpoints belong in the smoke test; new socket events belong in the
real-time test.
