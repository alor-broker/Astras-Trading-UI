import { Injectable } from '@angular/core';
import { from, shareReplay } from "rxjs";
import { NgxDeviceInfoService } from "ngx-device-info";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(private readonly deviceInfoService: NgxDeviceInfoService) {
  }

  deviceInfo$ = from(this.deviceInfoService.getDeviceInfo())
    .pipe(
      shareReplay(1)
    );
}
