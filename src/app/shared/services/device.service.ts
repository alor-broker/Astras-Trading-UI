import { Injectable, inject } from '@angular/core';
import {
  map,
  Observable,
  of,
  shareReplay
} from "rxjs";
import { DeviceInfo } from "../models/device-info.model";
import { DeviceDetectorService } from "ngx-device-detector";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly deviceDetectorService = inject(DeviceDetectorService);

  deviceInfo$: Observable<DeviceInfo> = of(this.deviceDetectorService).pipe(
    map(deviceDetectorService => {
      return {
        isMobile: deviceDetectorService.isMobile() || deviceDetectorService.isTablet(),
        userAgent: deviceDetectorService.getDeviceInfo().userAgent ?? ''
      };
    }),
    shareReplay(1)
  );
}
