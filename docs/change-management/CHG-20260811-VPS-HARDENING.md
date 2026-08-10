# Change Record — CHG-20260811-VPS-HARDENING

**Change type:** Normal / Major (production VPS deployment and deployment-path hardening)  
**Change owner:** IT Service Manager  
**Implementer:** Agents Orchestrator (implementation remains with Orchestrator)  
**Status:** **NO-GO — evidence and approvals incomplete**
**Scope boundary:** Local repository/governance review only. No VPS deployment, external-system change, credential handling, DNS/firewall action, or database migration was performed by ITSM. Deployment-path files are in scope; UI/prompt files are explicitly out of scope pending separate traceability.

## Maintenance window record — 2026-08-11

- **Window:** 11 August 2026, **03:38–21:00 WIB (UTC+7)**
  (10 August 2026 20:38–11 August 2026 14:00 UTC).
- **System-time check:** 11 August 2026 03:38:05 WIB; window is **ACTIVE**, not
  ended. No new window is required at this review point.
- **Control:** this window is not a GO decision. All readiness gates remain
  mandatory and the change remains **NO-GO** while evidence/approvals are open.

## Change objective

Harden and validate the canonical VPS deployment path, including artifact validation, SSH execution, database-backup guardrails, health gates, automatic rollback, and service restart behavior. UI/prompt changes in `src/` are not accepted as evidence for this change and require separate traceability.

## Risk register

| ID | Risk | I | P | Score | Level | Control / required evidence | Status |
|---|---|---:|---:|---:|---|---|---|
| R-01 | SSH policy is fail-closed in the reviewed scripts, but the operator `known_hosts` file and independently verified VPS fingerprint are not present. | 5 | 4 | 20 | High | User-approved fingerprint recorded; use pinned known_hosts / fail-closed verification. | **Open — NO-GO** |
| R-02 | Rollback has not been executed or tested against a disposable/local fixture. | 5 | 3 | 15 | Medium | Capture rollback test output, artifact checksum, and both health-gate results. | Open |
| R-03 | Database rollback is not implied by binary rollback; migration impact is not proven. | 5 | 3 | 15 | Medium | Explicit migration plan, backup/restore validation, and user approval if `--db` is in scope. | Open |
| R-04 | Working tree contains uncommitted deployment-path changes plus unrelated UI/prompt changes. | 3 | 4 | 12 | Medium | Orchestrator provides clean commit boundary and traceability. | Open |
| R-05 | External health, DNS, firewall, and service state are unverified because no VPS access was used. | 5 | 3 | 15 | Medium | Operator evidence after approval; no claims before evidence. | Open |
| R-06 | Production artifact/build provenance is not attached to this change; improved generation/verification paths are static only. | 4 | 3 | 12 | Medium | Release manifest, ZIP SHA-256, tracked-file/blob validation, and build logs. | Open |

**Risk decision:** High risk exists (R-01). Per policy this change is **NO-GO** until the gate evidence and user approvals are recorded.

## Actual RACI

| Activity | User / Business approver | IT Service Manager | Agents Orchestrator | Security reviewer | VPS operator |
|---|---|---|---|---|---|
| Scope and production authorization | **A** | R/C | C | C | I |
| Code / script implementation | I | C | **R/A** | C | I |
| Local test and static review | I | **A** | R | C | I |
| SSH host-key verification | **A** | R/C | R (procedure/evidence) | C | **R** |
| Firewall/DNS and VPS execution | **A** | C | C | C | **R** |
| Database migration / risk acceptance | **A** | R/C | R (technical plan) | C | R |
| Go / no-go decision | **A** | **R** | C | C | I |
| Post-change validation and closure | A | **R/A** | R | C | R |

Unassigned roles are blockers, not implicit approvals.

## Phase gates

### P0 — Intake and safety gate: **FAIL / NO-GO**

- [x] Change ID, scope boundary, risk register, and RACI created.
- [x] No deployment or external-system mutation performed.
- [ ] Current local test evidence attached to this review (older reported results are not revalidated here).
- [ ] User approval for production window and risk acceptance.
- [ ] Verified VPS host key/fingerprint and pinned SSH policy.
- [ ] Explicit decision whether database migration is in scope.
- [ ] Clean commit boundary and release artifact provenance.

### P1 — Implementation readiness: **BLOCKED**

- [ ] Orchestrator supplies implementation summary linked to exact commit/diff and separates UI/prompt work.
- [ ] Static review confirms fail-closed SSH policy; **fingerprint/known_hosts evidence remains missing**.
- [ ] Build/package validation proves required files and hashes.
- [ ] Backup exists and is independently restorable.
- [ ] Rollback procedure is tested without relying on production.
- [ ] Maintenance window, operator, communication channel, and abort criteria are named.

### P2 — Post-change acceptance: **NOT STARTED**

- [ ] Local and external readiness endpoints return expected status.
- [ ] Service/process, permissions, logs, and monitoring are validated.
- [ ] No unauthorized change, unexpected incident, or SLA breach.
- [ ] Rollback result recorded if invoked; database outcome separately recorded.
- [ ] PIR/problem record created for any failed gate, incident, or recurring defect.
- [ ] ITSM closure approval and evidence bundle archived.

## Internal SLA

| Event | Internal target |
|---|---:|
| Orchestrator acknowledges review findings | 2 business hours |
| Critical/High risk escalation | Immediately, before implementation |
| Evidence request response | 4 business hours |
| P1 deployment incident communication | First update ≤15 minutes; every 30 minutes |
| P2 deployment incident communication | First update ≤30 minutes; every 60 minutes |
| PIR after failed/major change | 1 business day |
| Change record closure after successful validation | 2 business days |

