# Development fast deploy

`scripts/deploy-dev.ps1` is a development-only path. It is intentionally not
a wrapper for `scripts/deploy.ps1` and has no database flag: `-NoDb` is always
enforced.

## Prerequisites / ITSM handoff

An operator must obtain and record, without placing secrets in the repository:

1. Development VPS address, non-production deploy user, and the exact approved
   target directory `/var/www/zen-dev`. The development script rejects every
   other target; a substring such as `dev` is not sufficient.
2. A pinned `known_hosts` file whose SHA-256 is recorded in the evidence.
3. A change ticket for any dirty application tree.
4. A development PM2 environment providing `ZEN_DEV_APP_ROOT` and
   `ZEN_DEV_PORT`.

If any prerequisite is absent, the command must be blocked rather than
guessing. No SSH/SCP/deployment is run by local validation.

Evidence records release ID, Git SHA, dirty paths, allowlist, archive SHA-256,
health gate results, and failure phase. It never records credentials or env
contents. Rollback, if operated separately, is application-only; database
rollback is not part of this contract.

## Exact implementation files

The ITSM handoff contains these files only (never secrets or a VPS export):

- `scripts/deploy-dev.ps1` — single-command development operator path.
- `server/ecosystem.dev.config.js` — development-only PM2 contract.
- `deploy-bot/tests/test_deploy_dev_contract.py` — contract tests.
- `deploy-bot/tests/test_deployment_hardening.py` — SSH/provenance tests.
- `docs/deploy-dev-runbook.md` — this operator handoff.

The local artifact is `<release-id>.zip` with `<release-id>.zip.sha256` and
`manifest.sha256`. Database migration, schema modification, seed, and data
operations are not execution steps; the path has no database flag and fails
closed on protected database changes.

## Exact human preflight checklist (no secrets in the handoff)

The authorized human must check every item and record the result in ITSM before
invocation:

- [ ] Approved change, window, impact, and named operator exist.
- [ ] `VpsIp`, `VpsUser`, `TargetDir`, `DevPort`, and `KnownHostsFile` are
  obtained through the approved secure channel. `TargetDir` is exactly
  `/var/www/zen-dev`; `VpsUser` is not production/root.
- [ ] `KnownHostsFile` is pinned and its expected SHA-256 is independently
  verified. Do not copy it into the repository.
- [ ] The operator's SSH key/agent is available without printing or recording
  credentials; BatchMode authentication is confirmed by the operator.
- [ ] Remote PM2 is available and its environment contract will provide
  `ZEN_DEV_APP_ROOT` and `ZEN_DEV_PORT`; no `.env` export is supplied in the
  artifact.
- [ ] The working-tree result is recorded. If dirty, `ChangeTicket` exactly
  matches `CHG-...`, `INC-...`, or `RFC-...`; protected/database changes are
  rejected regardless.
- [ ] Local parser, contract tests, application tests, and both builds pass;
  raw output and commit SHA are retained.
- [ ] No migration, schema push, seed, or data command is planned.

### Required non-secret values

```text
Environment       = development
VpsIp              = <approved development host>
VpsUser            = <approved non-production user>
TargetDir          = <absolute remote path containing dev>
KnownHostsFile     = <local pinned known_hosts path>
Operator           = <audit-safe operator identifier>
DevPort            = <approved 1..65535 development port>
ChangeTicket       = <CHG-... | INC-... | RFC-... when tree is dirty>
EvidenceDirectory  = <local evidence directory, optional>
```

### Command invocation and expected output

From the repository root, the authorized human runs (PowerShell):

```powershell
& .\scripts\deploy-dev.ps1 -Environment development `
  -VpsIp '<VPS_IP>' -VpsUser '<DEV_USER>' -TargetDir '<TARGET_DIR>' `
  -KnownHostsFile '<PINNED_KNOWN_HOSTS>' -Operator '<OPERATOR>' `
  -DevPort <DEV_PORT> -ChangeTicket '<CHG-...>' `
  -EvidenceDirectory '<EVIDENCE_DIR>'
```

For a clean tree omit `-ChangeTicket`; do not add production or database flags.
Expected successful stdout includes `[PHASE] preflight`,
`[PHASE] local-test-build`, `[PHASE] package-allowlist`,
`[PHASE] remote-lock-upload-promote`, then
`[SUCCESS] Development deploy contract completed.` Exit code is `0`.

### Artifact and build evidence checklist

- [ ] `deployment-evidence/<release-id>.json` has `SUCCEEDED`, Git SHA,
  `dirtyPaths`, known-hosts SHA-256, allowlist, archive SHA-256, and health
  status; it contains no credentials or environment contents.
- [ ] `<release-id>.zip` and `<release-id>.zip.sha256` are retained until the
  change is closed; `manifest.sha256` is inside the archive.
- [ ] Raw output shows root test/build and server test/build success.
- [ ] Archive contains only the documented allowlist, including
   `server/ecosystem.dev.config.js`; no `.env`, `.git`, `node_modules`, uploads,
   cache, migrations, seed, or database files.
- [ ] The packaged `server/prisma/schema.prisma` is SHA-256 byte-identical to
  the target baseline before promotion; a schema mismatch aborts the release.
- [ ] Remote health evidence records both `/api/v1/health/live` (`alive`) and
  `/api/v1/health/ready` (`ready`) on `DevPort`.

### Abort and rollback

On invalid preflight, lock contention, checksum/manifest mismatch, staging,
dependency, PM2, or health failure: **stop**, do not retry blindly, preserve
stdout and evidence, and notify the human release owner. The script releases
only its own remote lock. If promotion already occurred and health fails, the
script attempts an application-only rollback of `dist`, `server/dist`, and
`server/node_modules`; verify the resulting PM2 and health state manually.
If rollback is incomplete, use the approved human rollback procedure—never
run migrations, seed, schema push, or database rollback under this contract.

### Post-deploy validation

- [ ] Confirm PM2 app `backend-api-dev` is online with the expected script,
  cwd, `NODE_ENV=development`, and `DevPort`.
- [ ] Confirm both liveness and readiness JSON responses are `alive`/`ready`.
- [ ] Confirm the deployed `deploy.json` release ID and Git SHA match local
  evidence and the archive sidecar checksum.
- [ ] Exercise the approved development smoke path, review PM2 logs for
  startup errors, and attach results to ITSM.
- [ ] Confirm no database operation was executed and close/retain evidence.

The promotion keeps the previous application files in a release-specific
recovery directory before switching the current files. Any partial promotion
or failed health gate must restore the complete previous set, restart PM2
without suppressing errors, and pass both liveness and readiness. A rollback
failure is a separate fail-closed outcome and requires ITSM escalation.

## Current readiness

Local code readiness is **VERIFIED (static only)** after parser, contract,
tests, and build validation. Operational GO is **NO-GO / BLOCKED** until human
prerequisites, ITSM approval, host-key verification, staging validation, and
an authorized operator are present. Local validation performs no SSH, SCP, VPS,
or secret action.
