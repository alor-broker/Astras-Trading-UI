import {
  inject,
  Injectable
} from '@angular/core';
import {
  SwUpdate,
  VersionReadyEvent
} from '@angular/service-worker';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {
  filter,
  Subscription,
  take
} from 'rxjs';
import {Hook} from '../../../common/types/hook.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';

@Injectable()
export class SwUpdateHook implements Hook {
  private readonly swUpdate = inject(SwUpdate, {optional: true});

  private readonly notificationService = inject(NzNotificationService);

  private readonly translatorService = inject(TranslatorService);

  private updateSub?: Subscription;

  onInit(): void {
    if (this.swUpdate == null || !this.swUpdate.isEnabled) {
      return;
    }

    this.updateSub = this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY')
      )
      .subscribe(() => {
        this.translatorService.getTranslator('').pipe(
          take(1)
        ).subscribe(translator => {
          const ref = this.notificationService.info(
            translator(['pwaUpdatedTitle'], {fallback: 'Update Available'}),
            translator(['pwaUpdatedMessage'], {fallback: 'A new version of the application is available. Reload to update.'}),
            {
              nzDuration: 0,
              nzKey: 'sw-update'
            }
          );
          ref.onClick.subscribe(() => {
            document.location.reload();
          });
        });
      });
  }

  onDestroy(): void {
    this.updateSub?.unsubscribe();
  }
}
