import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { PlanManager } from '../src/plan-manager';

describe('PlanManager Simple Tests', () => {
  const testPlansDir = join(__dirname, '.test-plans-simple');
  let planManager: PlanManager;

  beforeEach(async () => {
    planManager = new PlanManager({ plansDir: testPlansDir });
    if (existsSync(testPlansDir)) {
      await rm(testPlansDir, { recursive: true });
    }
  });

  afterEach(async () => {
    if (existsSync(testPlansDir)) {
      await rm(testPlansDir, { recursive: true });
    }
  });

  it('should generate unique plan IDs with delay', async () => {
    const id1 = planManager.generatePlanId();
    await new Promise(r => setTimeout(r, 2));
    const id2 = planManager.generatePlanId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^plan-\d{4}-\d{2}-\d{2}-\d+$/);
    expect(id2).toMatch(/^plan-\d{4}-\d{2}-\d{2}-\d+$/);
  });
});
