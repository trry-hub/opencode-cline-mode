/**
 * Session state manager for tracking task progress and mode switches
 */

import type {
  TaskState,
  SessionState,
  FocusChain,
  FocusChainStep,
} from "./types.js";

export class StateManager {
  private static instances = new Map<string, StateManager>();
  private static readonly MAX_INSTANCES = 100;
  private state: SessionState;

  private constructor(_sessionID: string) {
    this.state = {
      taskState: {
        isAwaitingPlanResponse: false,
        didRespondToPlanAskBySwitchingMode: false,
        consecutiveMistakeCount: 0,
        consecutiveMistakeLimit: 3,
        autoRetry: true,
        currentMode: "plan",
      },
      yoloModeEnabled: false,
      lastPlan: undefined,
    };
  }

  static getInstance(sessionID: string): StateManager {
    if (!this.instances.has(sessionID)) {
      if (this.instances.size >= this.MAX_INSTANCES) {
        const firstKey = this.instances.keys().next().value;
        if (firstKey) {
          this.instances.delete(firstKey);
        }
      }
      this.instances.set(sessionID, new StateManager(sessionID));
    }
    return this.instances.get(sessionID)!;
  }

  static clearInstance(sessionID: string): void {
    this.instances.delete(sessionID);
  }

  static clearAllInstances(): void {
    this.instances.clear();
  }

  static getInstanceCount(): number {
    return this.instances.size;
  }

  getState(): SessionState {
    return { ...this.state };
  }

  getTaskState(): TaskState {
    return { ...this.state.taskState };
  }

  setAwaitingPlanResponse(value: boolean): void {
    this.state.taskState.isAwaitingPlanResponse = value;
  }

  setModeSwitched(value: boolean): void {
    this.state.taskState.didRespondToPlanAskBySwitchingMode = value;
  }

  switchMode(mode: "plan" | "act"): void {
    this.state.taskState.currentMode = mode;
    if (mode === "act") {
      this.state.taskState.isAwaitingPlanResponse = false;
    }
  }

  setYoloMode(enabled: boolean): void {
    this.state.yoloModeEnabled = enabled;
  }

  isYoloMode(): boolean {
    return this.state.yoloModeEnabled;
  }

  // Error recovery methods
  incrementMistakeCount(): void {
    this.state.taskState.consecutiveMistakeCount++;
  }

  resetMistakeCount(): void {
    this.state.taskState.consecutiveMistakeCount = 0;
  }

  getMistakeCount(): number {
    return this.state.taskState.consecutiveMistakeCount;
  }

  shouldAskUser(): boolean {
    return (
      this.state.taskState.consecutiveMistakeCount >=
      this.state.taskState.consecutiveMistakeLimit
    );
  }

  setAutoRetry(enabled: boolean): void {
    this.state.taskState.autoRetry = enabled;
  }

  isAutoRetryEnabled(): boolean {
    return this.state.taskState.autoRetry;
  }

  setLastPlan(plan: string): void {
    this.state.lastPlan = plan;
  }

  getLastPlan(): string | undefined {
    return this.state.lastPlan;
  }

  // Focus Chain methods
  initializeFocusChain(steps: string[]): void {
    const focusSteps: FocusChainStep[] = steps.map((desc) => ({
      description: desc,
      status: "pending" as const,
    }));

    this.state.taskState.focusChain = {
      steps: focusSteps,
      currentStepIndex: -1,
      completedSteps: [],
      failedSteps: [],
    };
  }

  getFocusChain(): FocusChain | undefined {
    return this.state.taskState.focusChain;
  }

  startStep(index: number): void {
    if (!this.state.taskState.focusChain) return;
    if (index < 0 || index >= this.state.taskState.focusChain.steps.length)
      return;

    this.state.taskState.focusChain.currentStepIndex = index;
    this.state.taskState.focusChain.steps[index].status = "in_progress";
  }

  completeStep(index: number, notes?: string): void {
    if (!this.state.taskState.focusChain) return;
    if (index < 0 || index >= this.state.taskState.focusChain.steps.length)
      return;

    const step = this.state.taskState.focusChain.steps[index];
    step.status = "completed";
    if (notes) step.notes = notes;

    this.state.taskState.focusChain.completedSteps.push(step.description);

    // Move to next step
    if (this.state.taskState.focusChain.currentStepIndex === index) {
      this.state.taskState.focusChain.currentStepIndex = -1;
    }
  }

  failStep(index: number, error?: string): void {
    if (!this.state.taskState.focusChain) return;
    if (index < 0 || index >= this.state.taskState.focusChain.steps.length)
      return;

    const step = this.state.taskState.focusChain.steps[index];
    step.status = "failed";
    if (error) step.notes = error;

    this.state.taskState.focusChain.failedSteps.push(step.description);
  }

  getCurrentStep(): FocusChainStep | null {
    if (!this.state.taskState.focusChain) return null;
    const index = this.state.taskState.focusChain.currentStepIndex;
    if (index < 0) return null;
    return this.state.taskState.focusChain.steps[index];
  }

  getNextPendingStep(): FocusChainStep | null {
    if (!this.state.taskState.focusChain) return null;
    const pending = this.state.taskState.focusChain.steps.find(
      (s) => s.status === "pending",
    );
    return pending || null;
  }

  getProgress(): {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  } {
    if (!this.state.taskState.focusChain) {
      return { total: 0, completed: 0, failed: 0, percentage: 0 };
    }

    const total = this.state.taskState.focusChain.steps.length;
    const completed = this.state.taskState.focusChain.completedSteps.length;
    const failed = this.state.taskState.focusChain.failedSteps.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, failed, percentage };
  }

  formatProgress(): string {
    const progress = this.getProgress();
    if (progress.total === 0) return "No tasks";

    const completed = "✅".repeat(progress.completed);
    const failed = "❌".repeat(progress.failed);
    const pending = "⏳".repeat(
      progress.total - progress.completed - progress.failed,
    );

    return `Progress: ${completed}${failed}${pending} (${progress.percentage}%)`;
  }

  clearState(): void {
    this.state = {
      taskState: {
        isAwaitingPlanResponse: false,
        didRespondToPlanAskBySwitchingMode: false,
        consecutiveMistakeCount: 0,
        consecutiveMistakeLimit: 3,
        autoRetry: true,
        currentMode: "plan",
      },
      yoloModeEnabled: false,
      lastPlan: undefined,
    };
  }
}
