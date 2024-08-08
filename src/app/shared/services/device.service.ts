import { Injectable } from '@angular/core';
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
  deviceInfo$: Observable<DeviceInfo> = of(this.deviceDetectorService).pipe(
    map(deviceDetectorService => {
      return {
        isMobile: deviceDetectorService.isMobile() || deviceDetectorService.isTablet(),
        userAgent: deviceDetectorService.getDeviceInfo().userAgent ?? ''
      };
    }),
    shareReplay(1)
  );

  constructor(private readonly deviceDetectorService: DeviceDetectorService) {
  }
}
