# Official phase tracker — CHG-20260811-DEV-FAST-DEPLOY

**Review:** 2026-08-11  
**Scope:** development-only application fast deploy; no database, VPS, SSH,
SCP, deployment, or secret handling.  
**Final change status:** **BLOCKED / NO-GO** — local validation is reviewable;
operational readiness and ITSM acceptance are incomplete.

This is the controlled tracker for phases 1–13. A phase advances only after its
acceptance criteria are evidenced and accepted by the reviewer. `VERIFIED` means
evidence is present and reviewed at the stated level. `UNVERIFIED` means evidence
is missing, asserted only, or not independently reproducible. `BLOCKED` means the
phase cannot start or advance under the current authorization.

**Non-delegable user rule:** the User / business approver is an approver only.
The user may approve or reject the bounded scope, window, target, and residual
risk when explicitly requested; the user is never an executor, reviewer,
evidence owner, or delegated implementer.

## Phase tracker (1–13)

| Phase | Accountable | Responsible | Reviewer | Status | Evidence | Blocker | Handoff | SLA | Acceptance criteria |
|---:|---|---|---|---|---|---|---|---|---|
| 1. Intake and change ID | ITSM | ITSM | ITSM | **VERIFIED** | Change ID, scope, review date | None | ITSM → Orchestrator | Same business day | Change ID exists; objective and development-only boundary are recorded. |
| 2. Scope and non-scope lock | User (approval only) | ITSM | Security / DBRE | **VERIFIED** | CHG §1; E-02, E-05, E-07 | None for local review | ITSM → delivery roles | Before handoff | Application-only scope is explicit; DB migration/schema/seed/data, optimizer, secrets, and external execution are excluded. |
| 3. Security boundary, target isolation, and segregation | ITSM | Orchestrator + Security/DevOps | ITSM / Security | **VERIFIED (reported/static)** | Orchestrator patch review: exact `/var/www/zen-dev` target guard, protected target denial, behavioral coverage | Operational target and host evidence absent; no external execution permitted | Orchestrator → ITSM/Security: patch evidence accepted for local review | Before package acceptance | All target inputs are development-isolated; production/other-target values fail closed; negative and behavioral tests prove the boundary. |
| 4. Risk and control assessment | ITSM | ITSM / Security / DBRE | ITSM / Security / DBRE | **VERIFIED (reported/static)** | Orchestrator patch review: rollback fail-closed and partial-recovery controls, schema baseline, protected connection paths | Actual rollback/partial recovery and operational DB evidence absent | Orchestrator → ITSM/Security/DBRE: local control evidence | Before go/no-go | Target isolation, safe rollback/partial recovery, schema baseline, connection guards, and behavioral tests are evidenced at local/static level; operational proof remains separate. |
| 5. Provenance and working-tree boundary | ITSM | Orchestrator | ITSM | **UNVERIFIED** | E-01, E-03, E-04, E-16/E-17 | Scoped commit/diff and dirty-tree disposition absent | Orchestrator → ITSM | Before package acceptance | Exact SHA, scoped diff, file disposition, and valid ChangeTicket or clean tree are attached. |
| 6. Local build, test, parser, and behavioral validation | ITSM | Orchestrator | Security / DBRE / ITSM | **VERIFIED (reported/static)** | Orchestrator report: 16 deploy contract/hardening tests; PowerShell parser; PM2 syntax; frontend/server tests and builds; `git diff --check`; behavioral tests | Raw logs/timestamps and independently archived bundle are not attached; operational execution remains absent | Orchestrator → ITSM/Security/DBRE: report and local evidence | Before package acceptance | Reported checks pass; behavioral tests cover success, denial, target crossover, partial recovery, rollback failure, schema/connection violations, and safe abort. |
| 7. Artifact allowlist, checksum, and promotion safety | ITSM | Orchestrator | ITSM / Security | **VERIFIED (reported/static)** | Patch review: exact target `/var/www/zen-dev`, allowlist/checksum path, partial recovery and fail-closed promotion controls | Operational artifact manifest/hash and actual promotion evidence absent | Orchestrator → ITSM / Security: local control evidence | Before readiness gate | Artifact is application-only; manifest/SHA-256 reproduce; promotion is isolated; mismatch or partial promotion stops safely. |
| 8. DB boundary, schema guard, and connection guard | ITSM | Orchestrator + DBRE | DBRE / Security / ITSM | **VERIFIED (reported/static)** | Patch review: schema baseline, protected connection paths, no-DB boundary, behavioral tests | DBRE acknowledgement and operational DB evidence absent; no schema/connection action authorized | Orchestrator → DBRE/Security → ITSM | Before go/no-go | Migration/schema/seed/data and optimizer paths are denied; connection targets are constrained; guard failures fail closed; local negative/behavioral evidence is reviewed. |
| 9. Operational prerequisites, target isolation, and host trust | ITSM | Primary operator + Security | Security / ITSM | **BLOCKED** | E-11, E-13–E-15, E-22 | User evidence verifies non-root login, fingerprint, writable target, port 5000, and PM2 availability within scope; operator identity/coverage and complete target record remain absent | Operator/Security → ITSM / SRE | Before external action | Only the approved development target can be addressed; wrong/cross-target/prod values abort before action; host trust and coverage are recorded without secrets. |
| 10. Human approval and final readiness gate | User (approval only) | ITSM | ITSM | **BLOCKED** | E-09, E-10, E-19 | Conditional approval lacks complete readiness details; ITSM acceptance absent | ITSM → User only for bounded decision | Before execution window | User approves/rejects only bounded scope/window/target/operator/residual risk; ITSM separately records GO/NO-GO. |
| 11. Authorized staging / fast-deploy execution | User (approval only) | Named primary operator + SRE | ITSM / Security | **BLOCKED** | E-20 | No execution authorized; target isolation, schema/connection guards, and partial-promotion controls are not verified | Orchestrator/ITSM → named operator only after GO | Approved window, after Phase 10 GO | Approved ticket, exact artifact, isolated development target, guard evidence, pre-health, phase logs, and application-only runbook are present; any guard failure stops before external action. |
| 12. Post-change health and rollback validation | ITSM | Primary operator / SRE | ITSM / Security / DBRE | **BLOCKED** | E-20/E-21 | No staging evidence; rollback fail-closed/partial-promotion behavior, schema/connection safety, and behavioral health evidence are absent | Operator/SRE → ITSM; ITSM → Problem/PIR if failed | Immediately after Phase 11 | Health, release/SHA, target identity, DB boundary, and rollback state are verified; partial promotion cannot be reported successful; rollback failure escalates and preserves evidence. |
| 13. Closure, PIR, and CSI follow-up | ITSM | ITSM | ITSM | **BLOCKED** | E-21; CHG §9, §12.10 | Prior phases incomplete; closure/PIR not started | ITSM → User for approval acknowledgement only | Within 1 business day after validation | ITSM validates evidence, closes or raises incident/problem, records PIR/CSI actions, and archives the complete bundle. |

