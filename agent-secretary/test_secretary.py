import os
import tempfile
import unittest

# Import fungsi yang diuji. Pastikan WATCH_DIRECTORY diarahkan ke folder test.
import secretary_agent as sa


def setUpModule():
    sa.WATCH_DIRECTORY = os.path.realpath(tempfile.mkdtemp(prefix="sec_test_"))


class PathValidationTests(unittest.TestCase):
    def test_accepts_normal_relative_path(self):
        self.assertTrue(sa.is_safe_target("src/app.ts"))

    def test_rejects_unix_traversal(self):
        self.assertFalse(sa.is_safe_target("../src/app.ts"))

    def test_rejects_windows_traversal(self):
        self.assertFalse(sa.is_safe_target("..\\src\\app.ts"))

    def test_rejects_deep_traversal(self):
        self.assertFalse(sa.is_safe_target("a/../../etc/passwd"))

    def test_rejects_absolute_path(self):
        self.assertFalse(sa.is_safe_target("/etc/passwd"))
        self.assertFalse(sa.is_safe_target("C:\\Windows\\system32\\cmd.exe"))

    def test_rejects_empty(self):
        self.assertFalse(sa.is_safe_target(""))

    def test_rejects_null_byte(self):
        self.assertFalse(sa.is_safe_target("src/app.ts\x00x"))


class IgnoreListTests(unittest.TestCase):
    def test_env_is_ignored(self):
        self.assertTrue(sa.is_sensitive_path(".env"))
        self.assertTrue(sa.is_sensitive_path(".env.local"))
        self.assertTrue(sa.is_sensitive_path("config/.env.production"))

    def test_key_material_is_ignored(self):
        self.assertTrue(sa.is_sensitive_path("keys/server.pem"))
        self.assertTrue(sa.is_sensitive_path("certs/private.key"))

    def test_test_files_are_ignored(self):
        # test-clerk.js / test-ui.js menunjuk ke produksi → di-skip via IGNORE_LIST
        from secretary_agent import UltimateSecretaryHandler
        handler = UltimateSecretaryHandler()
        self.assertTrue(handler.is_ignored("test-clerk.js"))
        self.assertTrue(handler.is_ignored("test-ui.js"))
        self.assertTrue(handler.is_ignored("scripts/test-ui.js"))

    def test_tsbuildinfo_is_ignored(self):
        self.assertTrue(sa.is_sensitive_path("tsconfig.tsbuildinfo"))

    def test_normal_source_not_ignored(self):
        self.assertFalse(sa.is_sensitive_path("src/app.ts"))
        self.assertFalse(sa.is_sensitive_path("server/src/routes/telemetry.ts"))

    def test_ignore_list_honors_glob_entries(self):
        # "*.pem" di IGNORE_LIST harus menyingkirkan file .pem di subfolder
        from secretary_agent import UltimateSecretaryHandler
        handler = UltimateSecretaryHandler()
        self.assertTrue(handler.is_ignored("keys/server.pem"))
        self.assertTrue(handler.is_ignored("config/tsconfig.tsbuildinfo"))


class AuthTests(unittest.TestCase):
    def setUp(self):
        self._old_token = sa.AUTH_TOKEN
        sa.AUTH_TOKEN = "correct-horse-battery-staple"

    def tearDown(self):
        sa.AUTH_TOKEN = self._old_token

    def test_missing_token_fails_closed_when_unset(self):
        sa.AUTH_TOKEN = ""
        self.assertFalse(sa.is_authenticated("anything"))

    def test_wrong_token_rejected(self):
        self.assertFalse(sa.is_authenticated("wrong-token"))

    def test_correct_token_accepted(self):
        self.assertTrue(sa.is_authenticated("correct-horse-battery-staple"))

    def test_empty_token_rejected(self):
        self.assertFalse(sa.is_authenticated(""))


class SanitizeBackupNameTests(unittest.TestCase):
    def test_removes_all_path_separators(self):
        # Traversal sudah diblokir is_safe_target; sanitizer menjamin nama backup
        # TIDAK mengandung pemisah path, sehingga aman dipakai sebagai filename.
        for bad in ("../../src/app.ts", "..\\..\\src\\app.ts"):
            self.assertNotIn("/", sa.sanitize_target_for_backup(bad))
            self.assertNotIn("\\", sa.sanitize_target_for_backup(bad))
        self.assertEqual("src_app.ts", sa.sanitize_target_for_backup("src/app.ts"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
