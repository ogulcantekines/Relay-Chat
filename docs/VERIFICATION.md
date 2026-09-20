# Verification record

Local verification on **21 September 2026**, from the `release/production-ready`
branch. This records observed results; it is not a penetration-test certificate.

| Check | Result |
| --- | --- |
| Frontend ESLint | Passed |
| Vite production build | Passed |
| Backend and test JavaScript syntax | Passed |
| HTTP smoke suite | 41 checks passed |
| Authenticated Socket.IO suite | 8 checks passed |
| Security regression suite | 37 checks passed |
| Chromium desktop/mobile suite | 38 checks passed |
| `npm audit` backend and frontend | 0 reported vulnerabilities at scan time |
| Gitleaks full Git history | Passed, no findings |
| GitHub Actions actionlint and YAML parsing | Passed |
| Local and optional production Compose validation | Passed |
| Actual Docker build and startup | Both services healthy |
| Docker auth, live delivery, restart persistence | Passed |
| Runtime restrictions | UID 1000, read-only root, MongoDB unpublished |
| Trivy 0.74.0 runtime image scan | No HIGH/CRITICAL findings with available fixes |

The initial runtime scan detected vulnerable dependencies inside the base image's
bundled npm installation. Package managers are now removed after dependency
installation because the final image only needs Node to run the app. The rebuilt
image passed the same severity/fix-availability policy used by CI.

Tests used explicitly selected disposable MongoDB databases and separate app ports.
Existing local data was backed up before updating the local Compose stack; no
public deployment or GitHub push was performed.

The [desktop](screenshots/desktop-chat.png) and [mobile](screenshots/mobile-chat.png)
images are actual browser captures using test accounts. Browser traces and scan
reports are local ignored artifacts. Future GitHub runs upload fresh evidence.

## Not verified remotely

GitHub Actions and CodeQL have not run on GitHub for this branch yet. Required
checks, branch rules, repository settings and any public hosting must be verified
after the remote is configured. No public-domain HTTPS/proxy deployment was tested.

Dependency/advisory data changes over time. Repeat the pipeline when publishing or
updating the image; a passing result does not establish the absence of other bugs.
