// Test script to debug message transformation
// Run with: bun test test-debug.ts

import type { TransformOutput } from './src/types';

const mockMessages: TransformOutput = {
  messages: [
    {
      info: {
        role: 'user',
        agent: 'cline-plan',
      },
      parts: [
        {
          type: 'text',
          text: 'Create a hello world app',
        },
      ],
    },
    {
      info: {
        role: 'assistant',
        agent: 'cline-plan',
      },
      parts: [
        {
          type: 'text',
          text: 'I will help you create a hello world app.\n\nSteps:\n1. Create index.js\n2. Add console.log',
        },
      ],
    },
  ],
};

async function testTransform() {
  const { transformMessages } = await import('./src/message-transformer.js');

  console.log('\n=== Before Transform ===');
  console.log('Messages:', mockMessages.messages.length);
  console.log('Last message:', {
    role: mockMessages.messages[mockMessages.messages.length - 1].info?.role,
    agent: mockMessages.messages[mockMessages.messages.length - 1].info?.agent,
    parts: mockMessages.messages[mockMessages.messages.length - 1].parts?.length,
  });

  transformMessages(mockMessages, { enableExecuteCommand: true });

  console.log('\n=== After Transform ===');
  const lastMessage = mockMessages.messages[mockMessages.messages.length - 1];
  const lastPart = lastMessage.parts?.[lastMessage.parts.length - 1];

  if (lastPart?.type === 'text') {
    const hasCompletionBlock = lastPart.text?.includes('📋 Plan Complete!');
    console.log('Has completion block:', hasCompletionBlock);
    console.log('Last part text length:', lastPart.text?.length);
    console.log('\nLast part text:');
    console.log(lastPart.text);
  }
}

testTransform().catch(console.error);
