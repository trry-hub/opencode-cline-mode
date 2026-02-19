import { describe, it, expect, vi } from 'vitest';
import { transformMessages } from '../src/message-transformer';
import type { TransformOutput } from '../src/types';
import type { Logger } from '../src/logger';

const createMockLogger = (): Logger =>
  ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }) as unknown as Logger;

describe('message-transformer-enhanced', () => {
  describe('Approval Feature Integration', () => {
    it('should include approval hint when enabled', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan created' }],
          },
        ],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger, enablePlanApproval: true });

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('/approve-plan');
      expect(text).toContain('Approval Required');
    });

    it('should not include approval hint when disabled', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan created' }],
          },
        ],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger, enablePlanApproval: false });

      const text = output.messages[0].parts[0].text;
      expect(text).not.toContain('/approve-plan');
      expect(text).not.toContain('Approval Required');
    });

    it('should include approval hint by default', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan content' }],
          },
        ],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger });

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('/approve-plan');
    });
  });
});
