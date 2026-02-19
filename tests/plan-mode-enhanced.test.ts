import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Plan Mode Enhanced Features', () => {
  const planPromptPath = join(__dirname, '../prompts/plan.md');
  const planPrompt = readFileSync(planPromptPath, 'utf-8');

  it('should include deep planning mode section', () => {
    expect(planPrompt).toContain('## Deep Planning Mode');
    expect(planPrompt).toContain('/deep-planning');
    expect(planPrompt).toContain('implementation_plan.md');
  });

  it('should define tool whitelist for plan mode', () => {
    expect(planPrompt).toContain('## Tools Available in PLAN MODE');
    expect(planPrompt).toContain('### Read-Only Tools (Allowed)');
    expect(planPrompt).toContain('### Write Tools (Restricted - Whitelist Only)');
    expect(planPrompt).toContain('implementation_plan.md');
    expect(planPrompt).toContain('.opencode/plans/*.md');
  });

  it('should include approval workflow section', () => {
    expect(planPrompt).toContain('## Plan Approval Workflow');
    expect(planPrompt).toContain('### Step 3: Approval Required');
    expect(planPrompt).toContain('/approve-plan');
  });

  it('should mention approval requirement in completion section', () => {
    expect(planPrompt).toContain('**Approval Required**');
    expect(planPrompt).toContain('/approve-plan');
  });

  it('should list prohibited tools', () => {
    expect(planPrompt).toContain('### Prohibited Tools');
    expect(planPrompt).toContain('❌ **write**');
    expect(planPrompt).toContain('❌ **edit**');
    expect(planPrompt).toContain('❌ **bash**');
  });

  it('should include LSP tools in allowed list', () => {
    expect(planPrompt).toContain('lsp_*');
    expect(planPrompt).toContain('ast_grep_search');
  });
});
