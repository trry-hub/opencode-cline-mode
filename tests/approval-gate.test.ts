import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { ApprovalGate } from '../src/approval-gate';

describe('ApprovalGate', () => {
  const testPlansDir = join(__dirname, '.test-approval-plans');
  let approvalGate: ApprovalGate;

  beforeEach(async () => {
    approvalGate = new ApprovalGate({ plansDir: testPlansDir });
    // Clean up test directory
    if (existsSync(testPlansDir)) {
      await rm(testPlansDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testPlansDir)) {
      await rm(testPlansDir, { recursive: true });
    }
  });

  it('should create plan status', async () => {
    const planId = 'plan-2026-02-15-001';
    await approvalGate.createPlanStatus(planId);

    const status = await approvalGate.getPlanStatus(planId);
    expect(status).not.toBeNull();
    expect(status?.id).toBe(planId);
    expect(status?.status).toBe('draft');
  });

  it('should check approval status for draft plan', async () => {
    const planId = 'plan-2026-02-15-001';
    await approvalGate.createPlanStatus(planId);

    const isApproved = await approvalGate.checkApproval(planId);
    expect(isApproved).toBe(false);
  });

  it('should approve a plan', async () => {
    const planId = 'plan-2026-02-15-001';
    await approvalGate.createPlanStatus(planId);

    await approvalGate.approve(planId, 'test-user');

    const isApproved = await approvalGate.checkApproval(planId);
    expect(isApproved).toBe(true);

    const status = await approvalGate.getPlanStatus(planId);
    expect(status?.status).toBe('approved');
    expect(status?.approvedBy).toBe('test-user');
    expect(status?.approvedAt).toBeDefined();
  });

  it('should reject a plan', async () => {
    const planId = 'plan-2026-02-15-001';
    await approvalGate.createPlanStatus(planId);

    await approvalGate.reject(planId, 'Plan is incomplete');

    const status = await approvalGate.getPlanStatus(planId);
    expect(status?.status).toBe('rejected');
    expect(status?.rejectedReason).toBe('Plan is incomplete');
    expect(status?.rejectedAt).toBeDefined();
  });

  it('should require approval and throw if not approved', async () => {
    const planId = 'plan-2026-02-15-001';
    await approvalGate.createPlanStatus(planId);

    await expect(approvalGate.requireApproval(planId)).rejects.toThrow(
      'is not approved'
    );
  });

  it('should require approval and pass if approved', async () => {
    const planId = 'plan-2026-02-15-001';
    await approvalGate.createPlanStatus(planId);
    await approvalGate.approve(planId, 'test-user');

    // Should not throw
    await expect(approvalGate.requireApproval(planId)).resolves.not.toThrow();
  });

  it('should return null for non-existent plan', async () => {
    const status = await approvalGate.getPlanStatus('non-existent-plan');
    expect(status).toBeNull();
  });

  it('should return false for non-existent plan approval check', async () => {
    const isApproved = await approvalGate.checkApproval('non-existent-plan');
    expect(isApproved).toBe(false);
  });

  it('should set first plan as current plan', async () => {
    const planId = 'plan-2026-02-15-001';
    await approvalGate.createPlanStatus(planId);

    const currentPlanId = await approvalGate.getCurrentPlanId();
    expect(currentPlanId).toBe(planId);
  });

  it('should create status file if it does not exist', async () => {
    expect(existsSync(join(testPlansDir, 'plan-status.json'))).toBe(false);

    await approvalGate.createPlanStatus('plan-2026-02-15-001');

    expect(existsSync(join(testPlansDir, 'plan-status.json'))).toBe(true);
  });
});
