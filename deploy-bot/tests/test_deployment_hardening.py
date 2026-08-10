from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_all_deployment_ssh_paths_are_fail_closed():
    files = [
        ROOT / "scripts" / "deploy.ps1",
        ROOT / "scripts" / "setup-ssh.ps1",
        ROOT / "deploy-bot" / "bot.py",
        ROOT / "deploy-bot" / "config.py",
    ]
    unsafe_policy = "StrictHostKeyChecking=" + "accept-new"
    for path in files:
        source = path.read_text(encoding="utf-8")
        assert unsafe_policy not in source, path
    assert "StrictHostKeyChecking=yes" in (ROOT / "scripts" / "deploy.ps1").read_text()
    assert "UserKnownHostsFile" in (ROOT / "scripts" / "setup-ssh.ps1").read_text()


def test_powershell_artifact_provenance_is_generated_and_verified():
    source = (ROOT / "scripts" / "deploy.ps1").read_text(encoding="utf-8")

    # Local package provenance includes the ecosystem contract and SHA-256.
    assert "server/ecosystem.config.js" in source
    assert "Get-FileHash" in source
    assert "manifest.sha256" in source
    assert "release-$releaseId.zip" in source

    # Remote validation must happen before promotion, not only be logged.
    assert "sha256sum -c manifest.sha256" in source
    assert "MANIFEST_RELEASE_MISMATCH" in source
    assert "STAGE=\"__TARGET__/.deploy/staging/__RELEASE__\"" in source
    assert source.index("sha256sum -c manifest.sha256") < source.index(
        "# Promote only after extraction"
    )


def test_remote_lock_is_acquired_before_scp():
    source = (ROOT / "scripts" / "deploy.ps1").read_text(encoding="utf-8")
    assert source.index("$lockAcquire =") < source.index("& scp $SshOpts")
    assert "REMOTE_LOCKED" in source


def test_failure_paths_are_fail_closed_and_cleanup_is_not_recursive():
    source = (ROOT / "scripts" / "deploy.ps1").read_text(encoding="utf-8")
    release_fn = source[source.index("function Release-RemoteLock"):source.index("Log \"========================================\"")]
    assert "Release-RemoteLock" not in release_fn.split("function Release-RemoteLock", 1)[1]
    assert "remoteLockAcquired = $false" in release_fn
    assert "Working tree dirty" in source
    assert "AllowDirty" in source and "ChangeTicket" in source


def test_release_metadata_and_readiness_are_covered_by_rollback():
    source = (ROOT / "scripts" / "deploy.ps1").read_text(encoding="utf-8")
    assert "metadata.prev" in source
    assert "server/ecosystem.config.js" in source
    assert "restore_release_metadata" in source
    assert source.count('"status"[[:space:]]*:[[:space:]]*"ready"') >= 2
    assert "ROLLBACK_METADATA_UNAVAILABLE" in source
    assert source.index('META_BACKUP="__TARGET__/.deploy/metadata.prev"') < source.index(
        "# Promote only after extraction"
    )
    assert "Fail([string]$msg" in source and "Release-RemoteLock" in source


def test_manifest_covers_all_files_and_archive_has_sidecar_hash():
    source = (ROOT / "scripts" / "deploy.ps1").read_text(encoding="utf-8")
    assert "Get-ChildItem -LiteralPath $tempDir -File -Recurse" in source
    assert "Sort-Object FullName" in source
    assert "$archiveHash = (Get-FileHash -LiteralPath \"release.zip\"" in source
    assert 'Set-Content -Path "$artifactName.sha256"' in source
    assert "sha256sum -c \"$RELEASE_NAME.sha256\"" in source
