# Deployment hardening contract

`scripts/deploy.ps1` is the Windows/manual entrypoint for the remote VPS
deployment. It is non-interactive and must not be used until the VPS host key
has been provisioned in the operator's `~/.ssh/known_hosts`.

## Safety gates

- SSH uses `StrictHostKeyChecking=yes` in the PowerShell entrypoints and
  deploy-bot health path; an unknown or changed host key blocks. The bot also
  requires the configured `known_hosts` file before attempting remote health.
- `TargetDir` is deliberately fixed to `/var/www/zen-dev`, matching the PM2
  ecosystem configuration. A different path requires a reviewed architecture
  change, not an ad-hoc flag.
- The remote lock is acquired before SCP upload and is released only by its
  owner token. Artifacts use a SHA/release/timestamp identifier.
- `manifest.sha256` covers the frontend, backend, package metadata, Prisma
  schema, and `server/ecosystem.config.js`. The remote side verifies it in a
  staging directory before promotion.
- Database migration is disabled by default. `-DbPush` is blocked unless the
  operator explicitly sets `DEPLOY_DB_ENABLED=true` (or `1`), and the remote
  gate requires a successful `pg_dump` first. `-NoDb` remains the explicit
  no-migration contract.
- Existing release directories are moved to rollback locations only after the
  staged artifact, checksums, dependencies, and optional database gate pass.
- Readiness requires HTTP success **and** a JSON `status: "ready"` body; an
  arbitrary HTTP 200 is not accepted.

## Evidence and blockers

Each run writes `deployment-evidence-<release-id>.json` locally (without
credentials). The evidence is an operational handoff artifact and should be
attached to the change record by the IT Service Manager.

This repository does not contain VPS `known_hosts`, production environment
files, database credentials, or a staging VPS. Those are intentional external
blockers. Do not commit or print them. Development status is **NO-GO** until
IT confirms host-key provisioning, backup/restore readiness, and a controlled
staging run.
