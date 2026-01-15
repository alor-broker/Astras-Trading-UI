import { Injectable, inject } from "@angular/core";
import {
  shareReplay,
  Subscription
} from "rxjs";
import {
  filter,
  switchMap
} from "rxjs/operators";
import {
  USER_CONTEXT,
  UserContext
} from "../../auth/user-context";
import { DeviceService } from "../../device.service";
import { LocalStorageService } from "../../local-storage.service";
import { AreaHook } from "./area-hook-token";
import { LocalStorageLoggingConstants } from "../../../constants/local-storage.constants";
import { ReleaseMeta } from "../../../../modules/application-meta/models/application-release.model";
import { ApplicationMetaService } from "../../../../modules/application-meta/services/application-meta.service";

@Injectable()
export class LoggingHook implements AreaHook {
  private readonly userContext = inject<UserContext>(USER_CONTEXT);
  private readonly applicationMetaService = inject(ApplicationMetaService);
  private readonly deviceService = inject(DeviceService);
  private readonly localStorageService = inject(LocalStorageService);

  private readonly tearDown = new Subscription();

  onDestroy(): void {
    this.tearDown.unsubscribe();
  }

  onInit(): void {
    const currentUser$ = this.userContext.getUser().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.tearDown.add(
      currentUser$.subscribe(user => {
        this.localStorageService.setItem(LocalStorageLoggingConstants.UserLoginStorageKey, user.login ?? '');
        this.localStorageService.setItem(LocalStorageLoggingConstants.ClientIdStorageKey, user.clientId ?? '');
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
