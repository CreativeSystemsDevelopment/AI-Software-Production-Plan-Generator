import type { Task } from '../types';
import { executeAgentTask } from '../services/geminiService';

export class SpecializedAgent {
  public async executeTask(
    task: Task,
    systemPromptTemplate: string,
    completedTasks: Map<string, string>
  ): Promise<string> {
    const userPrompt = this.constructUserPrompt(task, completedTasks);
    const systemPrompt = this.constructSystemPrompt(systemPromptTemplate, task);

    try {
      const output = await executeAgentTask(systemPrompt, userPrompt);
      return output;
    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);
      return `Error: Could not execute task ${task.id}.`;
    }
  }

  private constructSystemPrompt(template: string, task: Task): string {
    return template
      .replace('{{TASK_DESCRIPTION}}', task.description)
      .replace('{{EXPECTED_OUTPUT}}', task.output);
  }

  private constructUserPrompt(task: Task, completedTasks: Map<string, string>): string {
    let prompt = `Here is your task:\n\n`;
    prompt += `**Task ID:** ${task.id}\n`;
    prompt += `**Description:** ${task.description}\n`;
    prompt += `**Expected Output:** ${task.output}\n\n`;

    if (task.dependencies.length > 0) {
      prompt += '**You must use the output from these prerequisite tasks:**\n';
      task.dependencies.forEach(depId => {
        const output = completedTasks.get(depId);
        if (output) {
          prompt += `**Task ${depId} Output:**\n---\n${output}\n---\n\n`;
        }
      });
    }

    prompt += "Now, please provide the complete and final output for your task, and nothing else. Do not add any commentary, progress updates, or anything other than the final deliverable."

    return prompt;
  }
}
