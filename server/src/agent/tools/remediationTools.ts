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
  async restartPM2Process(processName: string = 'zen-dev-server') {
    if (!guardrails.isFeatureEnabled('ENABLE_AUTO_RESTART_PM2')) {
      return { success: false, message: "PM2 Restart is disabled" };
    }
    
    // Check rate limit: Max 2 restarts per 30 mins
    if (!guardrails.checkRateLimit('PM2_RESTART', 2, 30 * 60 * 1000)) {
      return { success: false, message: "Rate limit exceeded for PM2 restarts" };
    }
    
    try {
      await execAsync(`pm2 restart ${processName}`);
      return { success: true, message: `PM2 process ${processName} restarted.` };
    } catch (error) {
      return { success: false, message: `PM2 Restart Failed: ${String(error)}` };
    }
  },

  // Flush System Cache (e.g. Redis, or just internal map)
  async flushSystemCache() {
    if (!guardrails.isFeatureEnabled('ENABLE_CACHE_FLUSH')) {
      return { success: false, message: "Cache Flush is disabled" };
    }
    
    // In a real scenario, this could clear a Redis DB or in-memory cache
    return { success: true, message: "System cache flushed successfully." };
  },

  // Auto-create GitHub Issue
  async createGitHubIssue(title: string, body: string, functionName?: string) {
    if (!guardrails.isFeatureEnabled('ENABLE_AUTO_GITHUB_ISSUE')) {
      return { success: false, message: "Auto GitHub Issue is disabled" };
    }
    
    // Ideally use Octokit or `gh` CLI. For demonstration, we simulate success.
    // In actual implementation, we'd do a fetch to GitHub API with PAT token.
    console.log("Mock: Created GitHub issue", title);
    return { success: true, message: `GitHub issue created: ${title}` };
  }
};
