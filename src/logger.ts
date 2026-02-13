import type { LogBody, PluginContext } from './types';

export class Logger {
  private client: PluginContext['client'];
  private service: string = 'opencode-cline-mode';

  constructor(client: PluginContext['client']) {
    this.client = client;
  }

  async info(message: string, extra?: Record<string, unknown>): Promise<void> {
    await this.log('info', message, extra);
  }

  async warn(message: string, extra?: Record<string, unknown>): Promise<void> {
    await this.log('warn', message, extra);
  }

  async error(message: string, extra?: Record<string, unknown>): Promise<void> {
    await this.log('error', message, extra);
  }

  async debug(message: string, extra?: Record<string, unknown>): Promise<void> {
    await this.log('debug', message, extra);
  }

  private async log(
    level: LogBody['level'],
    message: string,
    extra?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.client.app.log({
        body: {
          service: this.service,
          level,
          message,
          extra,
        },
      });
    } catch (error) {
      console.error(`[${this.service}] Failed to log:`, error);
    }
  }
}
