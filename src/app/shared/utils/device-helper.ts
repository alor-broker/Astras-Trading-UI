export const mobileBreakpoint = 550;

export class DeviceHelper {
  static isSafari(): boolean {
    const ua = navigator.userAgent;
    // Check for Safari and exclude other iOS browsers
    return (
      /Safari/.test(ua) &&
      !/(Chrome|CriOS|Edg|FxiOS|Firefox|Opera|OPR)/.test(ua) &&
      // Optional: Ensure it's not a different WebKit-based iOS browser
      !/^((?!AppleWebKit).)*$/.test(ua)
    );
  }
}
