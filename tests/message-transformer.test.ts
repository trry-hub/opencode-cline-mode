/**
 * Unit tests for message-transformer
 */

import { describe, it, expect } from 'vitest';
import { transformMessages } from '../src/message-transformer.js';
import type { ChatMessage, TransformOutput } from '../src/types.js';

describe('Message Transformer', () => {
  it('should handle empty messages', () => {
    const output: TransformOutput = { messages: [] };
    transformMessages(output);
    expect(output.messages).toHaveLength(0);
  });

  it('should add plan completion block to last cline-plan message', () => {
    const output: TransformOutput = {
      messages: [
        {
          info: { role: 'assistant', agent: 'cline-plan' },
          parts: [{ type: 'text', text: 'Here is the plan...' }],
        },
      ],
    };

    transformMessages(output);

    const lastPart = output.messages[0].parts[0];
    expect(lastPart.type).toBe('text');
    expect(lastPart.text).toContain('📋 Plan Complete!');
  });

  it('should inject plan into first cline-act message', () => {
    const output: TransformOutput = {
      messages: [
        {
          info: { role: 'assistant', agent: 'cline-plan' },
          parts: [{ type: 'text', text: 'Plan content here' }],
        },
        {
          info: { role: 'assistant', agent: 'cline-act' },
          parts: [{ type: 'text', text: 'Starting execution...' }],
        },
      ],
    };

    transformMessages(output);

    const actMessage = output.messages[1];
    const injectedPart = actMessage.parts[0];
    expect(injectedPart.type).toBe('text');
    expect(injectedPart.text).toContain('📋 **Inherited Plan from cline-plan**');
  });

  it('should not inject plan twice', () => {
    const output: TransformOutput = {
      messages: [
        {
          info: { role: 'assistant', agent: 'cline-plan' },
          parts: [{ type: 'text', text: 'Plan content' }],
        },
        {
          info: { role: 'assistant', agent: 'cline-act' },
          parts: [
            { type: 'text', text: '📋 **Inherited Plan from cline-plan**\n\nExisting plan...' },
            { type: 'text', text: 'Starting execution...' },
          ],
        },
      ],
    };

    transformMessages(output);

    const actMessage = output.messages[1];
    const planCount = actMessage.parts.filter(
      (p) => p.type === 'text' && p.text?.includes('📋 **Inherited Plan from cline-plan**')
    ).length;

    expect(planCount).toBe(1);
  });
});
