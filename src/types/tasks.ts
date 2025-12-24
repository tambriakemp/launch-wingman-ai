// Phase definitions - ordered sequence
export const PHASES = [
  'planning',
  'messaging',
  'build',
  'content',
  'launch',
  'post-launch',
] as const;

export type Phase = typeof PHASES[number];

export const PHASE_LABELS: Record<Phase, string> = {
  planning: 'Planning',
  messaging: 'Messaging',
  build: 'Build',
  content: 'Content',
  launch: 'Launch',
  'post-launch': 'Post-Launch',
};

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export type PhaseStatus = 'locked' | 'active' | 'complete';

export type AIAssistMode = 'help_me_choose' | 'examples' | 'simplify' | 'results_focused' | 'emotion_focused' | 'identity_focused';

export type SkipReason = 'not_relevant' | 'already_completed' | 'doing_later';

export type FunnelType = 'webinar' | 'challenge' | 'direct-sales' | 'lead-magnet' | 'all';

// Task template - defines what a task looks like before it's created for a project
export interface TaskTemplate {
  taskId: string;
  title: string;
  phase: Phase;
  funnelTypes: FunnelType[];
  order: number;
  priority?: number;
  estimatedMinutesMin: number;
  estimatedMinutesMax: number;
  blocking: boolean;
  dependencies: string[];
  canSkip: boolean;
  skipReasonRequired: boolean;
  completionCriteria: string[];
  whyItMatters: string;
  instructions: string[];
  inputType: 'selection' | 'text' | 'checklist' | 'multi-select' | 'form';
  inputSchema?: InputSchema;
  aiAssistModes: AIAssistMode[];
  toolLinks?: ToolLink[];
  route: string;
}

export interface InputSchema {
  type: 'radio' | 'checkbox' | 'textarea' | 'form';
  options?: InputOption[];
  fields?: FormField[];
  placeholder?: string;
  maxLength?: number;
}

export interface InputOption {
  value: string;
  label: string;
  description: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
}

export interface ToolLink {
  label: string;
  url: string;
  icon?: string;
}

// Project task - an instance of a task for a specific project
export interface ProjectTask {
  id: string;
  projectId: string;
  taskId: string;
  status: TaskStatus;
  inputData?: Record<string, unknown>;
  skipReason?: SkipReason;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  createdAt: string;
}

// Project state for phase tracking
export interface ProjectPhaseState {
  activePhase: Phase;
  selectedFunnelType: FunnelType | null;
  phaseStatuses: Record<Phase, PhaseStatus>;
  lastPhaseTransition?: string;
}

// Next best task result
export interface NextBestTask {
  taskId: string;
  projectTaskId?: string;
  title: string;
  phase: Phase;
  route: string;
  estimatedTimeRange: string;
  whyItMatters: string;
  isBlocking: boolean;
}

// Engine state
export interface TaskEngineState {
  isLoading: boolean;
  error: string | null;
  nextBestTask: NextBestTask | null;
  activePhase: Phase;
  phaseStatuses: Record<Phase, PhaseStatus>;
  projectTasks: ProjectTask[];
}
