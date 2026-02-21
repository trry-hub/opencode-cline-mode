import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Plan Mode Features (Cline-aligned)', () => {
  const planPromptPath = join(__dirname, '../prompts/plan.md');
  const planPrompt = readFileSync(planPromptPath, 'utf-8');

  it('should be read-only - no whitelist write permissions', () => {
    expect(planPrompt).not.toContain('Whitelist Only');
    expect(planPrompt).not.toContain('implementation_plan.md');
    expect(planPrompt).not.toContain('.opencode/plans/*.md');
  });

  it('should NOT include deep planning mode section', () => {
    expect(planPrompt).not.toContain('## Deep Planning Mode');
    expect(planPrompt).not.toContain('/deep-planning');
  });

  it('should NOT include approval tools', () => {
    expect(planPrompt).not.toContain('/approve-plan');
    expect(planPrompt).not.toContain('/reject-plan');
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

  it('should define read-only tools only', () => {
    expect(planPrompt).toContain('## Tools Available in PLAN MODE');
    expect(planPrompt).toContain('### Read-Only Tools (Allowed)');
  });
});
