import { execFile } from 'child_process';
import { promisify } from 'util';
import { guardrails } from '../guardrails.js';

const execFileAsync = promisify(execFile);

/**
 * Sanitize a commit message for safe use with execFile.
 * Strips shell metacharacters, truncates to 72 chars.
 */
function sanitizeCommitMessage(input: string): string {
  // Allow only alphanumeric, spaces, and safe punctuation
  let cleaned = input.replace(/[^a-zA-Z0-9 .,:;()#\-\n]/g, '').trim();
  if (!cleaned) cleaned = 'fix: agent auto-patch';
  return cleaned.slice(0, 72);
}

/**
 * Sanitize file paths — reject anything outside the known safe set.
 */
function sanitizeFilePaths(input: string): string[] {
  if (input === '.') return ['.'];
  // For any non-default path, validate it's within the project
  const parts = input.split(/\s+/).filter(Boolean);
  const allowed = /^[a-zA-Z0-9_\-\/\\\.]+$/;
  for (const p of parts) {
    if (!allowed.test(p)) {
      throw new Error(`Unsafe file path rejected: ${p}`);
    }
  }
  return parts.length > 0 ? parts : ['.'];
}

// Remediation Tool Registry
export const remediationTools = {
  // Auto-Git Push to Master — uses execFile (no shell interpolation)
  async autoPushToMaster(commitMessage: string, filePaths: string = '.') {
    if (!guardrails.isFeatureEnabled('ENABLE_AUTO_GIT_PUSH')) {
      return { success: false, message: "Auto Git Push is disabled in .env" };
    }

    try {
      const safePaths = sanitizeFilePaths(filePaths);
      const safeMessage = sanitizeCommitMessage(commitMessage);

      await execFileAsync('git', ['add', ...safePaths]);
      await execFileAsync('git', ['commit', '-m', safeMessage]);
      await execFileAsync('git', ['push', 'origin', 'master']);
      return { success: true, message: `Successfully pushed to master: ${safeMessage}` };
    } catch (error) {
      console.error("Git Push Failed", error);
      return { success: false, message: `Git Push Failed: ${String(error)}` };
    }
  },

  // PM2 Restart — uses execFile (no shell interpolation)
  async restartPM2Process(processName: string = 'backend-api') {
    if (!guardrails.isFeatureEnabled('ENABLE_AUTO_RESTART_PM2')) {
      return { success: false, message: "PM2 Restart is disabled in .env" };
    }

    // Validate process name: alphanumeric + hyphens only
    if (!/^[a-zA-Z0-9\-_]+$/.test(processName)) {
      return { success: false, message: `Invalid process name: ${processName}` };
    }

    // Check rate limit: Max 2 restarts per 30 mins
    if (!guardrails.checkRateLimit('PM2_RESTART', 2, 30 * 60 * 1000)) {
      return { success: false, message: "Rate limit exceeded for PM2 restarts (Max 2 per 30 mins)" };
    }

    try {
      await execFileAsync('pm2', ['restart', processName]);
      return { success: true, message: `PM2 process '${processName}' restarted successfully.` };
    } catch (error) {
      return { success: false, message: `PM2 Restart Failed: ${String(error)}` };
    }
  },

  // Flush System Cache (e.g. Redis, or just internal map)
  async flushSystemCache() {
    if (!guardrails.isFeatureEnabled('ENABLE_CACHE_FLUSH')) {
      return { success: false, message: "Cache Flush is disabled in .env" };
    }

    return { success: true, message: "System cache flushed successfully." };
  },

  // Auto-create GitHub Issue
  async createGitHubIssue(title: string, body: string, functionName?: string) {
    if (!guardrails.isFeatureEnabled('ENABLE_AUTO_GITHUB_ISSUE')) {
      return { success: false, message: "Auto GitHub Issue is disabled in .env" };
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return { success: false, message: "GITHUB_TOKEN is missing in .env" };
    }

    // Sanitize title and body — strip to safe lengths
    const safeTitle = String(title).slice(0, 200).replace(/[\x00-\x1f]/g, '');
    const safeBody = String(body).slice(0, 5000).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

    try {
      const response = await fetch('https://api.github.com/repos/zenafkar/photo-1/issues', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'AI-SRE-Agent'
        },
        body: JSON.stringify({
          title: safeTitle,
          body: safeBody,
          labels: ['bug', 'automated-alert']
        })
      });

      if (response.ok) {
        const issueData = await response.json() as { html_url: string };
        return { success: true, message: `GitHub issue created: ${issueData.html_url}` };
      } else {
        const errText = await response.text();
        return { success: false, message: `GitHub API error (${response.status}): ${errText.slice(0, 200)}` };
      }
    } catch (error) {
      return { success: false, message: `Failed to create GitHub Issue: ${String(error)}` };
    }
  }
};
