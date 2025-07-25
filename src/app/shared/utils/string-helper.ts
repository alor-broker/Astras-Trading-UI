export class StringHelper {
  static getSimpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  static getPascalCase(input: string): string {
    return input.split(/[\s-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  static isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null
      || value.length === 0;
  }
}
