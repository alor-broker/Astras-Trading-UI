import {SettingsDeviceVisibility} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-visibility.types';

export class SettingsDeviceVisibilityHelper {
  /**
   * Returns whether content with the given visibility rule should be rendered on
   * the current device.
   */
  static matches(visibility: SettingsDeviceVisibility, isMobile: boolean): boolean {
    switch (visibility) {
      case SettingsDeviceVisibility.DesktopOnly:
        return !isMobile;
      case SettingsDeviceVisibility.MobileOnly:
        return isMobile;
      case SettingsDeviceVisibility.All:
      default:
        return true;
    }
  }
}
