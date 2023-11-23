import {Inject, Injectable} from "@angular/core";
import {AppHook} from "./app-hook-token";
import {take} from "rxjs";
import {DeviceService} from "../device.service";
import {filter} from "rxjs/operators";
import {DOCUMENT} from "@angular/common";

@Injectable()
export class MobileHook implements AppHook {
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
