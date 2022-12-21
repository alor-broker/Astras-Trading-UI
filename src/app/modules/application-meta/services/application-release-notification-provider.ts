import { Injectable } from '@angular/core';
import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import { Observable, switchMap } from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { ApplicationMetaService } from './application-meta.service';
import { map } from 'rxjs/operators';
import { GuidGenerator } from '../../../shared/utils/guid';
import { ModalService } from '../../../shared/services/modal.service';
import { mapWith } from '../../../shared/utils/observable-helper';
import { TranslocoService } from "@ngneat/transloco";

@Injectable()
export class ApplicationReleaseNotificationProvider implements NotificationsProvider {


  constructor(
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly modalService: ModalService,
    private readonly translocoService: TranslocoService

  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
    const translateLoaded$ = this.translocoService.langChanges$.pipe(
      switchMap((lang) => this.translocoService.load('application-meta/application-meta-service/' + lang))
    );

    return this.applicationMetaService.savedVersion$.pipe(
      mapWith(() => this.applicationMetaService.getCurrentVersion(), (savedVersion, currentVersion) => ({
        savedVersion,
        currentVersion
      })),
      mapWith(
        () => translateLoaded$,
        (versionData) => versionData
      ),
      map(({ savedVersion, currentVersion }) => {
        if (!currentVersion || currentVersion.id === savedVersion) {
          return [];
        }

        return [
          {
            id: GuidGenerator.newGuid(),
            title: this.translocoService.translate('applicationMetaApplicationMetaService.appUpdatedTitle'),
            description: this.translocoService.translate('applicationMetaApplicationMetaService.appUpdatedDescription'),
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
