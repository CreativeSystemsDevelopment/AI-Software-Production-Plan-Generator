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
                description: "A highly precise description of the expected output artifact. Format: 'fileName | Description of export and function/component signature.' Example: 'DisplayComponent.js | Exports a default functional React component. Props: { value: string, error?: string }'"
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
  const systemInstruction = `You are a world-class AI Software Architect. Your task is to create a production-only software development plan based on a user's request. This plan is exclusively for a team of hyper-specialized AI agents responsible for producing the application code, orchestrated by an AI Supervisor.

Your primary goal is to structure the plan for maximum parallelism and speed, assuming an effectively unlimited AI workforce. Break down the project into the smallest possible, independent, atomic tasks. For each task, the 'output' specification MUST be extremely precise. It must describe the exact deliverable artifact. For example, instead of a vague 'React component', the output specification should be: 'DisplayComponent.js | Exports a default functional React component. Props: { value: string, error?: string }'. This level of detail is critical for the AI agents to execute tasks without ambiguity.

IMPORTANT: All other phases like initial project planning, research, requirements gathering, testing, and deployment are handled by a different system and MUST NOT be included in your output.

Your response must contain all sections defined in the schema. This includes a special 'supervisorExecutionPlan' section. For this section, you must provide:
1.  'jsonRepresentation': The full, structured list of tasks.
2.  'textualRepresentation': A simple, text-based flow diagram that the supervisor can parse to understand task dependencies and parallel execution opportunities. Example Format: '[START]\\n  -> T1 (Agent Name)\\n  -> T2 (Agent Name)\\n[T1, T2]\\n  -> T3 (Agent Name)\\n[T3]\\n  -> [END]'. This format is mandatory.

For the 'Agent Supervisor Directives', create a directive for each agent specialization with a powerful, generic 'systemPromptTemplate'. This template MUST include placeholders like '{{TASK_DESCRIPTION}}', '{{TASK_DEPENDENCIES}}', and '{{EXPECTED_OUTPUT}}' for the supervisor to dynamically assign tasks.

The final output must be a dependency graph of tasks. Both the system architecture and task dependency diagrams must be in valid and complete Mermaid.js 'graph TD' syntax.

CRITICAL RULE: To prevent syntax errors, ALL text within diagram nodes MUST be enclosed in double quotes. For example, use 'A["User Interface"]' instead of 'A[User Interface]'. This is mandatory for all nodes. Ensure all node identifiers are valid and properly linked.`;

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