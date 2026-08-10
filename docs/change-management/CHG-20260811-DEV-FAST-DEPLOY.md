# Change Record — CHG-20260811-DEV-FAST-DEPLOY

**Change type:** Normal / Development-only fast deploy
**Change owner:** IT Service Manager
**Implementation owner:** Orchestrator (code implementation remains with Orchestrator)
**Status:** **BLOCKED / NO-GO — conditional user approval recorded; ITSM readiness remains incomplete**
**Review date:** 2026-08-11

## Approved maintenance window (conditional)

The user-recorded window is **11 August 2026, 03:38–21:00 WIB (UTC+7)**,
equivalent to **10 August 2026 20:38–11 August 2026 14:00 UTC**. At the
system-time review (11 August 2026, 03:38:05 WIB), the window is **ACTIVE** and
has not ended. No new window is required at this review point. This is a
**conditional approved maintenance window only**, not
automatic deployment authorization. It applies only to the explicitly bounded
development, application-only scope after every readiness gate passes. Status
remains **NO-GO**; no VPS, SSH, SCP, deployment, database, or secret action is
authorized.

## 1. Scope and non-scope

### In scope

- Local development build, test, packaging, and evidence collection for an application-only fast-deploy candidate.
- Traceability of the exact change-scoped commit/diff, artifact manifest, checksums, test output, and handoff.
- Development readiness validation only; this record does not authorize production execution.

### Explicitly out of scope

- Database migration, schema change, seed/data change, `--db`, `prisma migrate`, `db push`, backup/restore execution, or data mutation.
- Database Optimizer work; **postponed** and not an acceptance criterion for this change.
- VPS deployment, SSH, SCP, DNS, firewall, PM2/service restart, or external health execution.
- Secret collection, printing, copying, rotation, or handling in this review.
- UI/prompt changes unless Orchestrator supplies separate traceability and approval; they are not evidence for this change.

**DBRE control:** DBRE is **notified for one-time application-only readiness review only**. DBRE has no migration authority and no execution task under this change. Any database-scope request requires a new change record and explicit human approval.

## 2. Change objective and acceptance criteria

Produce a reviewable development-only fast-deploy package without changing external systems, while proving that the package is reproducible, traceable, and application-only.

The Orchestrator handoff is acceptable only when all criteria below have direct evidence:

1. Exact commit SHA and clean change-scoped diff are identified; unrelated files are separated or explicitly dispositioned.
2. Build and relevant automated tests pass with captured commands, timestamps, exit codes, and logs.
3. Artifact contains only approved application files; manifest and SHA-256 are attached and independently reproducible.
4. Static review proves database migration/schema/data paths are not invoked and `--db` is not used.
5. Database Optimizer is recorded as postponed; DBRE one-time readiness notification is recorded.
6. No deployment, VPS, SSH, SCP, or secret-handling action occurred; if any occurred, stop and open an incident/change breach record.
7. Rollback/abort instructions for a future authorized run are documented, but not executed against VPS under this record.
8. All claims distinguish **Verified**, **Unverified**, and **Not applicable**. Missing evidence is never PASS.

Failure of any item is **NO-GO**.

## 3. Actual RACI

| Activity | User / human approver | IT Service Manager | Orchestrator | DBRE | Security reviewer | Authorized operator |
|---|---|---|---|---|---|---|
| Scope and acceptance criteria | **A** | **R** | I | I | I | I |
| Code/build/test implementation | I | C | **R/A** | I | C | I |
| Evidence bundle and traceability | I | **A** | **R** | I | C | I |
| Application-only DB readiness notification | I | **A** | C | **R** (one-time readiness only) | C | I |
| Database migration/schema/data | **A** (new change required) | C | I | C | C | R only under new approval |
| VPS/SSH/SCP/deployment execution | **A** (separate approval) | C | I | I | C | R only under separate approved change |
| Incident declaration and coordination | I | **R/A** | C | C | C | C |
| Go / no-go decision | **A** | **R** | C | C | C | I |
| Closure and PIR/CSI follow-up | A | **R/A** | R | C | C | C |

Unassigned or implied approval is a blocker. Orchestrator does not approve its own production or external execution.

**Non-delegable user rule:** The User / business approver is an approval authority
only. The user may approve or reject scope, window, target, and residual risk when
explicitly requested, but may not execute, review evidence, operate tooling, or be
delegated an implementation or operational task. Approval cannot be inferred from
silence or from an active maintenance window.

## 4. Phase gates

### Gate G0 — Intake and boundary: **PASS with restrictions**

- [x] Change ID and development-only scope recorded.
- [x] Database migration/schema/data explicitly excluded.
- [x] Database Optimizer postponed.
- [x] DBRE limited to one-time readiness notification.
- [x] No implementation takeover by ITSM.
- [x] External execution and secret handling prohibited.

