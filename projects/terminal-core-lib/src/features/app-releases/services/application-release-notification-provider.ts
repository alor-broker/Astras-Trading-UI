import {
  inject,
  Injectable
} from '@angular/core';
import {
  Observable,
  of
} from 'rxjs';
import {map} from 'rxjs/operators';
import {NotificationsProvider} from '../../header-notifications/services/header-notifications-service.types';
import {TranslatorService} from '../../translations/services/translator.service';
import {NotificationMeta} from '../../header-notifications/header-notifications.types';
import {FEATURES_CONFIG} from '../../../config/features-config';
import {AppReleaseService} from './app-release.service';
import {mapWith} from '../../../common/utils/observable/map-with';
import {GuidGenerator} from '../../../common/utils/guid-generator';

@Injectable()
export class ApplicationReleaseNotificationProvider implements NotificationsProvider {
  private readonly appReleaseService = inject(AppReleaseService);

  private readonly translatorService = inject(TranslatorService);

  private readonly featuresConfig = inject(FEATURES_CONFIG);

  getNotifications(): Observable<NotificationMeta[]> {
    if (this.featuresConfig.releases ?? true) {
      return this.appReleaseService.savedVersion$.pipe(
        mapWith(() => this.appReleaseService.getCurrentVersion(), (savedVersion, currentVersion) => ({
          savedVersion,
          currentVersion
        })),
        mapWith(
          () => this.translatorService.getTranslator('application-meta/application-meta-service'),
          (versionData, translate) => ({versionData, translate})
        ),
        map(({versionData, translate}) => {
          const {savedVersion, currentVersion} = versionData;

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
              open: () => this.appReleaseService.showAppUpdatedDialog(currentVersion)
            } as NotificationMeta
          ];
        })
      );
    }

    return of([]);
  }
}