## Evidence index

| E-ID | Evidence | Location / result | Strength |
|---|---|---|---|
| E-01 | Repository state and diff | Current `git status --short`: 7 modified files plus 7 untracked files; deployment-path and UI/prompt changes are mixed | Actual, incomplete |
| E-02 | Frontend/unit test result | Prior report says `npm test -- --run`: 6 files, 31 tests passed; not rerun for this reconciliation | Carried-forward, not current |
| E-03 | Deploy-bot test result | Prior report says `python -m pytest deploy-bot/tests -q`: 54 passed; not rerun for this reconciliation | Carried-forward, not current |
| E-04 | Static diff hygiene | `git diff --check`: no whitespace errors observed | Actual local evidence |
| E-05 | Deployment guardrails | Current diff adds dirty-tree gate/override, recursive manifest and ZIP sidecar SHA-256, release-ID check, metadata rollback, and JSON readiness checks | Static review only; no execution evidence |
| E-06 | Host-key control | `StrictHostKeyChecking=yes` appears in `scripts/deploy.ps1:86`, `scripts/setup-ssh.ps1:24`, and deploy-bot path; no repository `known_hosts` or fingerprint evidence | Static control improved; **verification missing** |
| E-07 | VPS execution / external health | Not executed | Missing |
| E-08 | Artifact checksum/provenance | Script now generates recursive `manifest.sha256` and ZIP sidecar SHA-256 (`scripts/deploy.ps1:355-365`); no generated artifact, blob validation, or build log attached | Static/incomplete |
| E-09 | Rollback test | Not executed | Missing |
| E-10 | Database restore/migration validation | Not executed; no backup/restore evidence or DB-scope decision attached | Missing |
| E-11 | Hardening regression test | Untracked `deploy-bot/tests/test_deployment_hardening.py` now covers SSH, provenance, lock cleanup, rollback metadata, readiness, dirty-tree policy, and sidecar hash; execution output is not attached | Test source only; incomplete |

No claim of deployment success, VPS hardening success, rollback success, or external health is valid without E-07 through E-10.

## Handoff log

| Time (UTC) | From → To | Handoff | Acceptance condition | Status |
|---|---|---|---|---|
| 2026-08-11 | ITSM → Orchestrator | Provide exact change-scoped diff/commit, artifact manifest, and response to R-01…R-06. | Traceable deliverable; no secrets. | Pending |
| 2026-08-11 | ITSM → User | Approval request for host-key, maintenance window, DB scope, and residual-risk decisions. | Explicit decisions recorded. | Pending |
| TBD | Orchestrator → ITSM | P1 evidence bundle and implementation report. | All P1 checklist items evidenced. | Blocked |
| TBD | VPS operator → ITSM | P2 operational evidence after authorized execution. | Health, logs, rollback/abort outcome. | Not started |

## Decisions only the user may make

1. Approve or reject production VPS change window and business impact.
2. Provide/approve the expected VPS host-key fingerprint through a secure existing channel; **do not send credentials or secrets here**.
3. Decide whether database migration (`--db`) is in scope.
4. Accept or reject residual risk if any High/Medium item remains open.
5. Approve firewall/DNS changes, credential rotation, or other external-system changes if proposed.
6. Name the authorized VPS operator and incident escalation contact.

## Approval requests

### AR-01 — Host-key verification

**Recommended decision:** Reject deployment until the expected fingerprint is independently verified and SSH is fail-closed against a pinned known_hosts entry.  
**Safe default:** No VPS access / no deployment.

### AR-02 — Database scope

**Recommended decision:** Keep database migration out of this change unless a migration plan, backup/restore evidence, and explicit approval are attached.  
**Safe default:** Deploy application/artifact only; no schema mutation.

### AR-03 — External controls

**Recommended decision:** Do not change firewall, DNS, credentials, or external services under this record without a separately approved implementation step and rollback plan.  
**Safe default:** No external-system mutation.

## Current valid status report — final review 2026-08-11

- **Progress:** Governance record reconciled against the current repository state; no operational execution performed.
- **Completed:** Stale host-key claim removed from this record; deployment/UI-prompt scope boundary recorded; current working-tree counts recorded; fail-closed SSH, dirty-tree gate, recursive manifest, archive sidecar hash, metadata rollback, and JSON readiness paths reviewed statically.
- **In progress:** Evidence reconciliation; Orchestrator claims are not yet backed by execution artifacts.
- **Blocked:** Verified VPS `known_hosts`/fingerprint, controlled staging, rollback test, database backup/restore, dirty-tree decision, generated artifact provenance/build log, production authorization, and VPS/external validation.
- **Evidence:** E-01, E-04, E-05, E-06 are current static/repository evidence; E-02/E-03 are carried-forward only; E-07/E-09/E-10 remain missing; E-08 and E-11 are static/incomplete.
- **Residual risk:** High (R-01), with unvalidated rollback, database recovery, dirty-tree provenance, and operational behavior.
- **Next handoff:** Orchestrator → ITSM with one change-scoped evidence bundle containing test output, known_hosts verification evidence, staging result, rollback result, restore result, generated artifact hashes, and build log. UI/prompt changes must be handed off separately.
- **Minimum user decisions required:** (1) production window/authorization, (2) DB migration scope, (3) residual-risk acceptance only after all evidence is complete. All evidence collection and operator execution remain delegated.
- **Closure:** Not eligible. **NO-GO remains active.**
