import { Injectable } from '@angular/core';
import { distinctUntilChanged, from, shareReplay } from "rxjs";
import { NgxDeviceInfoService } from "ngx-device-info";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(private readonly deviceInfoService: NgxDeviceInfoService) {
  }

  deviceInfo$ = from(this.deviceInfoService.getDeviceInfo())
    .pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      shareReplay(1)
    );
}
