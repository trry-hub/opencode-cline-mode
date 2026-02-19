import type { LogBody, PluginContext } from './types';

export class Logger {
  private client: PluginContext['client'];
  private service: string = 'opencode-cline-mode';

  constructor(client: PluginContext['client']) {
    this.client = client;
  }

  info(message: string, extra?: Record<string, unknown>): void {
    this.log('info', message, extra);
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    this.log('warn', message, extra);
  }

  error(message: string, extra?: Record<string, unknown>): void {
    this.log('error', message, extra);
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    this.log('debug', message, extra);
  }

  private log(level: LogBody['level'], message: string, extra?: Record<string, unknown>): void {
    // Fire-and-forget: 不等待日志完成
    this.client.app
      .log({
        body: {
          service: this.service,
          level,
          message,
          extra,
        },
      })
      .catch(error => {
        console.error(`[${this.service}] Failed to log:`, error);
      });
  }
}
