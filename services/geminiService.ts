import { GoogleGenAI, Type } from "@google/genai";
import type { SoftwarePlan, Task } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const taskListSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            description: { type: Type.STRING },
            agentSpecialization: { type: Type.STRING },
            dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
            output: {
                type: Type.STRING,
                description: "A highly precise description of the expected output artifact. For code files, use 'fileName | Description'. For UI components, the format is 'fileName | Description ||| <HTML_PREVIEW>'. The HTML preview must be a self-contained, static HTML document representing the component's visual appearance."
            },
        },
    },
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        systemArchitecture: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING },
                diagram: { type: Type.STRING, description: "A valid system architecture diagram using Mermaid.js 'graph TD' syntax. CRITICAL: ALL node text MUST be enclosed in double quotes to prevent syntax errors. Example: 'graph TD; A[\"Client Facing App\"] --> B(\"Backend API\"); B --> C{\\\"Data Storage\\\"};'" },
            },
        },
        techStack: {
            type: Type.OBJECT,
            properties: {
                methodology: { type: Type.STRING },
                technologies: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            category: { type: Type.STRING },
                            reason: { type: Type.STRING },
                        },
                    },
                },
            },
        },
        agentSpecifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                },
            },
        },
        agentSupervisorDirectives: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING, description: "An overview of how to use the following directives to spawn and instruct AI agents." },
                directives: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            agentName: { type: Type.STRING, description: "The name of the agent specialization, matching one from Agent Specifications." },
                            systemPromptTemplate: { type: Type.STRING, description: "A template for the system prompt for this agent. It must include placeholders like '{{TASK_DESCRIPTION}}', '{{TASK_DEPENDENCIES}}', and '{{EXPECTED_OUTPUT}}' for the supervisor to fill." },
                        }
                    }
                }
            }
        },
        executionPlan: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING },
                taskList: taskListSchema,
                taskDependencyGraph: {
                    type: Type.OBJECT,
                    properties: {
                        diagram: { type: Type.STRING, description: "A valid task dependency graph using Mermaid.js 'graph TD' syntax. CRITICAL: ALL node text MUST be enclosed in double quotes. Example: 'graph TD; T1[\"Setup Project\"]-->T2[\"Design UI\"]; T1-->T3[\"Create Database Schema\"];'" },
                    },
                },
            },
        },
        supervisorExecutionPlan: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING, description: "An overview of the machine-readable execution plan for the AI Supervisor." },
                jsonRepresentation: taskListSchema,
                textualRepresentation: { type: Type.STRING, description: "A simple text-based flow diagram for the supervisor. Use '->' for dependencies and group parallel tasks. Example: '[START]\\n  -> T1 (UI Agent)\\n  -> T2 (API Agent)\\n[T1, T2]\\n  -> T3 (Integration Agent)\\n[T3]\\n  -> [END]'" }
            }
        }
    },
};

export const generatePlan = async (userPrompt: string): Promise<SoftwarePlan> => {
  const systemInstruction = `You are a world-class AI Software Architect. Your task is to create a production-only software development plan based on a user's request. This plan is for a team of hyper-specialized AI agents that produce the application code.

**Key Principles:**
1.  **Parallelism:** Structure the plan for maximum parallelism, assuming an unlimited AI workforce.
2.  **Atomicity:** Break down the project into the smallest possible, independent, atomic tasks.
3.  **Precision:** Task 'output' specifications must be extremely precise.

**Agent Specializations & Task Requirements:**
*   **Standard Agents:** (Frontend, Backend, Database, etc.) will produce code files.
    *   **Output Format:** \`fileName | Description of exports/functions.\`
*   **UI Agents:** In addition to code, they MUST produce a static HTML preview of the component.
    *   **Output Format:** \`fileName | Description ||| <HTML_PREVIEW>\`
    *   The \`<HTML_PREVIEW>\` MUST be a complete, self-contained HTML document that visually represents the component. Use placeholders for data.
*   **DevOps_Agent:** This agent is responsible for creating deployment and environment setup files.
    *   You MUST include tasks for the DevOps_Agent to create a \`Dockerfile\` and a \`docker-compose.yml\` file for the project.

**Output Structure:**
Your response MUST be a single JSON object that adheres to the provided schema.
1.  **supervisorExecutionPlan:** Must contain both the full JSON task list and a simple text-based flow diagram (e.g., \`[START] -> T1 -> [END]\`).
2.  **agentSupervisorDirectives:** Create a powerful, generic \`systemPromptTemplate\` for EACH agent specialization. The template MUST include placeholders like \`{{TASK_DESCRIPTION}}\`, \`{{TASK_DEPENDENCIES}}\`, and \`{{EXPECTED_OUTPUT}}\`.
3.  **Diagrams:** System architecture and task dependency diagrams must be in valid Mermaid.js 'graph TD' syntax. ALL node text MUST be enclosed in double quotes (e.g., \`A["Node Text"]\`).

**CRITICAL:** Do NOT include tasks for planning, research, testing, or deployment. Focus solely on generating the production code and necessary Docker files.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Here is the user's software idea: "${userPrompt}"`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7,
    },
  });

  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText) as SoftwarePlan;
  } catch (error) {
    console.error("Failed to parse Gemini response:", jsonText);
    throw new Error("The AI returned an invalid plan format.");
  }
};

export const executeAgentTask = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    const model = ai.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    return result.response.text();
};