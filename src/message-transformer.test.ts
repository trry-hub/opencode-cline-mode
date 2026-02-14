import { describe, it, expect } from 'vitest';
import { transformMessages } from './message-transformer';
import type { TransformOutput } from './types';

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
      expect(text).toContain('/execute-plan');
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
      expect(text).toBeDefined();
      expect(text?.match(/<system-reminder>/g)).toHaveLength(1);
    });

    it('should handle empty messages array', () => {
      const output: TransformOutput = { messages: [] };

      expect(() => transformMessages(output)).not.toThrow();
    });

    it('should inject inherited plan when switching from cline-plan to cline-act', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan step 1\nPlan step 2' }],
          },
          {
            info: { role: 'user', agent: 'cline-act' },
            parts: [{ type: 'text', text: 'Start execution' }],
          },
          {
            info: { role: 'assistant', agent: 'cline-act' },
            parts: [{ type: 'text', text: 'I will execute' }],
          },
        ],
      };

      transformMessages(output);

      const lastActMessage = output.messages[2];
      expect(lastActMessage.parts[0].text).toContain('📋 **Inherited Plan from cline-plan**');
      expect(lastActMessage.parts[0].text).toContain('Plan step 1');
      expect(lastActMessage.parts[0].text).toContain('Plan step 2');
    });

    it('should not duplicate plan injection', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan content' }],
          },
          {
            info: { role: 'assistant', agent: 'cline-act' },
            parts: [
              { type: 'text', text: '📋 **Inherited Plan from cline-plan**\n\nPlan content' },
            ],
          },
        ],
      };

      transformMessages(output);

      const text = output.messages[1].parts[0].text;
      expect(text).toBeDefined();
      expect(text?.match(/📋 \*\*Inherited Plan/g)).toHaveLength(1);
    });

    it('should not inject plan when no prior cline-plan message exists', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'user', agent: 'cline-act' },
            parts: [{ type: 'text', text: 'Start' }],
          },
          {
            info: { role: 'assistant', agent: 'cline-act' },
            parts: [{ type: 'text', text: 'Executing' }],
          },
        ],
      };

      transformMessages(output);

      const text = output.messages[1].parts[0].text;
      expect(text).not.toContain('📋 **Inherited Plan');
    });
  });

  describe('transformMessages with enableExecuteCommand option', () => {
    it('should show /execute-plan when enableExecuteCommand is true', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan content' }],
          },
        ],
      };

      transformMessages(output, { enableExecuteCommand: true });

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('/execute-plan');
      expect(text).toContain('📋 Plan Complete!');
    });

    it('should not show /execute-plan when enableExecuteCommand is false', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan content' }],
          },
        ],
      };

      transformMessages(output, { enableExecuteCommand: false });

      const text = output.messages[0].parts[0].text;
      expect(text).not.toContain('/execute-plan');
      expect(text).toContain('Tab');
      expect(text).toContain('📋 Plan Complete!');
    });

    it('should use default value (true) when options is undefined', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan content' }],
          },
        ],
      };

      transformMessages(output);

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('/execute-plan');
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
      expect(text).toContain('/execute-plan');
    });
  });
});
