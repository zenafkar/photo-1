# ITSM handoff — development fast deploy

**Decision:** **BLOCKED / NO-GO for operational deployment. Conditional user
approval is recorded, but ITSM readiness is incomplete.** Local implementation is ready
for human review; first deployment remains a human DevOps Release Operator
activity. The deploy bot is not primary. No SSH, SCP, VPS, deployment, or
secret access was performed.

## Maintenance window record — 2026-08-11

- **Recorded window:** 11 August 2026, **03:38–21:00 WIB (UTC+7)**
  (10 August 2026 20:38–11 August 2026 14:00 UTC).
- **System-time check:** 11 August 2026 03:38:05 WIB; window is **ACTIVE**, not
  expired. No replacement window is needed now.
- **Gate rule:** the active window is scheduling information only, never GO;
  all readiness gates, evidence, and ITSM final acceptance remain required.

## Exact implementation scope

- `scripts/deploy-dev.ps1`
- `server/ecosystem.dev.config.js`
- `deploy-bot/tests/test_deploy_dev_contract.py`
- `deploy-bot/tests/test_deployment_hardening.py`
- `docs/deploy-dev-runbook.md`
- `docs/change-management/CHG-20260811-DEV-FAST-DEPLOY-HANDOFF.md`

The working tree also contains pre-existing/unrelated application UI, prompt,
bot, governance, and production-deploy changes. They were not overwritten or
used as deployment evidence; ITSM must disposition them before a scoped commit
is created.

## Local evidence (latest Orchestrator patch reviewed 2026-08-11)

| Check | Command | Result |
|---|---|---|
| Python deploy contract/hardening tests | `python -m pytest deploy-bot/tests/test_deploy_dev_contract.py deploy-bot/tests/test_deployment_hardening.py -q` | PASS — 16 passed, exit 0 (reported) |
| PowerShell parser | `Parser.ParseFile(scripts/deploy-dev.ps1, ...)` | PASS — no parse errors, exit 0 |
| PM2 syntax | PM2 configuration syntax validation | PASS — reported |
| Frontend tests | `npm test -- --run` | PASS — 31 passed, exit 0 |
| Frontend build | `npm run build` | PASS — Vite build, exit 0 |
| Server tests | `npm --prefix server test -- --run` | PASS — 128 passed, exit 0 |
| Server build | `npm --prefix server run build` | PASS — TypeScript build, exit 0 |

The latest patch review records the exact target directory `/var/www/zen-dev`,
fail-closed target isolation, rollback fail-closed behavior, partial-promotion
recovery, schema-baseline verification, protected connection paths, and
behavioral tests. The contract also enforces development-only targeting, dirty
application paths requiring `ChangeTicket`, protected database paths denied, no
database flag, allowlist plus SHA-256 manifest, pinned `known_hosts`, remote
lock, staging-before-promotion, PM2 dev config, JSON liveness/readiness, and
application-only rollback. Database migration/schema/data work is out of scope
and has not been executed.

The patch evidence is accepted for local/static review only. It does not provide
VPS, `known_hosts`, operator, artifact-operational, staging, actual rollback, or
approval evidence.

## User-provided preflight evidence — verified within scope

The user supplied evidence for a **non-root SSH login**, **verified host
fingerprint**, **writable target**, **port 5000 available**, and **PM2
available**. ITSM records these claims as verified only for the stated
preflight scope. ITSM did not run SSH, VPS, SCP, deployment, or secret actions;
these claims do not establish operator identity, authorization, artifact
provenance, baseline, rollback readiness, or final GO.

## Remaining human prerequisites / operator checklist

1. ITSM must complete readiness acceptance. The user-recorded window is
   **11 August 2026, 03:38–21:00 WIB (UTC+7)**. It is conditional only and
   does not authorize deployment; NO-GO remains active until all evidence is
   PASS.
2. The operator roles are already determined: `DevOps Release Operator`,
   `DevOps backup`, and `SRE on-call`. Record only the remaining handoff
   readiness evidence and coverage acknowledgement; this does not authorize
   execution.
3. Securely verify and provision the pinned `known_hosts` file; do not commit
   it or expose fingerprints/secrets in this repository.
4. Supply the complete non-secret target record and the dirty-tree
   `CHG-`/`INC-`/`RFC-` ticket if applicable; supplied port 5000 and writable
   target evidence is not a substitute for the approved target record.
5. Create a scoped commit/diff and attach generated `<release-id>.zip`,
   `<release-id>.zip.sha256`, `manifest.sha256`, and evidence JSON.
6. Complete an authorized staging/health/rollback exercise and attach raw
   results. Do not run database migration, schema, seed, or data operations.
7. Attach DBRE's one-time application-only readiness acknowledgement; the
   Database Optimizer remains postponed.
8. Obtain ITSM's final go/no-go readiness acceptance; passing local tests and
   the conditional user approval are not operational GO.

**Final readiness:** `LOCAL CODE: VERIFIED (static)` / `PREFLIGHT: VERIFIED
WITHIN SCOPE` / `OPERATIONAL: **BLOCKED, NO-GO**` pending operator identity,
window validity, scoped provenance, artifact/hash, raw logs, DBRE acknowledgement,
baseline, rollback, and ITSM final readiness acceptance.

## Conditional user approval record — 2026-08-11

The user conditionally approved the bounded intent: development VPS target,
application-only scope, and no database migration/schema/data operation. The
primary is `DevOps Release Operator`, backup is `DevOps backup`, and `SRE
on-call` is the readiness/incident role. This records approval of scope only;
it is not permission to deploy and does not authorize SSH, SCP, secrets, or
 database work. Continue only with local readiness/documentation that requires
 none of those actions. Status stays **BLOCKED** until ITSM completes readiness.

## Minimum user request if the window expires

If all readiness evidence is not PASS before the window ends, request only a
new **date, start time, end time, and timezone**. Do not send credentials or
secrets through chat.
