import { describe, it, expect } from 'vitest';
import { transformMessages } from './message-transformer';
import type { ChatMessage, TransformOutput } from './types';

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

      transformMessages(output);

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('<system-reminder>');
      expect(text).toContain('Tab');
      expect(text).toContain('cline-act');
    });

    it('should not modify non-cline-plan messages', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-act' },
            parts: [{ type: 'text', text: 'Executing' }],
          },
        ],
      };

      transformMessages(output);

      expect(output.messages[0].parts[0].text).toBe('Executing');
    });

    it('should not duplicate reminders', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan\n<system-reminder>already added' }],
          },
        ],
      };

      transformMessages(output);

      const text = output.messages[0].parts[0].text;
      expect(text.match(/<system-reminder>/g)).toHaveLength(1);
    });

    it('should handle empty messages array', () => {
      const output: TransformOutput = { messages: [] };

      expect(() => transformMessages(output)).not.toThrow();
    });
  });
});
