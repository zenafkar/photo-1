import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { telemetryEmitter } from '../middleware/telemetry.js';
import { remediationTools } from './tools/remediationTools.js';
import { telegramBot } from './telegramBot.js';
import { guardrails } from './guardrails.js';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// SRE Agent Prompt
const SRE_PROMPT = `
You are an autonomous Site Reliability Engineer (SRE) Agent managing a Node.js VPS server.
Analyze the following telemetry anomaly/error payload and determine the root cause.
Decide on an action.

Available Actions:
1. "RESTART_PM2" - If memory leak or fatal server hang is suspected.
2. "AUTO_FIX_PUSH" - If a simple code fix is identified.
3. "GITHUB_ISSUE" - For complex bugs needing developer attention.
4. "NO_ACTION" - If it's a transient client error.

Respond strictly in JSON format:
{
  "rootCause": "Explanation of the issue",
  "action": "ONE_OF_THE_ACTIONS_ABOVE",
  "actionDescription": "Brief description of the action",
  "recommendedFix": "Code patch or recommendation"
}
`;

export async function handleAnomaly(payload: any) {
  try {
    const sanitizedPayload = guardrails.sanitizeData(payload);
    
    const result = await ai.models.generateContent({
      model: modelName,
      contents: [
        SRE_PROMPT,
        `Payload:\n${JSON.stringify(sanitizedPayload, null, 2)}`
      ]
    });
    
    const responseText = result.text || '';
    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Agent did not return valid JSON");
    
    const diagnosis = JSON.parse(jsonMatch[0]);
    
    console.log("[SRE Agent Diagnosis]", diagnosis);
    
    // Execute Action based on diagnosis
    let actionStatus = 'PENDING';
    
    if (diagnosis.action === 'RESTART_PM2') {
      await telegramBot.sendApprovalRequest('RESTART_PM2', diagnosis.actionDescription, 'HIGH');
      actionStatus = 'WAITING_APPROVAL';
    } else if (diagnosis.action === 'AUTO_FIX_PUSH') {
      if (process.env.REQUIRE_APPROVAL_FOR_GIT_PUSH === 'true') {
        await telegramBot.sendApprovalRequest('GIT_PUSH', diagnosis.recommendedFix, 'MEDIUM');
        actionStatus = 'WAITING_APPROVAL';
      } else {
        const res = await remediationTools.autoPushToMaster(`fix: agent auto-patch for ${payload.errorName || 'error'}`);
        actionStatus = res.success ? 'RESOLVED' : 'FAILED';
      }
    } else if (diagnosis.action === 'GITHUB_ISSUE') {
      const res = await remediationTools.createGitHubIssue(
        `Agent Alert: ${payload.errorName || payload.type}`,
        `Root Cause: ${diagnosis.rootCause}\nRecommended Fix:\n${diagnosis.recommendedFix}`,
        payload.url
      );
      actionStatus = res.success ? 'RESOLVED (ISSUE CREATED)' : 'FAILED';
    } else {
      actionStatus = 'SUCCESS_NO_ACTION';
    }
    
    // Send Full Report
    await telegramBot.sendFullActionReport({
      time: payload.timestamp,
      component: payload.url || 'Unknown Component',
      rootCause: diagnosis.rootCause,
      action: diagnosis.actionDescription,
      status: actionStatus
    });

  } catch (error) {
    console.error("AI Agent Failed to handle anomaly:", error);
  }
}

// Bind Agent to Telemetry Events
telemetryEmitter.on('anomaly', (payload) => {
  // Run asynchronously so it doesn't block request
  handleAnomaly(payload);
});
