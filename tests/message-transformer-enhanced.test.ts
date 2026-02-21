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
  describe('Plan Completion Block (Cline-aligned)', () => {
    it('should include plan completion block with execute hint', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan created' }],
          },
        ],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger, enableExecuteCommand: true });

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('Plan Complete');
      expect(text).toContain('/start-act');
      expect(text).not.toContain('/approve-plan');
    });

    it('should not include approval hint (removed for Cline alignment)', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan created' }],
          },
        ],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger, enableExecuteCommand: true });

      const text = output.messages[0].parts[0].text;
      expect(text).not.toContain('/approve-plan');
      expect(text).not.toContain('Approval Required');
    });

    it('should show Tab hint when execute command is disabled', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan content' }],
          },
        ],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger, enableExecuteCommand: false });

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('Press Tab to switch to cline-act');
    });
  });
});
