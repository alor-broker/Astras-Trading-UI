export class PushLogsFormatHelper {
  static formatLogMessage(message: string): string {
    return `[Push]: ${message}`;
  }
}