### Gate G1 — Development evidence: **PARTIAL PASS / BLOCKED for operational handoff**

- [ ] Exact Orchestrator commit/diff and file disposition attached.
- [x] Latest Orchestrator handoff reports combined contract/hardening tests 10 passed, frontend tests 31 passed, frontend build passed, server tests 128 passed, server build passed, and PowerShell parser OK. `git diff --check` is clean as previously reported.
- [ ] Artifact manifest and reproducible SHA-256 attached.
- [x] Static application-only/no-DB contract is evidenced by `scripts/deploy-dev.ps1`, `deploy-bot/tests/test_deploy_dev_contract.py`, and `docs/deploy-dev-runbook.md`.
- [ ] Actual VPS/SSH/SCP/secret-action audit is attached; local contract evidence is not an operational execution record.
- [ ] DBRE readiness notification and postponed optimizer item recorded.

### Gate G2 — Human approval for any external action: **CONDITIONAL / BLOCKED**

- [x] User-recorded conditional maintenance window: 2026-08-11 03:38–21:00 WIB (UTC+7).
- [ ] Human approver names target, impact, and authorized operator; window does not by itself authorize execution.
- [ ] Separate production/VPS change record exists if deployment is proposed.
- [ ] Host-key/known_hosts evidence is verified through a secure channel.
- [ ] Backup/restore and rollback evidence exists if database scope is ever proposed.

No G2 approval may be inferred from a passing local test.

### Gate G3 — Validation and closure: **NOT STARTED**

- [ ] Authorized execution evidence, external readiness, logs, and incident outcome (if any).
- [ ] PIR/problem record for failed gate, incident, or recurrence.
- [ ] ITSM closure approval and archived evidence bundle.

## 5. Risk register

| ID | Risk | Impact | Probability | Score | Level | Required control / acceptance evidence | Status |
|---|---|---:|---:|---:|---|---|---|
| R-01 | Mixed working-tree changes make fast-deploy provenance ambiguous. | 4 | 4 | 16 | **High** | Exact commit, scoped diff, file disposition, reproducible artifact. | **Open — NO-GO** |
| R-02 | Local test/build evidence is reported but raw logs/timestamps are not attached to the change record. | 4 | 2 | 8 | Low | Retain Orchestrator result bundle/raw logs if audit-grade reproducibility is required. | **Controlled — latest results verified as reported** |
| R-03 | Database mutation is accidentally included in an application-only package. | 5 | 2 | 10 | Medium | Explicit no-DB flags/path review and artifact inspection; no DB commands. | **Controlled by static contract; artifact/execution still not verified** |
| R-04 | Unauthorized VPS/SSH/SCP or secret handling occurs. | 5 | 2 | 10 | Medium | Written prohibition, operator gate, audit trail; stop and incident if violated. | Open |
| R-05 | Future binary rollback does not restore database state. | 5 | 3 | 15 | Medium | Keep DB out of scope; new approved DB change with restore evidence if needed. | Controlled / residual |
| R-06 | Database Optimizer work is conflated with readiness. | 3 | 3 | 9 | Medium | Mark postponed; separate backlog/CSI item, not a gate for this change. | Controlled |

Any Critical/High risk without verified control keeps this record **NO-GO**.

## 6. Evidence index

| E-ID | Evidence | Current assessment | Status |
|---|---|---|---|
| E-01 | Repository status/diff | Working tree contains deployment, UI, prompt, and new governance changes; scope is mixed. | **Verified, incomplete** |
| E-02 | Existing deployment hardening contract | States no VPS known_hosts, production env, credentials, or staging VPS are present and development is NO-GO. | **Verified** |
| E-03 | Latest Orchestrator validation results | Combined contract/hardening tests: 10 passed; frontend tests: 31 passed; frontend build: passed; server tests: 128 passed; server build: passed; PowerShell parser: OK; `git diff --check`: clean as previously reported. | **Verified as reported; raw logs not archived here** |
| E-04 | Scoped commit/artifact manifest/checksum | No generated fast-deploy artifact or independent checksum attached. | **Unverified** |
| E-05 | No-DB static contract | `scripts/deploy-dev.ps1` enforces development-only inputs and `NO_DB`; contract tests cover database denial and protected paths; runbook states no database flag and no DB rollback. | **Verified static; no operational execution** |
| E-06 | DBRE readiness notification | No acknowledgement attached in the latest handoff. | **Unverified** |
| E-07 | Database Optimizer disposition | This record explicitly postpones it. | **Verified policy decision** |
| E-08 | VPS/SSH/SCP/secret execution audit | No execution evidence provided; status must remain unverified, not PASS. | **Unverified** |
| E-09 | Human approval and window | Conditional bounded approval and 2026-08-11 03:38–21:00 WIB window recorded; target/readiness details and ITSM acceptance are not attached. | **Verified window only; blocking** |
| E-10 | Development fast-deploy implementation contract | `scripts/deploy-dev.ps1`, `server/ecosystem.dev.config.js`, `deploy-bot/tests/test_deploy_dev_contract.py`, and `docs/deploy-dev-runbook.md` are present and reviewed. | **Verified static; not deployment evidence** |
| E-11 | Operational prerequisites | Development VPS, pinned `known_hosts`, operator, target environment/port, and dirty-tree `ChangeTicket` are not supplied. | **Unverified / blocking** |
| E-12 | Staging, rollback, and actual health | No staging execution, rollback result, or actual liveness/readiness result supplied. | **Unverified / blocking** |
| E-22 | User-provided preflight evidence | Non-root SSH login, host fingerprint verification, target writable, port 5000 available, and PM2 available. Recorded only as user evidence; no SSH, deployment, or secret action was performed by ITSM. | **Verified within stated scope; no execution authorization** |

