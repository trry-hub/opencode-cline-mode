/**
 * Basic smoke test to verify test infrastructure
 */
import { describe, it, expect } from 'vitest';
import { createMockPluginContext } from './mocks/context.js';

describe('Test Infrastructure', () => {
  it('should create mock plugin context', () => {
    const context = createMockPluginContext();
    
    expect(context).toBeDefined();
    expect(context.client).toBeDefined();
    expect(context.client.app).toBeDefined();
    expect(context.project.name).toBe('test-project');
  });

  it('should allow context overrides', () => {
    const context = createMockPluginContext({
      project: { name: 'custom-project' },
      directory: '/custom/path',
    });
    
    expect(context.project.name).toBe('custom-project');
    expect(context.directory).toBe('/custom/path');
  });

  it('should capture log calls', async () => {
    const context = createMockPluginContext();
    
    await context.client.app.log({
      body: {
        service: 'test',
        level: 'info',
        message: 'Test log',
      },
    });
    
    // If we got here without errors, the mock works
    expect(true).toBe(true);
  });

  it('should capture event calls', async () => {
    const context = createMockPluginContext();
    
    await context.client.app.event({
      body: {
        type: 'test.event',
        properties: { foo: 'bar' },
      },
    });
    
    // If we got here without errors, the mock works
    expect(true).toBe(true);
  });
});
