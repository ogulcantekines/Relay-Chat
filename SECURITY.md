# Security policy

This is a self-hosted portfolio and learning project. Automated checks and code
review reduce risk; they are not a claim of a completed penetration test or a
security certification.

## Reporting an issue

Please report exploitable issues privately to **ogulcan.tekines@gmail.com**. Include
the affected commit, minimal reproduction, expected impact and relevant logs with
credentials and private messages removed. Do not put live credentials or other
people's messages into public issues.

Run experiments against your own local instance and disposable accounts. A future
public demo does not imply authorization to test other infrastructure.

## Security boundaries

- REST and Socket.IO share revocable cookie-based authentication.
- State-changing requests reject foreign browser origins. JSON validation,
  ownership checks and bounded input sizes apply on the server.
- Passwords are hashed; session cookies are HttpOnly and SameSite=Lax. HTTPS hosting
  additionally requires `COOKIE_SECURE=true`.
- Local Compose publishes the application on loopback and keeps MongoDB on its
  internal network. Secrets and backups must stay outside Git.
- The app container runs without root privileges. CI checks dependencies, source
  code and committed secrets.

**Messages are not end-to-end encrypted.** The database operator can read stored
messages. Use test conversations rather than sensitive information when trying
the project.

## Public hosting

Before exposing an instance, configure HTTPS, the permitted browser origin,
trusted proxy hops, backups and restore verification. Review abuse handling and
the absence of password recovery/moderation against your intended audience. The
project currently targets a single app instance; process-local rate limits do
not protect a horizontally scaled deployment.

If a secret is ever committed, revoke it first. Removing a file or adding it to
`.gitignore` does not remove the secret from Git history.

## Checks

`npm run test:security` exercises authentication and authorization regressions
against a disposable MongoDB database. The security workflow also runs CodeQL,
dependency auditing and a redacted full-history secret scan. A passing workflow
covers those checks only; it does not establish the absence of vulnerabilities.
