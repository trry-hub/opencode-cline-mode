import { describe, it, expect } from 'vitest';
import { ProgressTracker, type TaskStatus } from '../src/progress-tracker';
import type { PlanTask } from '../src/plan-manager';

describe('ProgressTracker', () => {
  const tracker = new ProgressTracker();

  const createTestTasks = (): PlanTask[] => [
    {
      id: 'task-1',
      title: 'Task 1',
      operation: 'create',
      target: 'file1.ts',
      description: 'Description 1',
      verification: 'Test',
      riskLevel: 'low',
      status: 'completed',
    },
    {
      id: 'task-2',
      title: 'Task 2',
      operation: 'update',
      target: 'file2.ts',
      description: 'Description 2',
      verification: 'Test',
      riskLevel: 'medium',
      status: 'in_progress',
    },
    {
      id: 'task-3',
      title: 'Task 3',
      operation: 'delete',
      target: 'file3.ts',
      description: 'Description 3',
      verification: 'Test',
      riskLevel: 'low',
      status: 'pending',
    },
    {
      id: 'task-4',
      title: 'Task 4',
      operation: 'read',
      target: 'file4.ts',
      description: 'Description 4',
      verification: 'Test',
      riskLevel: 'low',
      status: 'pending',
    },
  ];

  it('should calculate progress correctly', () => {
    const tasks = createTestTasks();
    const report = tracker.getProgress(tasks);

    expect(report.total).toBe(4);
    expect(report.completed).toBe(1);
    expect(report.inProgress).toBe(1);
    expect(report.pending).toBe(2);
    expect(report.percentage).toBe(25);
  });

  it('should generate progress bar', () => {
    const tasks = createTestTasks();
    const report = tracker.getProgress(tasks);

    expect(report.progressBar).toBe('███░░░░░░░');
  });

  it('should identify current task', () => {
    const tasks = createTestTasks();
    const report = tracker.getProgress(tasks);

    expect(report.currentTask).not.toBeNull();
    expect(report.currentTask?.id).toBe('task-2');
  });

  it('should get focus chain', () => {
    const tasks = createTestTasks();
    const focusChain = tracker.getFocusChain(tasks);

    expect(focusChain.length).toBe(3);
    expect(focusChain[0].status).toBe('in_progress');
  });

  it('should update task status', () => {
    const tasks = createTestTasks();
    const updated = tracker.updateTaskStatus(tasks, 'task-2', 'completed');

    expect(updated[1].status).toBe('completed');
    expect(updated[0].status).toBe('completed'); // Unchanged
  });

  it('should format progress report', () => {
    const tasks = createTestTasks();
    const report = tracker.getProgress(tasks);
    const formatted = tracker.formatProgress(report);

    expect(formatted).toContain('25%');
    expect(formatted).toContain('1/4');
    expect(formatted).toContain('███░░░░░░░');
  });

  it('should format task list', () => {
    const tasks = createTestTasks();
    const formatted = tracker.formatTaskList(tasks);

    expect(formatted).toContain('✅');
    expect(formatted).toContain('🔄');
    expect(formatted).toContain('⏸️');
    expect(formatted).toContain('Task 1');
    expect(formatted).toContain('Task 2');
  });

  it('should format focus chain', () => {
    const tasks = createTestTasks();
    const formatted = tracker.formatFocusChain(tasks);

    expect(formatted).toContain('🎯 Focus Chain');
    expect(formatted).toContain('当前任务');
    expect(formatted).toContain('接下来的任务');
  });

  it('should handle empty tasks', () => {
    const report = tracker.getProgress([]);

    expect(report.total).toBe(0);
    expect(report.completed).toBe(0);
    expect(report.percentage).toBe(0);
    expect(report.currentTask).toBeNull();
  });

  it('should handle all completed tasks', () => {
    const tasks = createTestTasks().map(t => ({ ...t, status: 'completed' as TaskStatus }));
    const report = tracker.getProgress(tasks);

    expect(report.percentage).toBe(100);
    expect(report.progressBar).toBe('██████████');
    expect(report.currentTask).toBeNull();
  });
});
