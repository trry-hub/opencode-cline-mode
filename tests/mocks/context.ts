/**
 * Mock utilities for testing
 */

import type { PluginContext, LogBody, EventBody } from '../src/types.js';

/**
 * Create a mock PluginContext for testing
 */
export function createMockPluginContext(overrides?: Partial<PluginContext>): PluginContext {
  const logs: LogBody[] = [];
  const events: EventBody[] = [];

  return {
    client: {
      app: {
        log: async (params: { body: LogBody }) => {
          logs.push(params.body);
        },
        event: async (params: { body: EventBody }) => {
          events.push(params.body);
        },
      },
    },
    project: {
      name: 'test-project',
    },
    directory: '/test/directory',
    worktree: undefined,
    $: {},
    ...overrides,
  };
}

/**
 * Get captured logs from mock context
 */
export function getMockLogs(context: PluginContext): LogBody[] {
  // This is a hack for testing - in real usage logs are private
  return (context.client.app.log as unknown as { __logs?: LogBody[] }).__logs || [];
}

/**
 * Get captured events from mock context
 */
export function getMockEvents(context: PluginContext): EventBody[] {
  // This is a hack for testing - in real usage events are private
  return (context.client.app.event as unknown as { __events?: EventBody[] }).__events || [];
}
