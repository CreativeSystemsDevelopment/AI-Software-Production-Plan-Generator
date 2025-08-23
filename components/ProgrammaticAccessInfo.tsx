import React from 'react';
import { TerminalIcon, XIcon } from './icons/Icons';

interface ProgrammaticAccessInfoProps {
    onClose: () => void;
}

export const ProgrammaticAccessInfo: React.FC<ProgrammaticAccessInfoProps> = ({ onClose }) => {
  const fullApiUrl = `https://<YOUR_APP_URL>/?prompt=A+social+media+app+for+cats&format=json`;
  const supervisorApiUrl = `https://<YOUR_APP_URL>/?prompt=A+social+media+app+for+cats&format=json&for=supervisor`;
  const supervisorResponseExample = `{
  "agentSupervisorDirectives": { ... },
  "supervisorExecutionPlan": { ... }
}`;

  const agentApiCode = `// Conceptual Puppeteer example for the API endpoint
const browser = await puppeteer.launch();
const page = await browser.newPage();
// Navigate to the URL with the desired prompt
await page.goto('.../?prompt=Your+idea&format=json');

// The entire page content is the JSON response
const jsonResponse = await page.evaluate(() => document.body.innerText);
const plan = JSON.parse(jsonResponse);

console.log(plan); // The full JSON plan object
await browser.close();`;

  const consoleCode = `await window.getSoftwarePlan("A social media app for cats")`;

  return (
    <div className="glass-panel p-6 relative max-h-[90vh] overflow-y-auto">
      <button 
        onClick={onClose} 
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
        aria-label="Close"
      >
        <XIcon className="h-6 w-6" />
      </button>

      <div className="flex items-center">
        <TerminalIcon className="h-8 w-8 text-[var(--accent-color)] mr-3" />
        <h2 className="text-xl font-bold">Programmatic Access</h2>
      </div>
      <p className="text-sm text-gray-300 opacity-80 mt-2">
        This tool can be accessed programmatically by an AI agent. Below are the available methods.
      </p>
      <div className="mt-6 space-y-6 text-left">
        
        <div>
            <h3 className="font-semibold text-md flex items-center">
                <span className="text-xs bg-green-400/20 text-green-200 px-2 py-0.5 rounded-full mr-2">Recommended</span>
                Method 1a: Full Plan API Endpoint
            </h3>
            <p className="text-xs text-gray-300 opacity-80 mt-1 mb-2">
                The most direct way for an agent to get a plan is by navigating to a URL with `prompt` and `format=json` query parameters. The response will be a pure JSON body.
            </p>
            <p className="text-xs font-semibold text-gray-200 mt-2 mb-1">Example URL</p>
            <pre className="text-xs code-block-bg p-2 rounded-md whitespace-pre-wrap font-mono">
                <code>{fullApiUrl}</code>
            </pre>
            <p className="text-xs font-semibold text-gray-200 mt-3 mb-1">Agent Implementation (Headless Browser)</p>
            <pre className="text-xs code-block-bg p-2 rounded-md whitespace-pre-wrap font-mono">
                <code>{agentApiCode}</code>
            </pre>
        </div>

        <div>
            <h3 className="font-semibold text-md flex items-center">
                Method 1b: Supervisor-Only API Endpoint
            </h3>
            <p className="text-xs text-gray-300 opacity-80 mt-1 mb-2">
                For an AI Supervisor agent, a leaner response is available containing only its required directives and execution plan. Use the `for=supervisor` query parameter.
            </p>
            <p className="text-xs font-semibold text-gray-200 mt-2 mb-1">Example URL</p>
            <pre className="text-xs code-block-bg p-2 rounded-md whitespace-pre-wrap font-mono">
                <code>{supervisorApiUrl}</code>
            </pre>
            <p className="text-xs font-semibold text-gray-200 mt-3 mb-1">Example JSON Response (trimmed)</p>
            <pre className="text-xs code-block-bg p-2 rounded-md whitespace-pre-wrap font-mono">
                <code>{supervisorResponseExample}</code>
            </pre>
        </div>

        <div className="opacity-60">
            <h3 className="font-semibold text-md flex items-center">
                <span className="text-xs bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded-full mr-2">Legacy</span>
                Method 2: Console Function
            </h3>
            <p className="text-xs text-gray-300 opacity-80 mt-1 mb-2">
                For debugging or manual use, you can call a global function from your browser's developer console. An agent can also execute this function using a headless browser.
            </p>
            <pre className="text-xs code-block-bg p-2 rounded-md whitespace-pre-wrap font-mono">
                <code>{consoleCode}</code>
            </pre>
        </div>

      </div>
    </div>
  );
};