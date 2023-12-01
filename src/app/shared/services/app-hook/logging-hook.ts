import { Injectable } from "@angular/core";
import { AppHook } from "./app-hook-token";
import { AuthService } from "../auth.service";
import {
  shareReplay,
  Subscription
} from "rxjs";
import { LocalStorageService } from "../local-storage.service";
import { LocalStorageLoggingConstants } from "../../constants/local-storage.constants";
import { ApplicationMetaService } from "../../../modules/application-meta/services/application-meta.service";
import {
  filter,
  switchMap
} from "rxjs/operators";
import { ReleaseMeta } from "../../../modules/application-meta/models/application-release.model";
import { DeviceService } from "../device.service";

@Injectable()
export class LoggingHook implements AppHook {
  private readonly tearDown = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly deviceService: DeviceService,
    private readonly localStorageService: LocalStorageService,
  ) {
  }

  onDestroy(): void {
    this.tearDown.unsubscribe();
  }

  onInit(): void {
    const currentUser$ = this.authService.currentUser$.pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.tearDown.add(
      currentUser$.subscribe(user => {
        this.localStorageService.setItem(LocalStorageLoggingConstants.UserLoginStorageKey, user.login);
      })
    );

    this.tearDown.add(
      // start pipe from current user to prevent sending releases request before authorization is completed
      currentUser$.pipe(
        switchMap(() => this.applicationMetaService.getCurrentVersion()),
        filter((x): x is ReleaseMeta => !!x)
      ).subscribe(releaseMeta => {
        this.localStorageService.setItem(LocalStorageLoggingConstants.AppVersionStorageKey, releaseMeta.id);
      })
    );

    this.tearDown.add(
      this.deviceService.deviceInfo$.subscribe(deviceInfo => {
        this.localStorageService.setItem(
          LocalStorageLoggingConstants.DeviceStorageKey,
          deviceInfo.isMobile ? 'MOBILE' : 'DESKTOP'
        );

        this.localStorageService.setItem(
          LocalStorageLoggingConstants.BrowserStorageKey,
          deviceInfo.userAgent ?? ''
        );
      })
    );
  }

}
