# Final Change Pack — CHG-20260811-DEV-FAST-DEPLOY

**Review date:** 2026-08-11  
**Decision:** **BLOCKED / NO-GO — conditional user approval recorded; ITSM
readiness incomplete**
**Change type:** Normal — development-only application fast deploy

**Conditional maintenance window:** **11 August 2026, 03:38–21:00 WIB
(UTC+7)**. This is a bounded window for the approved scope only; it is **not
automatic deployment authorization**. The change remains **NO-GO** until all
readiness evidence is PASS and ITSM accepts the gate.

This pack is the controlled handoff for the first development deployment. It
does not authorize execution. No VPS, SSH, SCP, deployment, secret access, or
implementation-code change was performed by ITSM.

## Maintenance window record — 2026-08-11

- **Window:** 11 August 2026, **03:38–21:00 WIB (UTC+7)**
- **UTC equivalent:** 10 August 2026 20:38–11 August 2026 14:00 UTC
- **System-time review:** 11 August 2026 03:38:05 WIB; the window is **ACTIVE**
  (not ended). No new window is required at this review point.
- **Authorization meaning:** scheduling does **not** constitute GO. Every
  readiness gate and the ITSM final go/no-go acceptance remain mandatory.

## Local readiness review update — 2026-08-11

- Frontend tests: **PASS — 31 tests** (`npm test -- --run`).
- Frontend build: **PASS** (`npm run build`).
- Deployment contract/hardening tests: **PASS — 11 tests** (local pytest).
- No VPS, SSH, SCP, deployment, database, or secret action was performed.
- **User evidence received:** non-root SSH login, verified fingerprint, writable
  target, port 5000 available, and PM2 available. These are **verified within
  scope only**; no SSH, deployment, or secret action was performed by ITSM.
- **Actual blockers:** operator identity/coverage, approved-window validity,
  scoped commit/diff and generated artifact hashes, raw logs, DBRE acknowledgement,
  pre-change baseline, rollback readiness, authorized staging health/rollback
  evidence, dirty-tree disposition, and ITSM final readiness acceptance.
- **Readiness decision:** local checks PASS, but operational status remains
  **BLOCKED / NO-GO**. The active window does not waive any gate.

## 1. Scope and segregation of duties

**In scope:** application-only development release using the reviewed
development runbook and exact approved artifact.

**Out of scope:** production, database migration/schema/seed/data, `--db`,
Database Optimizer work (postponed), DNS/firewall changes, secret handling,
and any target not explicitly recorded in the approval.

| Role | Assignment | Authority |
|---|---|---|
| User | Human business approver | Approves scope/window/risk only; **never executor** |
| IT Service Manager | Change owner/gatekeeper and Incident Commander | No VPS/SSH/SCP/deploy execution |
| DevOps Release Operator | **Primary operator** | Executes only the approved ticket, target, window, and runbook |
| DevOps backup | **Secondary operator** | Takes over only through a recorded handoff; no parallel execution |
| SRE on-call | Readiness/health observer and incident responder | No deploy authority unless separately approved |
| Orchestrator | Implementation, local validation, artifact preparation | Non-executor; cannot self-approve |

## 2. Latest Orchestrator evidence reviewed

The latest repository handoff reports: contract/hardening tests **11 passed**,
frontend tests **31 passed**, frontend build passed, server tests **128 passed**,
server build passed, PM2 config contract passed, and PowerShell parser passed. The no-DB/development-only
controls are verified by static contract review. These are reported local
results; raw logs, timestamps, exact provenance, and artifact hashes are not
attached here and therefore are not operational evidence.

**Evidence disposition:** local readiness = **Verified (static/reported)**;
operational readiness = **Unverified**. Passing local tests is not GO.

## 3. Operator handoff checklist — execute only after all gates pass

### Before window opens

- [ ] Approved change ticket and UTC window are present and unchanged.
- [ ] Primary identity/contact: `DevOps Release Operator` recorded.
- [ ] Secondary identity/contact: `DevOps backup` recorded.
- [ ] SRE on-call identity/contact and coverage window recorded.
- [ ] Development VPS address, non-production user, absolute target directory,
      target environment, and `DevPort` are recorded; no secrets are recorded.
