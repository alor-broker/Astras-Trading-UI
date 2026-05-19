import {
  inject,
  Injectable
} from "@angular/core";
import {
  shareReplay,
  Subscription
} from "rxjs";
import {
  filter,
  switchMap
} from "rxjs/operators";
import {Hook} from '../../../common/types/hook.types';
import {USER_CONTEXT} from '../../user-context/user-context.types';
import {DeviceService} from '../../../common/services/device.service';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {LocalStorageLoggingConstants} from '../../local-storage/local-storage.constants';
import {AppReleaseService} from '../../app-releases/services/app-release.service';
import {ReleaseMeta} from '../../app-releases/services/app-releases-service.types';

@Injectable()
export class LoggingHook implements Hook {
  private readonly userContext = inject(USER_CONTEXT);

  private readonly appReleaseService = inject(AppReleaseService);

  private readonly deviceService = inject(DeviceService);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly tearDown = new Subscription();

  onDestroy(): void {
    this.tearDown.unsubscribe();
  }

  onInit(): void {
    const currentUser$ = this.userContext.getUser().pipe(
      shareReplay({bufferSize: 1, refCount: true})
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
        switchMap(() => this.appReleaseService.getCurrentVersion()),
        filter((x): x is ReleaseMeta => !!x)
      ).subscribe(releaseMeta => {
        this.localStorageService.setItem(LocalStorageLoggingConstants.AppVersionStorageKey, releaseMeta.id);
      })
    );

    this.tearDown.add(
      this.deviceService.deviceInfo$.subscribe(deviceInfo => {
        this.localStorageService.setItem(
          LocalStorageLoggingConstants.DeviceStorageKey,
          deviceInfo.deviceType
        );

        this.localStorageService.setItem(
          LocalStorageLoggingConstants.BrowserStorageKey,
          deviceInfo.userAgent ?? ''
        );
      })
    );
  }
}