Evidence rule: absence of evidence is **UNVERIFIED**, never PASS. E-04, E-06, E-09, E-11, and E-12 block operational handoff; E-03 is verified as reported but raw logs remain non-archived. E-22 clears only the specific preflight claims supplied by the user; it does not prove operator identity, authorization, provenance, artifact integrity, baseline, rollback readiness, or final acceptance.

## 7. Handoff log

| Time (UTC) | From → To | Deliverable | Acceptance condition | Status |
|---|---|---|---|---|
| 2026-08-11 | ITSM → Orchestrator | Governance constraints and evidence request | Return one scoped evidence bundle; do not deploy or handle secrets. | **Open** |
| 2026-08-11 | ITSM → DBRE | One-time application-only readiness notification | Acknowledge readiness review; no migration/optimizer execution. | **Pending** |
| 2026-08-11 | Orchestrator → ITSM | Latest validation results and development-only contract files | Results reconcile to listed files; operational prerequisites remain outstanding. | **Partially accepted** |
| TBD | Orchestrator → ITSM | Commit/diff, manifest/hash, prerequisite bundle, and operational test evidence | Every operational acceptance criterion evidenced. | **Blocked** |
| TBD | ITSM → User | Minimum non-delegable decisions only | Explicit window/scope/risk decision if external action is later proposed. | Not started |
| TBD | Authorized operator → ITSM | External execution evidence under separate approval | Health, logs, rollback/abort, incident outcome. | Not applicable now |

## 8. Approval matrix

| Decision | Required approver | Current status | Default |
|---|---|---|---|
| Development-only package review | ITSM | Pending evidence | Hold |
| Application-only / no DB mutation | User/business approver; ITSM verifies | **Conditional approval recorded; ITSM verification pending** | Hold |
| DBRE one-time readiness notification | DBRE acknowledges | Pending | Hold |
| Database Optimizer | Separate owner/change approval | Postponed | Do not execute |
| VPS/SSH/SCP/deployment | User + ITSM under separate change | Not requested/approved | **Prohibited** |
| Residual High risk acceptance | User | Conditional; final ITSM readiness acceptance pending | **Hold / NO-GO** |

## 9. Incident and escalation path

- **P1:** Any production outage, data integrity concern, secret exposure, or unauthorized external mutation. Declare immediately; ITSM Incident Commander coordinates, first update within 15 minutes and every 30 minutes. Freeze further changes and preserve evidence.
- **P2:** Material service degradation or failed authorized gate with significant user impact. Escalate to IT Manager within 30 minutes; updates every 60 minutes.
- **Change breach:** Any unapproved VPS/SSH/SCP/deployment/secret action is a change-control breach, not a successful fast deploy. Stop, isolate, notify ITSM and Security, and open incident/problem records.
- **Development-only failure:** Stop the handoff, attach logs, create/link a problem record for recurrence, and return to Orchestrator with the failed acceptance criterion.

## 10. Return to Orchestrator — remaining blocker acceptance criteria

The implementation evidence is accepted for local review, but the operational handoff remains **NO-GO**. Orchestrator must provide, without performing an unauthorized deployment:

1. A commit SHA and exact diff containing only fast-deploy scope, or a written disposition for each unrelated file.
2. Raw build/test output with command, timestamp, exit code, and failure details if any, if audit attachment is required.
3. Generated artifact inventory, manifest, SHA-256, and reproduction command.
4. Evidence that no database migration, schema, seed/data, or optimizer operation is invoked; `--db` must remain unused. **Static criterion is now met; preserve this control.**
5. Development VPS, pinned `known_hosts`, authorized operator, target environment/port, and dirty-tree `ChangeTicket` where applicable.
6. DBRE one-time readiness notification/acknowledgement and explicit postponed-optimizer entry.
7. Staging result, actual health result, and rollback result under an approved operational change; no such execution is authorized by this record.
8. A residual-risk response for R-01 through R-06.

