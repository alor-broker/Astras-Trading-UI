import {Inject, Injectable, DOCUMENT} from "@angular/core";
import {take} from "rxjs";
import {filter} from "rxjs/operators";

import { AreaHook } from "./area-hook-token";
import { DeviceService } from "../../device.service";

@Injectable()
export class MobileHook implements AreaHook {
  constructor(
    private readonly deviceService: DeviceService,
    @Inject(DOCUMENT) private readonly document: Document) {
  }

  onDestroy(): void {
    return;
  }

  onInit(): void {
    this.deviceService.deviceInfo$.pipe(
      take(1),
      filter(info => info.isMobile as boolean)
    ).subscribe(() => {
      this.document.documentElement.classList.add('mobile');
    });
  }
}
