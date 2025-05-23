export class TestingHelpers {
  /**
   * Create random string
   * @param length target string length
   * @returns random string
   */
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let str = '';
    for (let i = 0; i < length; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
  }

  /**
   * Getting a random integer between two values
   * @param min minimum value
   * @param max maximum value
   * @returns the value is no lower than min (or the next integer greater than min if min isn't an integer), and is less than (but not equal to) max
   */
  static getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }
}