- [ ] Pinned `known_hosts` path and SHA-256 are recorded; fingerprint is
      independently verified through a trusted channel.
- [ ] Exact commit SHA, scoped diff/file disposition, release ID, allowlist,
      artifact manifest, archive SHA-256, and reproduction command are attached.
- [ ] Dirty tree is absent, or an approved `CHG-`/`INC-`/`RFC-` ChangeTicket
      lists every dirty path. Database/protected paths remain denied.
- [ ] Local raw test/build/parser logs include UTC time, command, exit code, and
      location. No credentials, environment values, or secret contents appear.
- [ ] Pre-change liveness/readiness and release baseline are captured.
- [ ] Application-only prior release identifier, rollback owner, and validation
      steps are available. DB rollback is not part of this change.
- [ ] ITSM, operator, backup, SRE, and approver acknowledge the same ticket,
      release ID, target, and window.

### During execution (primary only)

1. Reconfirm ticket, target, host-key hash, environment, port, release ID, and
   artifact hash; stop on any mismatch.
2. Capture start time and baseline, then use only the existing development runbook.
3. Do not add database flags or run migration/schema/seed/data commands.
4. Report phase, blockers, exit code, remote release ID, and health evidence to
   ITSM/SRE; do not state success before validation.
5. Backup takes over only after an explicit recorded handoff naming current
   phase, evidence location, and stop/rollback state.

### After execution

- [ ] Capture liveness and readiness showing `status: "ready"`, release ID,
      checksum/provenance, and raw execution log.
- [ ] Record rollback triggered/not-triggered and the reason.
- [ ] Operator hands the evidence bundle to ITSM and SRE; ITSM validates and
      closes or opens incident/problem/PIR records.

## 4. Single-response approval template for the user

Use only after every blocker in §7 is cleared. The user supplies one structured
decision; the user does not execute any action.

```text
DECISION: APPROVED / REJECTED — CHG-20260811-DEV-FAST-DEPLOY
Scope: development-only application deploy; DB migration/schema/seed/data = OUT OF SCOPE
Database Optimizer: POSTPONED; DBRE: readiness acknowledgement only
Target (non-secret host / environment / port): [exact values]
UTC window: [start]–[end]
Primary: DevOps Release Operator [name/contact]
Secondary: DevOps backup [name/contact]
SRE on-call: [name/contact/coverage]
ChangeTicket: [ID or N/A, with evidence]
Stop/rollback authority: ITSM + SRE acknowledged
Residual risk: ACCEPT / REJECT (reference E-01–E-12)
Approver: [user name/role]
Decision time UTC: [timestamp]
Audit reference: [ticket/comment]
```

## 5. Evidence index

| ID | Required evidence | Owner | Status |
|---|---|---|---|
| E-01 | Latest local tests/build/parser report | Orchestrator | Verified as reported; raw logs absent |
| E-02 | No-DB/development-only contract and runbook | ITSM | Verified static |
| E-03 | Exact commit, scoped diff, file disposition | Orchestrator/ITSM | **Missing — blocker** |
| E-04 | Artifact, manifest, archive sidecar SHA-256, reproduction | Orchestrator | **Missing — blocker** |
| E-05 | VPS, target environment/port/directory, non-production boundary | Primary operator | **Partial: writable target and port 5000 verified within scope; blocker remains** |
| E-06 | Pinned `known_hosts` path/hash and independent fingerprint verification | Operator/Security | **Partial: fingerprint verified within scope; path/hash attachment remains a blocker** |
| E-07 | Established primary/backup/SRE operator roles and coverage evidence | ITSM/operator | **Role model recorded; readiness evidence pending — blocker** |
| E-08 | Dirty-tree ChangeTicket or clean commit evidence | Orchestrator/ITSM | **Missing — blocker** |
| E-09 | DBRE acknowledgement; Optimizer postponed | DBRE/ITSM | **Pending — blocker** |
| E-10 | Conditional user approval; maintenance window, target, operator, risk | User/ITSM | **Window recorded conditionally; target/readiness details missing — blocker** |
| E-11 | Pre/post health, execution log, release/checksum evidence | Operator/SRE | Not applicable until approved run |
| E-12 | Rollback/abort result or explicit not-triggered record | Operator/SRE/ITSM | Not applicable until approved run |
| E-13 | User-provided preflight: non-root login, fingerprint, writable target, port 5000, PM2 | User/ITSM | **Verified within stated scope; no execution authorization** |
| E-14 | Operator identity/coverage, current window validity, baseline, rollback readiness | ITSM/operator/SRE | **Unverified — blocker** |

