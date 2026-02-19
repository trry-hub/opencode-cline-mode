import { describe, it, expect, vi } from 'vitest';
import { transformMessages } from '../src/message-transformer';
import type { TransformOutput } from '../src/types';
import type { Logger } from '../src/logger';

// Mock logger
const createMockLogger = (): Logger =>
  ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }) as unknown as Logger;

describe('message-transformer', () => {
  describe('transformMessages', () => {
    it('should add system-reminder to cline-plan messages', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan created' }],
          },
        ],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger });

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('/start-act');
      expect(logger.info).toHaveBeenCalledWith(
        '✅ SUCCESS: Added plan completion block',
        expect.objectContaining({
          messageIndex: 0,
        })
      );
    });

    it('should use default value (true) when enableExecuteCommand is undefined', () => {
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
      expect(text).toContain('/start-act');
    });

    it('should log when no messages to transform', () => {
      const output: TransformOutput = {
        messages: [],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger });

      expect(logger.warn).toHaveBeenCalledWith('No messages to transform', expect.any(Object));
    });

    it('should log when skipping due to existing completion block', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan with 📋 Plan Complete! marker' }],
          },
        ],
      };

      const logger = createMockLogger();
      transformMessages(output, { logger });

      expect(logger.debug).toHaveBeenCalledWith(
        'Found existing plan completion block',
        expect.objectContaining({ messageIndex: 0 })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        '❌ SKIPPED: Did not add completion block',
        expect.objectContaining({
          hasPlanMessage: true,
          hasEncounteredReminder: true,
        })
      );
    });
  });
});
