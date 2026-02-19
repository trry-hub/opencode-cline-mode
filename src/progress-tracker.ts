import type { PlanTask } from './plan-manager';
import type { Logger } from './logger';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface ProgressReport {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percentage: number;
  progressBar: string;
  currentTask: PlanTask | null;
  nextTasks: PlanTask[];
}

export interface ProgressTrackerConfig {
  logger?: Logger;
}

export class ProgressTracker {
  private logger?: Logger;

  constructor(config: ProgressTrackerConfig = {}) {
    this.logger = config.logger;
  }

  getProgress(tasks: PlanTask[]): ProgressReport {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const total = tasks.length;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const report: ProgressReport = {
      total,
      completed,
      inProgress,
      pending,
      percentage,
      progressBar: this.generateProgressBar(percentage),
      currentTask: this.getCurrentTask(tasks),
      nextTasks: this.getNextTasks(tasks),
    };

    this.logger?.debug('Progress calculated', {
      total: report.total,
      completed: report.completed,
      percentage: report.percentage,
    });

    return report;
  }

  getFocusChain(tasks: PlanTask[]): PlanTask[] {
    const currentIndex = tasks.findIndex(t => t.status === 'in_progress');

    if (currentIndex === -1) {
      // If no task is in progress, return first 4 pending tasks
      return tasks.filter(t => t.status === 'pending').slice(0, 4);
    }

    // Return current task + next 3 tasks
    return tasks.slice(currentIndex, currentIndex + 4);
  }

  updateTaskStatus(tasks: PlanTask[], taskId: string, status: TaskStatus): PlanTask[] {
    return tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, status };
      }
      return task;
    });
  }

  formatProgress(report: ProgressReport): string {
    const lines: string[] = [
      `进度: ${report.progressBar} ${report.percentage}% (${report.completed}/${report.total} 任务)`,
      '',
    ];

    return lines.join('\n');
  }

  formatTaskList(tasks: PlanTask[]): string {
    const lines: string[] = ['任务列表:'];

    tasks.forEach((task, index) => {
      const icon = this.getTaskIcon(task.status);
      const current = task.status === 'in_progress' ? ' (当前)' : '';
      lines.push(`${icon} ${index + 1}. ${task.title}${current}`);
    });

    return lines.join('\n');
  }

  formatFocusChain(tasks: PlanTask[]): string {
    const lines: string[] = ['🎯 Focus Chain:', ''];

    const currentTask = tasks.find(t => t.status === 'in_progress');
    const nextTasks = tasks.filter(t => t.status === 'pending').slice(0, 3);

    if (currentTask) {
      lines.push('当前任务:');
      lines.push(`→ ${currentTask.title}`);
      lines.push('');
    }

    if (nextTasks.length > 0) {
      lines.push('接下来的任务:');
      nextTasks.forEach((task, index) => {
        lines.push(`  ${index + 1}. ${task.title}`);
      });
    }

    return lines.join('\n');
  }

  private getCurrentTask(tasks: PlanTask[]): PlanTask | null {
    return tasks.find(t => t.status === 'in_progress') || null;
  }

  private getNextTasks(tasks: PlanTask[]): PlanTask[] {
    const currentIndex = tasks.findIndex(t => t.status === 'in_progress');

    if (currentIndex === -1) {
      return tasks.filter(t => t.status === 'pending').slice(0, 3);
    }

    return tasks.slice(currentIndex + 1, currentIndex + 4).filter(t => t.status === 'pending');
  }

  private generateProgressBar(percentage: number): string {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private getTaskIcon(status: TaskStatus): string {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'pending':
        return '⏸️';
      default:
        return '⏸️';
    }
  }
}