Until all seven are verified, do not request user approval for deployment; the minimum user decision is **none**.

## 11. Valid progress report — 2026-08-11

- **Completed:** Latest Orchestrator handoff is reconciled: combined contract/hardening tests 11 passed, frontend tests 31 passed, frontend build passed, server tests 128 passed, server build passed, PM2 config contract passed, and PowerShell parser OK. The development-only script, PM2 config, contract tests, and runbook are present and statically reviewed. No VPS/deployment was run by ITSM.
- **In progress:** Operational prerequisite reconciliation; DBRE readiness notification pending; artifact provenance and raw audit logs pending.
- **Blocked:** Named operator identity/coverage, current approved-window validity, scoped commit/diff and dirty-tree disposition, generated artifact manifest/hash, raw logs, DBRE acknowledgement, pre-change baseline, rollback package/readiness, staging/health evidence, and final ITSM readiness acceptance. User-provided non-root login, fingerprint, writable target, port 5000, and PM2 preflight evidence are recorded as verified within scope only.
- **Evidence:** E-01, E-02, E-03, E-05, E-07, and E-10 are verified at the stated level. E-04, E-06, E-09, E-11, and E-12 remain unverified. Missing evidence is not PASS.
- **Residual risk:** R-01 remains High due to provenance/dirty-tree ambiguity. R-02 is controlled but raw logs are not archived. R-03 is statically controlled but artifact/execution remains unverified. Operational risks remain open.
- **Next handoff:** Orchestrator → ITSM for exact scoped commit/diff, dirty-tree disposition, artifact manifest/hash, and raw logs; DBRE → ITSM for one-time readiness acknowledgement; named operator/SRE → ITSM for identity/coverage, baseline, and rollback readiness. No deployment handoff yet.
- **Minimum user action:** None for the verified preflight claims. If the recorded window is no longer valid, provide only a new date, start time, end time, and timezone. Do not provide secrets or execute technical work.
- **Decision:** **NO-GO for deployment. Local development evidence is accepted with restrictions; no VPS, SSH, SCP, database, optimizer, or secret action is authorized under this record.**

## 12. Governance addendum — operator model and controlled handoff

**Addendum date:** 2026-08-11  
**Governance decision:** **NO-GO remains active.** This addendum defines the future
execution roles and evidence gates; it is not an execution authorization.

### 12.1 Segregation of duties

| Role | Named responsibility | Execution authority |
|---|---|---|
| User / business approver | Approves or rejects the bounded change, window, target, and residual risk | **None**; never an executor |
| IT Service Manager | Change owner, gatekeeper, incident commander, evidence acceptance, closure/PIR | **None** for VPS/SSH/SCP/deployment |
| DevOps Release Operator | **Primary human operator**; performs an approved development-only run and preserves evidence | Only within approved ticket, target, window, and runbook |
| DevOps backup | Secondary operator; takes over only after explicit handoff or primary unavailability | Same bounded authority; no parallel execution |
| SRE on-call | Availability/readiness observer, monitoring, rollback advice, incident responder | No deploy authority unless separately named in the approval |
| Orchestrator | Implementation, local validation, artifact/evidence preparation | **Non-executor**; cannot self-approve or deploy |
| DBRE | One-time application-only readiness notification | No migration/schema/data/optimizer authority |

### 12.2 RACI for the first development fast deploy

| Activity | User | ITSM | Orchestrator | Primary operator | DevOps backup | SRE on-call | DBRE |
|---|---|---|---|---|---|---|---|
| Scope, non-scope, and risk acceptance | **A** | R | I | I | I | I | I |
| Code/build/test and artifact creation | I | C | **R/A** | I | I | C | I |
| Validate commit, dirty tree, and ChangeTicket | I | **A** | R | C | C | I | I |
| Provision/verify VPS, target env/port, known_hosts fingerprint | I | A | I | **R** | R (backup) | C | I |
| Execute approved application-only deploy | I | A | I | **R** | R (takeover only) | C | I |
| Observe health and service behavior | I | A | I | R | C | **R** | I |
| Rollback/abort decision | I | **A** | C | R | R (takeover only) | C | I |
| DB readiness notification | I | A | C | I | I | C | **R** |
| Incident declaration/coordination | I | **R/A** | C | C | C | R | C |
| Closure, PIR, and CSI follow-up | A | **R/A** | R | C | C | C | C |

No role may be inferred from a title alone: the approval must name the primary
operator, backup, SRE on-call, target, port, window, and exact change ticket.

### 12.3 Approval matrix

