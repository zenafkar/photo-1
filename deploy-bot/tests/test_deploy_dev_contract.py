from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = (ROOT / "scripts" / "deploy-dev.ps1").read_text(encoding="utf-8")


def test_dev_target_and_database_are_fail_closed():
    assert "ValidateSet('development')" in SCRIPT
    assert "noDb = $true" in SCRIPT
    assert "migrations?/" in SCRIPT
    assert "ChangeTicket" in SCRIPT
    assert "database" in SCRIPT


def test_upload_requires_remote_lock_and_checksum_before_promotion():
    assert SCRIPT.index("$lock =") < SCRIPT.index("& scp")
    assert "sha256sum -c manifest.sha256" in SCRIPT
    assert SCRIPT.index("sha256sum -c manifest.sha256") < SCRIPT.rindex("pm2 startOrRestart")
    assert "staging/$RELEASE" in SCRIPT


def test_artifact_exclusions_and_evidence_are_explicit():
    for excluded in (".env", ".git", ".opencode", "uploads", "cache"):
        assert excluded in SCRIPT
    assert "dirtyPaths" in SCRIPT
    assert "archiveSha256" in SCRIPT
    assert "liveness" in SCRIPT and "readiness" in SCRIPT
    assert "artifactAllowlist" in SCRIPT
    assert 'http://localhost:${ZEN_DEV_PORT}' in SCRIPT
    assert 'http://localhost:5000/api/v1/health' not in SCRIPT


def test_pm2_contract_is_packaged_at_the_path_used_for_promotion():
    assert 'Copy-Item \'server/ecosystem.dev.config.js\' "$stage/server/ecosystem.dev.config.js"' in SCRIPT
    assert 'cp "$STAGE/server/ecosystem.dev.config.js" server/ecosystem.dev.config.js' in SCRIPT


def test_production_contract_is_not_referenced_as_execution_path():
    assert "deploy.ps1" not in SCRIPT
    assert "ecosystem.config.js" not in SCRIPT


def test_development_target_is_explicitly_allowlisted():
    assert "allowedDevelopmentTargets" in SCRIPT
    assert "'/var/www/zen-dev'" in SCRIPT
    assert "TargetDir tidak ada dalam development allowlist" in SCRIPT


def test_protected_database_dependency_paths_are_fail_closed():
    for protected in ("schema\\.prisma", "datasource", "connection", "pool", "driver", "timeout", "read.?write", "routing"):
        assert protected in SCRIPT
    assert "protectedDirty" in SCRIPT


def test_schema_is_verified_against_remote_baseline_before_promotion():
    assert 'sha256sum "$ROOT/server/prisma/schema.prisma"' in SCRIPT
    assert 'sha256sum "$STAGE/server/prisma/schema.prisma"' in SCRIPT
    assert SCRIPT.index('sha256sum "$ROOT/server/prisma/schema.prisma"') < SCRIPT.index("PROMOTION_STARTED=1")


def test_promotion_has_recovery_state_and_rollback_health_gate():
    assert "PROMOTION_STARTED=1" in SCRIPT
    assert "ROLLBACK_FAILED" in SCRIPT
    assert "pm2 startOrRestart server/ecosystem.dev.config.js --update-env\n  pm2 save\n  wait_health" in SCRIPT
    assert "pm2 startOrRestart server/ecosystem.dev.config.js --update-env || true" not in SCRIPT


def test_lock_and_archive_checks_are_behaviorally_gated():
    assert "mkdir '$script:RemoteLock'" in SCRIPT
    assert "sha256sum -c \"$RELEASE.zip.sha256\"" in SCRIPT
    assert "sha256sum -c manifest.sha256" in SCRIPT
    assert SCRIPT.index("sha256sum -c manifest.sha256") < SCRIPT.index("PROMOTION_STARTED=1")
