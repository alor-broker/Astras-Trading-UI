import {
  inject,
  Injectable
} from '@angular/core';
import {
  map,
  Observable,
  of,
  shareReplay
} from 'rxjs';
import {DeviceDetectorService,} from 'ngx-device-detector';
import {
  DeviceInfo,
  DeviceType
} from './device-service-types';
import {Capacitor} from '@capacitor/core';

@Injectable({providedIn: 'root'})
export class DeviceService {
  private readonly deviceDetectorService = inject(DeviceDetectorService);

  deviceInfo$: Observable<DeviceInfo> = of(this.deviceDetectorService).pipe(
    map(deviceDetectorService => {
      const isMobile = deviceDetectorService.isMobile() || deviceDetectorService.isTablet() || Capacitor.isNativePlatform();
      let deviceType = isMobile ? DeviceType.Mobile : DeviceType.Desktop;
      if (Capacitor.isNativePlatform()) {
        deviceType = DeviceType.MobileNative;
      }

      return {
        isMobile,
        deviceType,
        userAgent: deviceDetectorService.getDeviceInfo().userAgent ?? ''
      };
    }),
    shareReplay(1)
  );
}