## Status register

### VERIFIED

- Phases 1–4: change identity, application-only boundary, security target
  isolation, rollback/partial-recovery controls, and risk controls are verified
  at reported/static level.
- Phases 6–8: Orchestrator patch evidence is verified as reported/static,
  including 16 deploy contract/hardening tests, parser, PM2 syntax,
  frontend/server tests/builds, diff check, schema baseline, protected
  connection paths, and behavioral tests.

### UNVERIFIED

- Phase 5: exact provenance and dirty-tree disposition.

### BLOCKED

- Phase 5: exact provenance and working-tree disposition.
- Phase 9: named operator identity/coverage and complete target record remain
  open. User-provided non-root login, fingerprint verification, writable target,
  port 5000, and PM2 availability are verified within scope only; no execution
  occurred.
- Phases 10–12: operational artifact evidence, staging, actual health/rollback,
  and approval gates.
- Phases 10–13: final approval, execution, post-change validation, and
  closure/PIR/CSI cannot start while preceding gates are incomplete.

## Action list — no user decision required

1. **Orchestrator:** provide the clean scoped commit/diff, dirty-tree disposition,
   raw local test output, artifact manifest, SHA-256, and reproduction
   instructions. Do not deploy, access secrets, or broaden scope.
2. **Security/DevOps:** retain local acceptance of target isolation, promotion
   boundaries, rollback failure handling, and cross-target denial; no external
   verification is authorized under this record.
3. **DBRE:** review the reported schema baseline and protected connection paths,
   then provide the one-time application-only acknowledgement; no migration,
   optimizer, or data action is allowed.
4. **ITSM:** reconcile operational evidence to phases 9–12 and retain **NO-GO**
   until operator identity, approved-window validity, artifact, raw logs, DBRE
   acknowledgement, baseline, rollback, staging, and final acceptance are
   verified. The supplied preflight evidence does not authorize execution.
5. **SRE:** review health/rollback acceptance criteria and define evidence
   expectations; no VPS/SSH/SCP/deployment action is assigned now.

## Minimum user decision

**None at this stage.** The user is not asked to approve implementation patches,
tests, evidence, or operational preflight. If all blockers later clear and a
separate execution change is proposed, the only required user decision is a
non-delegable approval/rejection of the explicitly recorded development target,
scope, UTC window, named operator, and residual risk. That decision still does
not replace ITSM readiness acceptance or authorize database/secret activity.

## Control decision

No VPS, SSH, SCP, deployment, secret access, database mutation, or
implementation-code change was performed by ITSM. Orchestrator patch work is
pending and must remain local-only. No user approval, maintenance window, or
local test result overrides a blocked phase or authorizes execution.
