export class ArrayHelper {
  static lastOrNull<T>(source: T[]): T | null {
    if (source.length === 0) {
      return null;
    }
    return source[source.length - 1];
  }

  static firstOrNull<T>(source: T[]): T | null {
    if (source.length === 0) {
      return null;
    }
    return source[0];
  }
}
