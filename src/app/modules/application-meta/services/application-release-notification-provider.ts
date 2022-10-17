import { Injectable } from '@angular/core';
import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import { Observable } from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { ApplicationMetaService } from './application-meta.service';
import { map } from 'rxjs/operators';
import { GuidGenerator } from '../../../shared/utils/guid';
import { ModalService } from '../../../shared/services/modal.service';

@Injectable()
export class ApplicationReleaseNotificationProvider implements NotificationsProvider {


  constructor(
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly modalService: ModalService
  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
    return this.applicationMetaService.savedVersion$.pipe(
      map(savedVersion => {
        const currentVersion = this.applicationMetaService.currentVersion;
        if (this.isApplicationUpdated(currentVersion, savedVersion)) {
          return [
            {
              id: GuidGenerator.newGuid(),
              title: 'Приложение обновлено',
              description: 'Вышла новая версия приложения. Нажмите для просмотра деталей.',
              showDate: false,
              isRead: false,
              open: () => this.modalService.openApplicationUpdatedModal()
            } as NotificationMeta
          ];
        }

        return [];
      })
    );
  }

  private isApplicationUpdated(currentVersion: string, savedVersion: string | null): boolean {
    if (!savedVersion) {
      return true;
    }

    const currentVersionParts = currentVersion.split('.');
    const savedVersionParts = savedVersion.split('.');

    for (let i = 0; i < currentVersionParts.length; i++) {
      const currentPart = Number(currentVersionParts[i]);
      const savedPart = i < savedVersionParts.length ? Number(savedVersionParts[i]) : 0;

      if (currentPart > savedPart) {
        return true;
      }
    }

    return false;
  }
}