| Gate/decision | Required approver or verifier | Current state | Effect |
|---|---|---|---|
| Application-only scope; DB migration/schema/data excluded | User + ITSM verification | Not attached | Hold |
| Database Optimizer disposition | ITSM records postponement | **Postponed** | Do not execute |
| DBRE one-time readiness notification | DBRE acknowledgement | Pending | Hold |
| Exact artifact, manifest, SHA-256, and scoped diff | ITSM evidence acceptance | Missing/incomplete | Hold |
| VPS, target environment/port, and non-production boundary | ITSM + operator evidence | Missing | Hold |
| Pinned known_hosts and independently verified fingerprint | Security/ITSM verification | Missing | Hold |
| Dirty-tree exception | User approval of `ChangeTicket` + ITSM verification | Missing | Hold |
| Execution window | User approval | **Conditional: 2026-08-11 03:38–21:00 WIB; not execution authorization** | Hold |
| Residual risk acceptance | User approval | Conditional; final ITSM readiness acceptance pending | **Hold / NO-GO** |
| Deploy execution | Named primary operator only | Not authorized | Prohibited |
| Backup/rollback readiness | Primary operator + SRE evidence; ITSM acceptance | Missing | Hold |

**Approval rule:** a user approval is necessary but never sufficient by itself.
Passing local tests does not authorize external action. Any missing row keeps
the change **NO-GO**.

### 12.4 Operator readiness checklist (must be evidenced, not asserted)

- [ ] Primary operator is the human `DevOps Release Operator`; identity and contact recorded.
- [ ] Secondary `DevOps backup` and SRE on-call are named with contacts and coverage window.
- [ ] Operator confirms no secrets will be copied, printed, committed, or placed in evidence.
- [ ] Development VPS address, non-production deploy user, absolute target directory, and target environment recorded.
- [ ] Target port is recorded and matches the approved development PM2 environment.
- [ ] `known_hosts` is pinned; fingerprint is verified through a trusted independent channel; only its path/hash is recorded.
- [ ] Working-tree state is captured. If dirty, `ChangeTicket` is valid, approved, and lists every dirty path; otherwise use a clean commit.
- [ ] Exact commit SHA, scoped diff/file disposition, artifact manifest, reproduction command, and SHA-256 are attached.
- [ ] Local tests/build and PowerShell parser output include command, UTC timestamp, exit code, and raw log location.
- [ ] Artifact inspection confirms application-only content and no migration/schema/seed/data operation.
- [ ] Pre-deploy health baseline, maintenance window, communication channel, and stop authority are recorded.
- [ ] Application-only rollback package, prior release identifier, rollback owner, and validation steps are available.
- [ ] Operator, backup, SRE, ITSM, and user have acknowledged the same ticket/version; no silent substitution is allowed.

### 12.5 Single operator action package

The following is the **only package** to be executed by the named operator after
all gates are approved. It is a handoff checklist, not permission to run now:

1. Confirm the ticket is approved, window is open, target is development-only,
   and the named primary operator is present. Stop if any value differs.
2. Validate pinned `known_hosts`/fingerprint, target directory, environment,
   port, release ID, commit SHA, artifact allowlist, and SHA-256. Do not reveal
   credentials or environment contents.
3. Capture pre-change health and release baseline in the evidence bundle.
4. Run the existing development-only runbook/script with the approved ticket;
   do not add database flags or invoke migration/schema/seed/data commands.
5. Capture command metadata, exit code, timestamps, deployment evidence,
   remote release identifier, and post-change health (`status: "ready"`).
6. Stop immediately on any gate, checksum, SSH host-key, health, scope, or
   unexpected-output failure. Do not improvise or broaden scope.
7. If rollback criteria are met, announce `ROLLBACK`, preserve evidence, and
   restore the prior **application-only** release using the approved procedure.
8. Handoff the evidence bundle to ITSM and SRE; do not close the ticket or
   declare success without ITSM validation.

### 12.6 Handoff protocol

| Handoff | Sender → receiver | Required contents | Acceptance |
|---|---|---|---|
| Build package | Orchestrator → ITSM/operator | SHA, scoped diff, artifact manifest/hash, raw validation logs, no-DB review | ITSM accepts exact version |
| Readiness | ITSM → primary/backup/SRE | Approved ticket, window, target/port, roles, rollback and escalation contacts | Operator repeats values verbatim |
| Execution | Primary → SRE/ITSM | Start time, release ID, baseline, live phase, blockers | SRE observes; ITSM coordinates |
| Failover | Primary → backup | Explicit takeover time, current phase, evidence location, stop/rollback state | ITSM records single active executor |
| Closure | Operator/SRE → ITSM | Evidence index, health result, incidents, rollback status, timestamps | ITSM validates and closes/PIRs |

### 12.7 Evidence index for the next handoff

