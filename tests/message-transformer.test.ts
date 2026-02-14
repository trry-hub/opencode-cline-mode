import { describe, it, expect } from 'vitest';
import { transformMessages } from '../src/message-transformer';
import type { TransformOutput } from '../src/types';

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
      expect(text).toContain('/start-act');
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

      transformMessages(output, {});

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('/start-act');
    });
  });
});