Evidence absent or merely asserted is **UNVERIFIED**, never PASS.

## 6. Abort, rollback, and escalation

**Abort before execution:** missing/changed VPS or target; wrong environment or
port; unknown/unverified host fingerprint; missing approval, operator, backup,
or SRE; dirty tree without valid ticket; artifact/hash mismatch; database flag
or command; secret exposure; scope drift; or any unexpected output.

**Rollback after execution:** readiness is not `status: "ready"`; health fails
or materially regresses from baseline; checksum/release verification fails; the
service cannot start; critical flow/error rate degrades; unauthorized change is
detected; or ITSM/SRE orders stop. Roll back the application-only prior release
using the approved procedure. Never improvise database rollback.

**Escalation:** P1 (unauthorized action, secret exposure, outage, data-integrity
concern, or failed rollback): stop, preserve evidence, notify ITSM Incident
Commander and Security immediately; update within 15 minutes then every 30;
open a linked problem. P2: IT Manager within 30 minutes and updates every 60.
P3: record/link the incident and return to Orchestrator for problem analysis.

## 7. Remaining blockers — facts that still block

1. **VPS/target not evidenced:** development VPS, non-production user, target
   directory, environment, and port are absent.
2. **Host trust not evidenced:** pinned `known_hosts` and independently verified
   fingerprint/hash are absent.
3. **Readiness evidence for operator handoff:** the primary, backup, and SRE
    roles are defined; the ticket/window acknowledgement and operational
    readiness evidence are not complete.
4. **Provenance/package not evidenced:** exact scoped commit/diff, dirty-tree
   disposition, generated artifact, manifest, and SHA-256 are absent.
5. **DBRE acknowledgement absent:** postponed Optimizer is recorded, but the
   one-time application-only DBRE readiness acknowledgement is pending.
6. **Operational run evidence absent:** no approved staging/health/rollback
   execution evidence exists.
7. **Final approval details/ITSM gate absent:** conditional user approval is
    recorded for the development target, application-only scope, and operator
    model, but the exact window, target values, residual-risk record, and ITSM
    acceptance are not complete.
8. **Maintenance window:** User supplied **2026-08-11 03:38–21:00 WIB
   (UTC+7)** conditionally. It does not clear any readiness blocker or
   authorize execution.
9. **ITSM readiness acceptance absent:** conditional user approval does not
   replace ITSM evidence review or the final go/no-go gate.

Until blockers 1–9 are evidenced and ITSM accepts them, status remains
**NO-GO**. Do not ask the user to execute anything or treat the conditional
approval as execution authority. After blockers clear, ITSM must validate the
single structured approval record in §4 before any separate execution change.

## 8. Conditional user approval and execution boundary — 2026-08-11

User approval is recorded conditionally for the **development VPS** and
**application-only** scope. Database migration/schema/data operations are
**prohibited**. The named operating model is primary `DevOps Release Operator`,
backup `DevOps backup`, and `SRE on-call` for readiness/incident response.

This approval is not deployment authorization. No VPS, SSH, SCP, deployment, or
secret action may occur. Continue only local readiness and documentation. The
maintenance window is recorded as **2026-08-11 03:38–21:00 WIB (UTC+7)**
conditionally. Status remains **BLOCKED / NO-GO** until ITSM completes
readiness and accepts the real blockers above.

### Minimum user request if the window expires

If the window expires before all readiness evidence is PASS, request only a
new **date, start time, end time, and timezone**. No credentials or secrets are
requested through chat.
