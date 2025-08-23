export interface SystemArchitecture {
  overview: string;
  diagram: string; // Mermaid JS syntax
}

export interface Technology {
  name: string;
  category: string;
  reason: string;
}

export interface TechStack {
  methodology: string;
  technologies: Technology[];
}

export interface AgentSpecification {
  name: string;
  description: string;
}

export interface AgentPromptDirective {
  agentName: string;
  systemPromptTemplate: string;
}

export interface AgentSupervisorDirectives {
  overview: string;
  directives: AgentPromptDirective[];
}

export interface Task {
  id: string;
  description: string;
  agentSpecialization: string;
  dependencies: string[];
  output: string;
}

export interface ExecutionPlan {
  overview: string;
  taskList: Task[];
  taskDependencyGraph: {
    diagram: string; // Mermaid JS syntax
  };
}

export interface SupervisorExecutionPlan {
  overview: string;
  jsonRepresentation: Task[];
  textualRepresentation: string;
}

export interface SoftwarePlan {
  systemArchitecture: SystemArchitecture;
  techStack: TechStack;
  agentSpecifications: AgentSpecification[];
  agentSupervisorDirectives: AgentSupervisorDirectives;
  executionPlan: ExecutionPlan;
  supervisorExecutionPlan: SupervisorExecutionPlan;
}
