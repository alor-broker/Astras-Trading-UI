import { Injectable, inject } from '@angular/core';
import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import {
  Observable,
  of
} from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { ApplicationMetaService } from './application-meta.service';
import { map } from 'rxjs/operators';
import { GuidGenerator } from '../../../shared/utils/guid';
import { ModalService } from '../../../shared/services/modal.service';
import { mapWith } from '../../../shared/utils/observable-helper';
import { TranslatorService } from "../../../shared/services/translator.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

@Injectable()
export class ApplicationReleaseNotificationProvider implements NotificationsProvider {
  private readonly applicationMetaService = inject(ApplicationMetaService);
  private readonly modalService = inject(ModalService);
  private readonly translatorService = inject(TranslatorService);
  private readonly environmentService = inject(EnvironmentService);

  getNotifications(): Observable<NotificationMeta[]> {
    if(this.environmentService.features.releases ?? true) {
      return this.applicationMetaService.savedVersion$.pipe(
        mapWith(() => this.applicationMetaService.getCurrentVersion(), (savedVersion, currentVersion) => ({
          savedVersion,
          currentVersion
        })),
        mapWith(
          () => this.translatorService.getTranslator('application-meta/application-meta-service'),
          (versionData, translate) => ({ versionData, translate })
        ),
        map(({ versionData, translate }) => {
          const { savedVersion, currentVersion } = versionData;

          if (!currentVersion || currentVersion.id === savedVersion) {
            return [];
          }

          return [
            {
              id: GuidGenerator.newGuid(),
              title: translate(['appUpdatedTitle']),
              description: translate(['appUpdatedDescription']),
              date: new Date(),
              showDate: false,
              isRead: false,
              open: () => this.modalService.openApplicationUpdatedModal(currentVersion)
            } as NotificationMeta
          ];
        })
      );
    }

    return of([]);
  }
}
