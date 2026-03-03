export enum DeviceType {
  Desktop = 'desktop',
  Mobile = 'mobile',
  MobileNative = 'mobileNative'
}

export interface DeviceInfo {
  isMobile: boolean;
  deviceType: DeviceType;
  userAgent: string;
}
