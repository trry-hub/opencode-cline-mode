/**
 * Mock utilities for testing
 */

import type { PluginContext, LogBody, EventBody } from "../../src/types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

let tempDirs: string[] = [];

/**
 * Create a mock PluginContext for testing
 */
export function createMockPluginContext(
  overrides?: Partial<PluginContext>,
): PluginContext {
  const logs: LogBody[] = [];
  const events: EventBody[] = [];

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cline-plugin-test-"));
  tempDirs.push(tempDir);

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
      name: "test-project",
    },
    directory: tempDir,
    worktree: undefined,
    $: {},
    ...overrides,
  };
}

/**
 * Get captured logs from mock context
 */
export function getMockLogs(context: PluginContext): LogBody[] {
  return (
    (context.client.app.log as unknown as { __logs?: LogBody[] }).__logs || []
  );
}

/**
 * Get captured events from mock context
 */
export function getMockEvents(context: PluginContext): EventBody[] {
  return (
    (context.client.app.event as unknown as { __events?: EventBody[] })
      .__events || []
  );
}

/**
 * Cleanup all temp directories (call in afterEach)
 */
export function cleanupTempDirs(): void {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
  tempDirs = [];
}
