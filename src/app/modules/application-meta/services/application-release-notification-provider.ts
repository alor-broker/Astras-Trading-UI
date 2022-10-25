import { Injectable } from '@angular/core';
import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import { Observable } from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { ApplicationMetaService } from './application-meta.service';
import { map } from 'rxjs/operators';
import { GuidGenerator } from '../../../shared/utils/guid';
import { ModalService } from '../../../shared/services/modal.service';
import { mapWith } from '../../../shared/utils/observable-helper';

@Injectable()
export class ApplicationReleaseNotificationProvider implements NotificationsProvider {


  constructor(
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly modalService: ModalService
  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
    return this.applicationMetaService.savedVersion$.pipe(
      mapWith(() => this.applicationMetaService.getCurrentVersion(), (savedVersion, currentVersion) => ({
        savedVersion,
        currentVersion
      })),
      map(({ savedVersion, currentVersion }) => {
        if (!currentVersion || currentVersion.id === savedVersion) {
          return [];
        }

        return [
          {
            id: GuidGenerator.newGuid(),
            title: 'Приложение обновлено',
            description: 'Вышла новая версия приложения. Нажмите для просмотра деталей.',
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