| E-ID | Required evidence | Owner | Status now |
|---|---|---|---|
| E-13 | Named operator/backup/SRE and contact/coverage acknowledgement | ITSM | **Missing — blocker** |
| E-14 | VPS address, target env/port, target directory (no secrets) | Operator | **Missing — blocker** |
| E-15 | Pinned known_hosts path/hash and independently verified fingerprint | Operator/Security | **Missing — blocker** |
| E-16 | Valid dirty-tree `ChangeTicket` or clean commit boundary | Orchestrator/ITSM | **Missing — blocker** |
| E-17 | Exact scoped diff, file disposition, artifact manifest, SHA-256 | Orchestrator | **Missing — blocker** |
| E-18 | DBRE one-time readiness acknowledgement; optimizer postponed | DBRE/ITSM | **Pending — blocker** |
| E-19 | Approved user decision with window, target, operator, and risk | User/ITSM | **Missing — blocker** |
| E-20 | Pre/post health, deployment evidence, and raw execution log | Operator/SRE | **Not applicable until approved run** |
| E-21 | Rollback decision/result or explicit not-triggered record | Operator/SRE/ITSM | **Not applicable until approved run** |

### 12.8 Rollback and abort criteria

**Abort before execution** for missing/changed host fingerprint, unknown target,
wrong environment or port, missing approval, dirty tree without valid ticket,
artifact hash mismatch, missing operator/backup/SRE, database command/flag,
secret exposure, or any scope drift.

**Rollback after execution** if readiness is not `status: "ready"`, health fails
or materially regresses from baseline, checksum/release verification fails,
the service cannot start, error rate or critical business flow degrades, an
unauthorized change is detected, or ITSM/SRE/user stop authority orders it.
Rollback is application-only. Any data inconsistency or database request is a
P1 concern and requires a separate approved database change; do not improvise
a database rollback.

### 12.9 Incident escalation

- **P1 / change breach:** unauthorized SSH/SCP/deploy, secret exposure, outage,
  data-integrity concern, or failed rollback. Stop changes, preserve logs,
  notify ITSM Incident Commander and Security immediately; first update within
  15 minutes, then every 30 minutes. Open linked problem record.
- **P2:** significant development service degradation or failed approved gate.
  ITSM Manager escalation within 30 minutes; update every 60 minutes.
- **P3:** contained defect with workaround. Record incident, link the change,
  and return to Orchestrator for correction/problem analysis.

The primary operator does not communicate speculative root cause. ITSM owns the
status cadence; SRE owns technical signal and evidence; the backup takes over
only through an explicit recorded handoff.

### 12.10 Valid governance report — 2026-08-11

- **Decision:** **NO-GO.** No VPS/SSH/SCP/deployment, secret access, database
  mutation, or implementation-code change was performed by ITSM.
- **Orchestrator review:** local evidence reported as 4 contract tests, 31 root
  tests, root build, 128 server tests, server build, PowerShell parser OK, and
  clean `git diff --check`. This is useful development evidence, but raw logs,
  exact provenance, artifact hash, and execution evidence are not attached.
- **Accepted controls:** application-only/no-DB contract; Database Optimizer
  postponed; DBRE restricted to one-time readiness notification.
- **Blocking gaps:** VPS/target and pinned
  known_hosts/fingerprint evidence, exact artifact/provenance, DBRE
  acknowledgement, raw readiness evidence, and staging/health/rollback
  evidence. The operator roles are already determined.
- **Control conclusion:** the Orchestrator report is **partially credible and
  not an operational go signal**. Reported test counts are verified only as
  reported; absence of raw evidence is not PASS.
- **Next owner:** primary `DevOps Release Operator` prepares the remaining
  readiness evidence through the single action package; ITSM validates. The
  user is not asked for another decision while this window remains scheduled;
  the window is not deployment authorization. If it expires before all gates
  pass, request a new date, start time, end time, and timezone only.

### 12.11 Minimal user approval format (use only after NO-GO blockers clear)

```text
APPROVED / REJECTED: CHG-20260811-DEV-FAST-DEPLOY
Scope: development-only application fast deploy; DB migration/schema/data = OUT OF SCOPE
Database Optimizer: POSTPONED; DBRE: one-time readiness notification only
Target environment / host / port: [exact non-secret values]
Window (UTC): [start]–[end]
Primary operator: DevOps Release Operator
Secondary: DevOps backup | SRE on-call: [names/contacts]
ChangeTicket for dirty tree: [ID or N/A; attached evidence]
Rollback/stop authority acknowledged: ITSM + SRE
Residual risk acceptance: [ACCEPT / REJECT], based on attached E-13–E-21
Approver: [user name, role]
Decision time (UTC): [timestamp]
Signature/audit reference: [ticket/comment/reference]
```

