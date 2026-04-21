import {inject, Injectable} from '@angular/core';
import {map, Observable, of, shareReplay} from "rxjs";
import {DeviceInfo, DeviceType} from "../models/device-info.model";
import {DeviceDetectorService} from "ngx-device-detector";
import {Capacitor} from "@capacitor/core";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly deviceDetector = inject<DeviceDetectorService>(DeviceDetectorService);

  deviceInfo$: Observable<DeviceInfo> = of(this.deviceDetector).pipe(
    map(deviceDetector => {
      const deviceInfo = deviceDetector.getDeviceInfo();
      const isMobile = deviceDetector.isMobile() || deviceDetector.isTablet() || Capacitor.isNativePlatform();
      let deviceType = isMobile ? DeviceType.Mobile : DeviceType.Desktop;
      if(Capacitor.isNativePlatform()) {
        deviceType = DeviceType.MobileNative;
      }

      return {
        isMobile,
        deviceType,
        userAgent: deviceInfo.userAgent ?? ''
      };
    }),
    shareReplay(1)
  );
}
