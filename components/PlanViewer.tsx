
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { SoftwarePlan } from '../types';
import { Carousel } from './Carousel';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { DownloadIcon, ChevronDownIcon, FileTextIcon, CodeIcon } from './icons/Icons';

// Make mermaid available from window object
declare const mermaid: any;

interface PlanViewerProps {
  plan: SoftwarePlan;
  onDownloadStart: () => void;
}

const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
        if (ref.current && chart) {
            const renderDiagram = async () => {
                try {
                    const uniqueId = `mermaid-graph-${Math.random().toString(36).substring(2, 9)}`;
                    const { svg, bindFunctions } = await mermaid.render(uniqueId, chart);
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                        if (bindFunctions) {
                            bindFunctions(ref.current);
                        }
                    }
                } catch (e) {
                    console.error("Mermaid rendering error:", e);
                    if (ref.current) {
                        // Sanitize chart output for display in <pre> tag
                        const sanitizedChart = chart
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;");

                        ref.current.innerHTML = `
                            <div class="text-red-200 p-4 border border-red-500/50 bg-red-900/50 rounded-lg w-full text-left">
                                <p class="font-bold text-red-100">Diagram Rendering Error</p>
                                <p class="text-sm mt-2">The AI generated invalid diagram syntax. Below is the code that failed:</p>
                                <pre class="mt-2 p-3 code-block-bg rounded-md text-xs overflow-auto font-mono">${sanitizedChart}</pre>
                            </div>
                        `;
                    }
                }
            };
            renderDiagram();
        } else if (ref.current) {
            ref.current.innerHTML = ""; // Clear previous content if chart is empty
        }
    }, [chart]);
  
    return <div ref={ref} className="mermaid-diagram-bg flex justify-center p-4 rounded-lg overflow-auto min-h-[250px] items-center"></div>;
};

const convertPlanToMarkdown = (plan: SoftwarePlan): string => {
    let md = `# Software Production Plan\n\n`;
  
    md += `## 1. System Architecture\n${plan.systemArchitecture.overview}\n\n### Architecture Diagram\n\`\`\`mermaid\n${plan.systemArchitecture.diagram}\n\`\`\`\n\n`;
  
    md += `## 2. Technology Stack\n**Methodology:** ${plan.techStack.methodology}\n\n### Technologies\n`;
    plan.techStack.technologies.forEach(tech => {
      md += `- **${tech.name}** (${tech.category}): ${tech.reason}\n`;
    });
  
    md += `\n## 3. Agent Specifications\nThe following hyper-specialized AI agents are required for this project.\n`;
    plan.agentSpecifications.forEach(agent => {
      md += `- **${agent.name}**: ${agent.description}\n`;
    });
  
    md += `\n## 4. Agent Supervisor Directives\n${plan.agentSupervisorDirectives.overview}\n`;
    plan.agentSupervisorDirectives.directives.forEach(directive => {
      md += `\n### ${directive.agentName}\n\`\`\`\n${directive.systemPromptTemplate}\n\`\`\`\n`;
    });
  
    md += `\n## 5. Execution Plan - Dependency Graph\n${plan.executionPlan.overview}\n\n### Dependency Graph\n\`\`\`mermaid\n${plan.executionPlan.taskDependencyGraph.diagram}\n\`\`\`\n\n`;
    
    md += `## 6. Supervisor Execution Plan\n${plan.supervisorExecutionPlan.overview}\n\n### Text-Based Flow\n\`\`\`\n${plan.supervisorExecutionPlan.textualRepresentation}\n\`\`\`\n\n### JSON Data for Supervisor\n\`\`\`json\n${JSON.stringify(plan.supervisorExecutionPlan.jsonRepresentation, null, 2)}\n\`\`\`\n\n`;

    md += `## 7. Execution Plan - Task List\n\n`;
    plan.executionPlan.taskList.forEach(task => {
        md += `### Task: ${task.id}\n\n`;
        md += `**Description:** ${task.description}\n\n`;
        md += `**Agent:** ${task.agentSpecialization}\n\n`;
        md += `**Dependencies:** ${task.dependencies.join(', ') || 'None'}\n\n`;
        md += `**Output Specification:**\n`;
        md += `\`\`\`\n${task.output}\n\`\`\`\n\n`;
      });
  
    return md;
};

const downloadAsFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan, onDownloadStart }) => {
  const { isGenerating: isGeneratingPdf, generatePdf } = usePdfGenerator();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDownloadPdf = () => {
    onDownloadStart();
    generatePdf(pdfRef, "Software_Production_Plan");
    setIsDropdownOpen(false);
  };
  
  const handleDownloadJson = useCallback(() => {
    onDownloadStart();
    const jsonContent = JSON.stringify(plan, null, 2);
    downloadAsFile(jsonContent, 'Software_Production_Plan.json', 'application/json');
    setIsDropdownOpen(false);
  }, [plan, onDownloadStart]);

  const handleDownloadMarkdown = useCallback(() => {
    onDownloadStart();
    const mdContent = convertPlanToMarkdown(plan);
    downloadAsFile(mdContent, 'Software_Production_Plan.md', 'text/markdown');
    setIsDropdownOpen(false);
  }, [plan, onDownloadStart]);


  return (
    <div className="relative">
      <div className="absolute top-0 right-0 -mt-2 z-20">
        <div className="relative inline-block text-left">
            <div>
                <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`inline-flex justify-center w-full rounded-md px-4 py-2 text-sm font-medium glass-button ${isDropdownOpen ? 'glass-button-active' : ''}`}
                >
                <DownloadIcon className="h-5 w-5 mr-2"/>
                Download Plan
                <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" />
                </button>
            </div>

            {isDropdownOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none glass-panel"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50" role="menuitem">
                       <DownloadIcon className="h-5 w-5 mr-3"/> {isGeneratingPdf ? 'Generating...' : 'Download as PDF'}
                    </button>
                    <button onClick={handleDownloadMarkdown} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-white/10" role="menuitem">
                       <FileTextIcon className="h-5 w-5 mr-3"/> Download as Markdown
                    </button>
                    <button onClick={handleDownloadJson} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-white/10" role="menuitem">
                        <CodeIcon className="h-5 w-5 mr-3"/> Download as JSON
                    </button>
                </div>
                </div>
            )}
        </div>
      </div>
       <h2 className="text-3xl font-bold text-center mb-6">
          Your Generated <span className="text-[var(--accent-color)]">Software Plan</span>
       </h2>
      <div ref={pdfRef}>
        <Carousel>
          <div className="pdf-slide p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-[var(--accent-color)] border-b-2 border-[var(--glass-border)] pb-2">1. System Architecture</h3>
            <p className="mt-4">{plan.systemArchitecture.overview}</p>
            <div className="mt-4">
               <MermaidDiagram chart={plan.systemArchitecture.diagram} />
            </div>
          </div>
          
          <div className="pdf-slide p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-[var(--accent-color)] border-b-2 border-[var(--glass-border)] pb-2">2. Technology Stack</h3>
            <p className="mt-4"><strong>Methodology:</strong> <span className="opacity-90">{plan.techStack.methodology}</span></p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.techStack.technologies.map(tech => (
                    <div key={tech.name} className="bg-white/5 border border-[var(--glass-border)] p-4 rounded-lg">
                        <p className="font-bold">{tech.name} <span className="text-xs bg-cyan-400/20 text-cyan-200 px-2 py-1 rounded-full ml-2">{tech.category}</span></p>
                        <p className="opacity-80 text-sm mt-1">{tech.reason}</p>
                    </div>
                ))}
            </div>
          </div>

          <div className="pdf-slide p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-[var(--accent-color)] border-b-2 border-[var(--glass-border)] pb-2">3. Agent Specifications</h3>
            <p className="mt-4">The following hyper-specialized AI agents are required for this project.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.agentSpecifications.map(agent => (
                    <div key={agent.name} className="bg-white/5 border border-[var(--glass-border)] p-4 rounded-lg">
                        <p className="font-bold">{agent.name}</p>
                        <p className="opacity-80 text-sm mt-1">{agent.description}</p>
                    </div>
                ))}
            </div>
          </div>

          <div className="pdf-slide p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-[var(--accent-color)] border-b-2 border-[var(--glass-border)] pb-2">4. Agent Supervisor Directives</h3>
            <p className="mt-4">{plan.agentSupervisorDirectives.overview}</p>
            <div className="mt-4 space-y-4">
                {plan.agentSupervisorDirectives.directives.map(directive => (
                    <div key={directive.agentName} className="bg-white/5 border border-[var(--glass-border)] p-4 rounded-lg">
                        <p className="font-bold">{directive.agentName}</p>
                        <pre className="text-sm mt-2 code-block-bg p-3 rounded-md whitespace-pre-wrap font-mono">
                          <code>{directive.systemPromptTemplate}</code>
                        </pre>
                    </div>
                ))}
            </div>
          </div>

          <div className="pdf-slide p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-[var(--accent-color)] border-b-2 border-[var(--glass-border)] pb-2">5. Execution Plan - Dependency Graph</h3>
            <p className="mt-4">{plan.executionPlan.overview}</p>
            <div className="mt-4">
               <MermaidDiagram chart={plan.executionPlan.taskDependencyGraph.diagram} />
            </div>
          </div>
          
          <div className="pdf-slide p-6 h-[500px] overflow-y-auto">
            <h3 className="text-2xl font-bold text-[var(--accent-color)] border-b-2 border-[var(--glass-border)] pb-2 sticky top-0 bg-slate-800/80 backdrop-blur-sm">6. Supervisor Execution Plan</h3>
             <p className="mt-4">{plan.supervisorExecutionPlan.overview}</p>
             <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">Text-Based Flow</h4>
                <pre className="text-sm code-block-bg p-3 rounded-md whitespace-pre-wrap font-mono">
                  <code>{plan.supervisorExecutionPlan.textualRepresentation}</code>
                </pre>
             </div>
             <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">JSON Data for Supervisor</h4>
                 <pre className="text-xs code-block-bg p-3 rounded-md whitespace-pre-wrap font-mono">
                  <code>{JSON.stringify(plan.supervisorExecutionPlan.jsonRepresentation, null, 2)}</code>
                </pre>
             </div>
          </div>

          <div className="pdf-slide p-6 rounded-lg h-[500px] overflow-y-auto">
            <h3 className="text-2xl font-bold text-[var(--accent-color)] border-b-2 border-[var(--glass-border)] pb-2 sticky top-0 bg-slate-800/80 backdrop-blur-sm">7. Execution Plan - Task List</h3>
            <div className="mt-4 space-y-3">
                {plan.executionPlan.taskList.map(task => (
                    <div key={task.id} className="bg-white/5 border border-[var(--glass-border)] p-4 rounded-lg">
                        <p className="font-bold">{task.id}: {task.description}</p>
                        <p className="text-sm mt-2"><strong className="text-[var(--accent-color)]">Agent:</strong> {task.agentSpecialization}</p>
                        <p className="text-sm"><strong className="text-[var(--accent-color)]">Dependencies:</strong> {task.dependencies.join(', ') || 'None'}</p>
                        <div className="text-sm mt-2">
                            <strong className="text-[var(--accent-color)]">Output Specification:</strong>
                            <pre className="text-xs mt-1 code-block-bg p-3 rounded-md whitespace-pre-wrap font-mono">
                                <code>{task.output}</code>
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </Carousel>
      </div>
    </div>
  );
};