This approval makes the user an **approver only**, never an executor. It does
not authorize database work, optimizer work, secret handling, or any target
outside the explicitly recorded development environment.

## 13. Conditional user approval recorded — 2026-08-11

The user has recorded **conditional approval** for `CHG-20260811-DEV-FAST-DEPLOY`
with the following bounded decisions:

- **Target:** development VPS only.
- **Scope:** application-only.
- **Database:** migration, schema, seed, and data changes are prohibited; no
  database command or flag may be added. Database Optimizer remains postponed.
- **Primary operator:** `DevOps Release Operator`.
- **Backup:** `DevOps backup`.
- **Operational observer/incident responder:** `SRE on-call`.
- **Execution condition:** proceed only after ITSM completes and accepts the
  readiness evidence. The user is an approver only, never an executor.

This is **not deployment authorization** and does not authorize VPS, SSH, SCP,
secret handling, or any external action now. Only local build/test/package
readiness and documentation may continue.

### Conditional approval blockers (must be completed by ITSM/operator)

- [ ] ITSM records the exact development VPS, non-production user, target
  directory, environment, and port.
- [ ] Pinned `known_hosts` path/hash and independently verified fingerprint are
  recorded through a trusted channel.
- [ ] Named primary, backup, and SRE contacts and coverage are recorded.
- [ ] Exact scoped commit/diff, dirty-tree disposition, artifact manifest, and
  SHA-256 are attached and accepted.
- [ ] DBRE one-time application-only readiness acknowledgement is attached;
  Optimizer postponement remains recorded.
- [x] **Conditional maintenance window recorded: 2026-08-11 03:38–21:00 WIB (UTC+7)**; this is not automatic deployment authorization.
- [ ] ITSM completes readiness acceptance and records the final go/no-go gate.

Until every applicable blocker is evidenced and ITSM accepts readiness, the
change status remains **BLOCKED / NO-GO**. No deployment will be run.

### Minimum user decision if the window expires

If the window expires before all evidence is PASS, request only a new
**date, start time, end time, and timezone**. Conditional approval is recorded,
not GO. Do not send credentials or secrets through chat.

## 14. Official phase tracker — phases 1–13

This is the controlled phase tracker for `CHG-20260811-DEV-FAST-DEPLOY`. A phase
may advance only when its acceptance criteria and evidence are accepted by the
named reviewer. Status values are intentionally separated into **VERIFIED**,
**UNVERIFIED**, and **BLOCKED**; an absent artifact is never treated as PASS.

