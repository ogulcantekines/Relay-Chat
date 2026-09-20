# Docker operations

The supported starting point is the local Compose stack in the
[README](../README.md#run-locally-with-docker). Public hosting is optional; these
files do not deploy to a server or publish an image.

## Configuration

Compose reads `.env` on the host and passes only selected settings to the app.
It does not bake that file into the image. `MONGO_URI` inside Compose points to
the private `mongo` service; the host's development database is not used.

| Setting | Local default | Purpose |
| --- | --- | --- |
| `APP_PORT` | `5000` | Published app port, bound to `127.0.0.1` |
| `JWT_SECRET` | Required | At least 32 random characters; rotation signs everyone out |
| `CLIENT_URL` | `http://localhost:5000` | Additional permitted browser origin |
| `COOKIE_SECURE` | `false` | Set true only when serving HTTPS |
| `TRUST_PROXY` | `0` | Trusted reverse-proxy hops; never enable without that topology |
| `APP_IMAGE` | `relay-chat:local` | Image tag, useful for testing and rollback |

Use `docker compose config --quiet` to validate configuration without printing
secrets. `/api/health` checks the process; `/api/ready` returns 503 if the database
connection is unavailable. The image health check uses readiness.

## Update and rollback

Back up the database before an update. Build an explicit tag so the previous
image stays available (examples below use a POSIX shell):

```bash
APP_IMAGE=relay-chat:release-1 docker compose build app
APP_IMAGE=relay-chat:release-1 docker compose up -d --wait
```

To roll back code, select the previous tag and avoid rebuilding it:

```bash
APP_IMAGE=relay-chat:previous-tag docker compose up -d --no-build --wait
```

PowerShell uses `$env:APP_IMAGE = 'relay-chat:release-1'` before the Compose
commands. Image rollback does not undo database changes. This release preserves
existing accounts/messages, but older JWT cookies require a new login because
sessions are now tracked server-side. New conversation writes retain only the
latest message reference; use this release's message API to read complete history.
Rolling back to pre-pagination code requires restoring a compatible backup.

## Backup and restore

These commands copy a binary archive through Docker rather than shell output
redirection, so they work in PowerShell too. Create a `backups` directory first.
Use a unique filename for each backup.

```bash
docker compose exec -T mongo mongodump --db relay --archive=/tmp/relay-backup.gz --gzip
docker compose cp mongo:/tmp/relay-backup.gz backups/relay-backup.gz
```

Archives contain private messages and password hashes. Keep them outside Git,
restrict access, and copy an encrypted backup off the host if the data matters.

To restore, stop the app first and copy the chosen archive back into MongoDB:

```bash
docker compose stop app
docker compose cp backups/relay-backup.gz mongo:/tmp/relay-restore.gz
# --drop replaces the collections in the archive. Verify the target first.
docker compose exec -T mongo mongorestore --archive=/tmp/relay-restore.gz --gzip --drop
docker compose up -d --wait
```

Verify a restore on a separate Compose project before relying on a backup. Never
use `docker compose down --volumes` as an upgrade step.

## Optional HTTPS hosting later

A second website can use its own hostname and the same existing reverse proxy.
Keep the app bound to loopback, keep MongoDB private and point the hostname to the
host. Set `CLIENT_URL` to the exact HTTPS origin. Only then apply the optional
single-proxy override:

```bash
docker compose -f docker-compose.yml -f deploy/compose.production.yml up --build -d --wait
```

The override turns on secure cookies, trusts one proxy hop and adds resource
limits. It does not create DNS records, obtain certificates, open firewall ports
or change an existing website. A containerized proxy needs an appropriately
configured shared network instead of the host-loopback recipe.

Example location within an existing TLS-enabled Nginx server block:

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 75s;
}
```

Test login and live delivery through the proxy, monitor readiness/logs, and verify
backups before public use. The app expects one instance; Redis/shared rate limits
would be needed before adding replicas. Docker's
[production Compose guide](https://docs.docker.com/compose/how-tos/production/)
describes the optional override pattern.
