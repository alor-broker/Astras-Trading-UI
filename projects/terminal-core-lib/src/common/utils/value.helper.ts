export class ValueHelper {
  /**
   * @param value value to check
   * @param defaultValue default value
   *
   * @returns source value if not null or default value
   */
  static getValueOrDefault<T>(value: T | null, defaultValue: T): T {
    return value ?? defaultValue;
  }
}
