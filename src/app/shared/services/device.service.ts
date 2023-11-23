import { Injectable } from '@angular/core';
import { from, shareReplay, map } from "rxjs";
import { NgxDeviceInfoService } from "ngx-device-info";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(private readonly deviceInfoService: NgxDeviceInfoService) {
  }

  deviceInfo$ = from(this.deviceInfoService.getDeviceInfo())
    .pipe(
      map(info => ({...info, isMobile: (info.isMobile || info.isTablet) as boolean}) as { [propName: string]: any, isMobile: boolean }),
      shareReplay(1)
    );
}
