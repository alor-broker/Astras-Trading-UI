/**
 * Device-based visibility rule for widget settings groups and fields.
 * Allows declaring, in a single unified way, whether a group/field is shown on
 * all devices, only on desktop or only on mobile.
 */
export enum SettingsDeviceVisibility {
  All = 'all',
  DesktopOnly = 'desktopOnly',
  MobileOnly = 'mobileOnly'
}
