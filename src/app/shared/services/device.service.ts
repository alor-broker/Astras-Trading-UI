import { Injectable } from '@angular/core';
import { from, shareReplay, map, Observable } from "rxjs";
import { NgxDeviceInfoService } from "ngx-device-info";

interface DeviceInfo {
  isMobile: boolean;
}

interface NativeDeviceInfo extends DeviceInfo {
  isTablet: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(private readonly deviceInfoService: NgxDeviceInfoService) {
  }

  deviceInfo$: Observable<DeviceInfo> = from<Promise<NativeDeviceInfo>>(this.deviceInfoService.getDeviceInfo())
    .pipe(
      map(info => ({ isMobile: info.isMobile || info.isTablet })),
      shareReplay(1)
    );
}
