import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SoftwarePlan } from '../types';
import { Supervisor, TaskExecutionState, TaskStatus } from '../agents/supervisor';
import { LoadingSpinner } from './LoadingSpinner';
import { LivePreview } from './LivePreview';
import { EyeIcon } from './icons/Icons';

interface AgentExecutorProps {
  plan: SoftwarePlan;
}

export const AgentExecutor: React.FC<AgentExecutorProps> = ({ plan }) => {
  const [taskStates, setTaskStates] = useState<Map<string, TaskExecutionState>>(new Map());
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const supervisorRef = useRef<Supervisor | null>(null);

  useEffect(() => {
    if (plan) {
      const initialStates = new Map(
        plan.executionPlan.taskList.map(task => [
          task.id,
          { task, status: 'pending', output: null },
        ])
      );
      setTaskStates(initialStates);
      setActivePreview(null);
    }
  }, [plan]);

  const handleProgress = useCallback((newState: Map<string, TaskExecutionState>) => {
    setTaskStates(newState);
  }, []);

  const startExecution = async () => {
    if (executionStatus === 'idle' && plan) {
      setExecutionStatus('running');
      const supervisor = new Supervisor(plan, handleProgress);
      supervisorRef.current = supervisor;
      await supervisor.startExecution();
      setExecutionStatus('finished');
    }
  };

  const handleShowPreview = (output: string) => {
    const parts = output.split('|||');
    if (parts.length > 1) {
      setActivePreview(parts[1]);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400';
      case 'running':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
    }
  };

  const tasks = Array.from(taskStates.values()).sort((a, b) => {
    const aNum = parseInt(a.task.id.substring(1));
    const bNum = parseInt(b.task.id.substring(1));
    return aNum - bNum;
  });

  return (
    <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg w-full max-w-7xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Agent Execution</h2>
        <button
          onClick={startExecution}
          disabled={executionStatus !== 'idle'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {executionStatus === 'idle' && 'Start Execution'}
          {executionStatus === 'running' && 'Executing...'}
          {executionStatus === 'finished' && 'Execution Finished'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[70vh]">
        {/* Task List Column */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-4">
          {tasks.map(({ task, status, output }) => {
            const isUiTask = task.agentSpecialization.toLowerCase().includes('frontend') || task.agentSpecialization.toLowerCase().includes('ui');
            const hasPreview = status === 'completed' && isUiTask && output && output.includes('|||');

            return (
              <div key={task.id} className="bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-white">{task.id}: {task.description}</h3>
                  <div className="flex items-center space-x-2">
                    {hasPreview && (
                      <button onClick={() => handleShowPreview(output!)} className="text-blue-400 hover:text-blue-300" title="Show Preview">
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    )}
                    {status === 'running' && <LoadingSpinner />}
                    <span className={`font-mono text-sm ${getStatusColor(status)}`}>{status}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-1">Agent: {task.agentSpecialization}</p>
                {output && (
                  <div className="mt-4 bg-black p-4 rounded max-h-48 overflow-y-auto">
                    <h4 className="text-gray-300 font-semibold mb-2">Output:</h4>
                    <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">{output.split('|||')[0]}</pre>
                  </div>
                )}
              </div>
            );
          })}
          {tasks.length === 0 && <p className="text-white">Waiting for plan...</p>}
        </div>

        {/* Live Preview Column */}
        <div className="flex-1">
          <LivePreview htmlContent={activePreview} />
        </div>
      </div>
    </div>
  );
};
