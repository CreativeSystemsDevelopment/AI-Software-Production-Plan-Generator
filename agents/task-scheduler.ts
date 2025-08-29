import type { Task } from '../types';

export class TaskScheduler {
  private tasks: Map<string, Task>;
  private dependencies: Map<string, string[]>;
  private dependents: Map<string, string[]>;
  private completedTasks: Set<string>;

  constructor(tasks: Task[]) {
    this.tasks = new Map(tasks.map(task => [task.id, task]));
    this.dependencies = new Map(tasks.map(task => [task.id, [...task.dependencies]]));
    this.dependents = this.calculateDependents(tasks);
    this.completedTasks = new Set();
  }

  private calculateDependents(tasks: Task[]): Map<string, string[]> {
    const dependents = new Map<string, string[]>();
    tasks.forEach(task => dependents.set(task.id, []));
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        if (dependents.has(depId)) {
          dependents.get(depId)!.push(task.id);
        }
      });
    });
    return dependents;
  }

  public getNextTasks(): Task[] {
    const readyTasks: Task[] = [];
    for (const [taskId, deps] of this.dependencies.entries()) {
      if (deps.every(dep => this.completedTasks.has(dep)) && !this.completedTasks.has(taskId)) {
        const task = this.tasks.get(taskId);
        if(task) {
            readyTasks.push(task);
        }
      }
    }
    return readyTasks;
  }

  public completeTask(taskId: string): void {
    if (!this.tasks.has(taskId)) {
      throw new Error(`Task with id ${taskId} not found.`);
    }
    this.completedTasks.add(taskId);
  }

  public isComplete(): boolean {
    return this.completedTasks.size === this.tasks.size;
  }
}
