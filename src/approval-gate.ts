import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import type { Logger } from './logger';

export interface PlanStatus {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
}

export interface PlanStatusFile {
  version: string;
  currentPlan: string | null;
  plans: Record<string, PlanStatus>;
}

export interface ApprovalGateConfig {
  plansDir: string;
  logger?: Logger;
}

export class ApprovalGate {
  private plansDir: string;
  private logger?: Logger;
  private statusFilePath: string;

  constructor(config: ApprovalGateConfig) {
    this.plansDir = config.plansDir;
    this.logger = config.logger;
    this.statusFilePath = join(config.plansDir, 'plan-status.json');
  }

  async checkApproval(planId: string): Promise<boolean> {
    const statusFile = await this.loadStatusFile();
    const planStatus = statusFile.plans[planId];

    if (!planStatus) {
      this.logger?.warn('Plan not found', { planId });
      return false;
    }

    const isApproved = planStatus.status === 'approved' && !!planStatus.approvedAt;

    this.logger?.debug('Approval check', {
      planId,
      isApproved,
      status: planStatus.status,
    });

    return isApproved;
  }

  async requireApproval(planId: string): Promise<void> {
    const isApproved = await this.checkApproval(planId);

    if (!isApproved) {
      throw new Error(
        `Plan '${planId}' is not approved. Please approve the plan first using /approve-plan.`
      );
    }
  }

  async approve(planId: string, approvedBy: string = 'user'): Promise<void> {
    this.logger?.info('Approving plan', { planId, approvedBy });

    const statusFile = await this.loadStatusFile();
    const planStatus = statusFile.plans[planId];

    if (!planStatus) {
      throw new Error(`Plan '${planId}' not found.`);
    }

    const now = new Date().toISOString();

    statusFile.plans[planId] = {
      ...planStatus,
      status: 'approved',
      updatedAt: now,
      approvedAt: now,
      approvedBy,
    };

    await this.saveStatusFile(statusFile);

    this.logger?.info('Plan approved successfully', { planId });
  }

  async reject(planId: string, reason: string): Promise<void> {
    this.logger?.info('Rejecting plan', { planId, reason });

    const statusFile = await this.loadStatusFile();
    const planStatus = statusFile.plans[planId];

    if (!planStatus) {
      throw new Error(`Plan '${planId}' not found.`);
    }

    const now = new Date().toISOString();

    statusFile.plans[planId] = {
      ...planStatus,
      status: 'rejected',
      updatedAt: now,
      rejectedAt: now,
      rejectedReason: reason,
    };

    await this.saveStatusFile(statusFile);

    this.logger?.info('Plan rejected', { planId });
  }

  async createPlanStatus(planId: string): Promise<void> {
    const statusFile = await this.loadStatusFile();
    const now = new Date().toISOString();

    statusFile.plans[planId] = {
      id: planId,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
    };

    if (!statusFile.currentPlan) {
      statusFile.currentPlan = planId;
    }

    await this.saveStatusFile(statusFile);

    this.logger?.info('Plan status created', { planId });
  }

  async getPlanStatus(planId: string): Promise<PlanStatus | null> {
    const statusFile = await this.loadStatusFile();
    return statusFile.plans[planId] || null;
  }

  async getCurrentPlanId(): Promise<string | null> {
    const statusFile = await this.loadStatusFile();
    return statusFile.currentPlan;
  }

  private async loadStatusFile(): Promise<PlanStatusFile> {
    try {
      if (!existsSync(this.statusFilePath)) {
        // Create default status file
        const defaultStatus: PlanStatusFile = {
          version: '1.0.0',
          currentPlan: null,
          plans: {},
        };

        await this.saveStatusFile(defaultStatus);
        return defaultStatus;
      }

      const content = await readFile(this.statusFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger?.error('Failed to load status file', { error });
      throw error;
    }
  }

  private async saveStatusFile(statusFile: PlanStatusFile): Promise<void> {
    try {
      // Ensure directory exists
      if (!existsSync(this.plansDir)) {
        await mkdir(this.plansDir, { recursive: true });
      }

      const content = JSON.stringify(statusFile, null, 2);
      await writeFile(this.statusFilePath, content, 'utf-8');

      this.logger?.debug('Status file saved', { path: this.statusFilePath });
    } catch (error) {
      this.logger?.error('Failed to save status file', { error });
      throw error;
    }
  }
}
