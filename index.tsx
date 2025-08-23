import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { generatePlan } from './services/geminiService';
import type { SoftwarePlan, AgentSupervisorDirectives, SupervisorExecutionPlan } from './types';

// Expose the plan generation function globally for programmatic access by other agents/scripts.
// This allows calling `window.getSoftwarePlan(prompt)` from the browser console or other scripts.
declare global {
  interface Window {
    getSoftwarePlan: (prompt: string) => Promise<SoftwarePlan>;
  }
}

const handleApiRequest = async (prompt: string, forTarget?: string | null) => {
    // Set a loading state in the body, styled for readability.
    document.body.style.backgroundColor = '#0d1b2a';
    document.body.innerHTML = `<pre id="json-output" style="word-wrap: break-word; white-space: pre-wrap; color: white;">${JSON.stringify({ status: "loading", message: "Generating plan..." }, null, 2)}</pre>`;
    
    try {
        const plan = await generatePlan(prompt);
        let responsePayload: SoftwarePlan | { agentSupervisorDirectives: AgentSupervisorDirectives; supervisorExecutionPlan: SupervisorExecutionPlan; } = plan;

        if (forTarget === 'supervisor') {
            responsePayload = {
                agentSupervisorDirectives: plan.agentSupervisorDirectives,
                supervisorExecutionPlan: plan.supervisorExecutionPlan,
            };
        }

        const pre = document.getElementById('json-output');
        if(pre) {
            pre.textContent = JSON.stringify(responsePayload, null, 2);
        }
    } catch (error: any) {
        console.error(error);
        const pre = document.getElementById('json-output');
        if(pre) {
            pre.textContent = JSON.stringify({ error: error.message || 'An unknown error occurred.' }, null, 2);
        }
    }
};

const urlParams = new URLSearchParams(window.location.search);
const promptFromUrl = urlParams.get('prompt');
const format = urlParams.get('format');
const forTarget = urlParams.get('for');

// --- API Endpoint Mode ---
// If 'prompt' and 'format=json' are in the URL, bypass the UI and respond with JSON.
if (promptFromUrl && format === 'json') {
    handleApiRequest(promptFromUrl, forTarget);
} else {
    // --- UI Mode ---
    // Expose for legacy programmatic access and console usage
    window.getSoftwarePlan = generatePlan;

    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}