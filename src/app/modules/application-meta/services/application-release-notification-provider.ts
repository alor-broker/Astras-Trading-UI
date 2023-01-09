import { Injectable } from '@angular/core';
import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import { Observable } from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { ApplicationMetaService } from './application-meta.service';
import { map } from 'rxjs/operators';
import { GuidGenerator } from '../../../shared/utils/guid';
import { ModalService } from '../../../shared/services/modal.service';
import { mapWith } from '../../../shared/utils/observable-helper';
import { TranslatorService } from "../../../shared/services/translator.service";

@Injectable()
export class ApplicationReleaseNotificationProvider implements NotificationsProvider {
  constructor(
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly modalService: ModalService,
    private readonly translatorService: TranslatorService
  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
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
}