| Phase | Accountable | Responsible | Reviewer | Status | Evidence | Blocker | Handoff | SLA | Acceptance criteria |
|---:|---|---|---|---|---|---|---|---|---|
| 1. Intake and change ID | ITSM | ITSM | ITSM | **VERIFIED** | Change ID, scope, review date, §1 | None | ITSM → Orchestrator | Same business day | Change ID exists; development-only objective and boundaries are recorded. |
| 2. Scope and non-scope lock | User (approval only) | ITSM | Security / DBRE | **VERIFIED** | §1, E-02, E-05, E-07 | None for local review | ITSM → delivery roles | Before any handoff | Application-only scope is explicit; DB migration/schema/seed/data, optimizer, secrets, and external execution are excluded. |
| 3. Security boundary, target isolation, and segregation | ITSM | Orchestrator + Security/DevOps | ITSM / Security | **VERIFIED (reported/static)** | Orchestrator patch review: exact `/var/www/zen-dev` target guard, protected target denial, behavioral coverage | Operational target and host evidence absent; no external execution permitted | Orchestrator → ITSM/Security | Before package acceptance | All target inputs are development-isolated; production/other-target values fail closed; negative and behavioral tests prove the boundary. |
| 4. Risk and control assessment | ITSM | ITSM / Security / DBRE | ITSM / Security / DBRE | **VERIFIED (reported/static)** | Patch review: rollback fail-closed/partial recovery, schema baseline, protected connection paths | Actual rollback/partial recovery and operational DB evidence absent | Orchestrator → ITSM/Security/DBRE | Before go/no-go | Target isolation, safe rollback/partial recovery, schema baseline, connection guards, and behavioral tests are evidenced locally; operational proof remains separate. |
| 5. Provenance and working-tree boundary | ITSM | Orchestrator | ITSM | **UNVERIFIED** | E-01, E-03, E-04, E-16/E-17 | Scoped commit/diff and dirty-tree disposition absent | Orchestrator → ITSM | Before package acceptance | Exact SHA, scoped diff, file disposition, and valid ChangeTicket or clean tree are attached. |
| 6. Local build, test, parser, and behavioral validation | ITSM | Orchestrator | Security / DBRE / ITSM | **VERIFIED (reported/static)** | Orchestrator report: 16 deploy contract/hardening tests; parser; PM2 syntax; frontend/server tests/builds; diff check; behavioral tests | Raw logs/timestamps and independently archived bundle absent; operational execution remains absent | Orchestrator → ITSM/Security/DBRE | Before package acceptance | Reported checks pass; behavioral tests cover denial, target crossover, partial recovery, rollback failure, schema/connection violations, and safe abort. |
| 7. Artifact allowlist, checksum, and promotion safety | ITSM | Orchestrator | ITSM / Security | **VERIFIED (reported/static)** | Patch review: exact `/var/www/zen-dev`, allowlist/checksum path, partial recovery and fail-closed promotion controls | Operational artifact manifest/hash and actual promotion evidence absent | Orchestrator → ITSM / Security | Before readiness gate | Artifact is application-only; manifest/SHA-256 reproduce; promotion is isolated; mismatch or partial promotion stops safely. |
| 8. DB boundary, schema guard, and connection guard | ITSM | Orchestrator + DBRE | DBRE / Security / ITSM | **VERIFIED (reported/static)** | Patch review: schema baseline, protected connection paths, no-DB boundary, behavioral tests | DBRE acknowledgement and operational DB evidence absent; no schema/connection action authorized | Orchestrator → DBRE/Security → ITSM | Before go/no-go | Migration/schema/seed/data and optimizer paths are denied; connection targets are constrained; guard failures fail closed; local negative/behavioral evidence is reviewed. |
| 9. Operational prerequisites, target isolation, and host trust | ITSM | Primary operator + Security | Security / ITSM | **BLOCKED** | E-11, E-13–E-15, E-22 | User evidence verifies non-root login, fingerprint, writable target, port 5000, and PM2 availability within scope; operator identity/coverage and complete target record remain absent | Operator/Security → ITSM / SRE | Before any external action | Only approved development target can be addressed; wrong/cross-target/prod values abort before action. |
| 10. Human approval and final readiness gate | User (approval only) | ITSM | ITSM | **BLOCKED** | E-09, E-10, E-19 | Conditional approval lacks complete target/readiness details; ITSM acceptance absent | ITSM → User only for bounded decision | Before execution window | User explicitly approves/rejects only bounded scope/window/target/operator/residual risk; ITSM separately records GO/NO-GO. |
| 11. Authorized staging / fast-deploy execution | User (approval only) | Named primary operator + SRE | ITSM / Security | **BLOCKED** | E-20 | Target isolation, schema/connection guards, and partial-promotion controls are not verified; execution unauthorized | Primary operator → SRE / ITSM | Approved window, only after Phase 10 GO | Exact artifact, isolated development target, guard evidence, pre-health, phase logs, and application-only runbook are present. |
| 12. Post-change health and rollback validation | ITSM | Primary operator / SRE | ITSM / Security / DBRE | **BLOCKED** | E-20/E-21 | No staging evidence; fail-closed rollback/partial promotion, schema/connection safety, and behavioral health evidence absent | Operator/SRE → ITSM | Immediately after Phase 11 | Health, release/SHA, target identity, DB boundary, and rollback state are verified; rollback failure escalates. |
| 13. Closure, PIR, and CSI follow-up | ITSM | ITSM | ITSM | **BLOCKED** | E-21, §9, §12.10 | Prior phases incomplete; closure evidence and PIR not started | ITSM → User for closure acknowledgement only | Within 1 business day after validation | ITSM validates evidence, closes or raises incident/problem, records PIR/CSI actions, and archives the complete bundle. |

### 14.1 Status register

**VERIFIED**

- Phases 1–4: change identity, application-only boundary, security target
  isolation, rollback/partial-recovery controls, and risk controls are verified
  at reported/static level.
- Phases 6–8: Orchestrator patch evidence is verified as reported/static,
  including 16 deploy contract/hardening tests, parser, PM2 syntax,
  frontend/server tests/builds, diff check, schema baseline, protected
  connection paths, and behavioral tests.

**UNVERIFIED**

- Phase 5: exact provenance and dirty-tree disposition.

**BLOCKED**

- Phase 9: operational target isolation, VPS/port, known_hosts, operator
  coverage, and host trust.
- Phases 10–12: operational artifact evidence, staging, actual health/rollback,
  and approval gates.
- Phases 10–13: final approval, execution, post-change validation, and
  closure/PIR/CSI are not permitted or startable while preceding gates are
  incomplete.

### 14.2 Tracker control decision

**Final change status: BLOCKED / NO-GO.** Local implementation evidence is
accepted only for review. No VPS, SSH, SCP, deployment, secret access, database
mutation, or implementation-code change was performed by ITSM. The User remains a
non-delegable approver only; no user approval, window, or local test result can
override a blocked phase or authorize execution.
