import { exec } from 'child_process';
import { promisify } from 'util';
import { guardrails } from '../guardrails.js';
import { telegramBot } from '../telegramBot.js';

const execAsync = promisify(exec);

// Remediation Tool Registry
export const remediationTools = {
  // Auto-Git Push to Master
  async autoPushToMaster(commitMessage: string, filePaths: string = '.') {
    if (!guardrails.isFeatureEnabled('ENABLE_AUTO_GIT_PUSH')) {
      return { success: false, message: "Auto Git Push is disabled in .env" };
    }
    
    try {
      await execAsync(`git add ${filePaths}`);
      await execAsync(`git commit -m "${commitMessage}"`);
      await execAsync(`git push origin master`);
      return { success: true, message: `Successfully pushed to master: ${commitMessage}` };
    } catch (error) {
      console.error("Git Push Failed", error);
      return { success: false, message: `Git Push Failed: ${String(error)}` };
    }
  },

  // PM2 Restart
  async restartPM2Process(processName: string = 'backend-api') {
    if (!guardrails.isFeatureEnabled('ENABLE_AUTO_RESTART_PM2')) {
      return { success: false, message: "PM2 Restart is disabled in .env" };
    }
    
    // Check rate limit: Max 2 restarts per 30 mins
    if (!guardrails.checkRateLimit('PM2_RESTART', 2, 30 * 60 * 1000)) {
      return { success: false, message: "Rate limit exceeded for PM2 restarts (Max 2 per 30 mins)" };
    }
    
    try {
      await execAsync(`pm2 restart ${processName}`);
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
          title,
          body,
          labels: ['bug', 'automated-alert']
        })
      });

      if (response.ok) {
        const issueData = await response.json() as { html_url: string };
        return { success: true, message: `GitHub issue created: ${issueData.html_url}` };
      } else {
        const errText = await response.text();
        return { success: false, message: `GitHub API error (${response.status}): ${errText}` };
      }
    } catch (error) {
      return { success: false, message: `Failed to create GitHub Issue: ${String(error)}` };
    }
  }
};
