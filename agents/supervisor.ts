import type { SoftwarePlan, Task } from '../types';
import { TaskScheduler } from './task-scheduler';
import { SpecializedAgent } from './specialized-agent';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'error';

export interface TaskExecutionState {
  task: Task;
  status: TaskStatus;
  output: string | null;
}

export type ProgressCallback = (newState: Map<string, TaskExecutionState>) => void;

export class Supervisor {
  private plan: SoftwarePlan;
  private scheduler: TaskScheduler;
  private agent: SpecializedAgent;
  private taskStates: Map<string, TaskExecutionState>;
  private completedOutputs: Map<string, string>;
  private onProgress: ProgressCallback;

  constructor(plan: SoftwarePlan, onProgress: ProgressCallback) {
    this.plan = plan;
    this.scheduler = new TaskScheduler(plan.executionPlan.taskList);
    this.agent = new SpecializedAgent();
    this.onProgress = onProgress;
    this.completedOutputs = new Map<string, string>();

    this.taskStates = new Map(
      plan.executionPlan.taskList.map(task => [
        task.id,
        { task, status: 'pending', output: null },
      ])
    );
    this.notifyProgress();
  }

  private notifyProgress() {
    this.onProgress(new Map(this.taskStates));
  }

  private updateTaskState(taskId: string, status: TaskStatus, output: string | null = null) {
    const currentState = this.taskStates.get(taskId);
    if (currentState) {
      currentState.status = status;
      if (output !== null) {
        currentState.output = output;
      }
      this.notifyProgress();
    }
  }

  public async startExecution(): Promise<void> {
    while (!this.scheduler.isComplete()) {
      const readyTasks = this.scheduler.getNextTasks();

      const runningTasks = Array.from(this.taskStates.values())
        .filter(s => s.status === 'running')
        .map(s => s.task.id);

      const tasksToRun = readyTasks.filter(t => !runningTasks.includes(t.id));

      if (tasksToRun.length === 0 && !this.scheduler.isComplete()) {
        // Break if there's a deadlock or no tasks are ready
        const allTasks = Array.from(this.taskStates.values());
        if(allTasks.every(t => t.status === 'completed' || t.status === 'error')){
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for tasks to complete
        continue;
      }

      const executionPromises = tasksToRun.map(task => this.executeTask(task));
      await Promise.all(executionPromises);
    }
  }

  private async executeTask(task: Task): Promise<void> {
    this.updateTaskState(task.id, 'running');

    const directive = this.plan.agentSupervisorDirectives.directives.find(
      d => d.agentName === task.agentSpecialization
    );

    if (!directive) {
      this.updateTaskState(task.id, 'error', `No directive found for agent: ${task.agentSpecialization}`);
      this.scheduler.completeTask(task.id); // Mark as complete to avoid deadlock
      return;
    }

    try {
      const output = await this.agent.executeTask(
        task,
        directive.systemPromptTemplate,
        this.completedOutputs
      );
      this.completedOutputs.set(task.id, output);
      this.scheduler.completeTask(task.id);
      this.updateTaskState(task.id, 'completed', output);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateTaskState(task.id, 'error', errorMessage);
      this.scheduler.completeTask(task.id); // Mark as complete to avoid deadlock
    }
  }
}
