import {inject, Injectable} from '@angular/core';
import {combineLatest, map, Observable, take} from 'rxjs';
import {ApplicationMetaService} from '@terminal-core-lib/features/application-meta/application-meta.service';
import {RemoteStorageService} from '@terminal-core-lib/features/remote-storage/remote-storage.service';
import {GetRecordStatus} from '@terminal-core-lib/features/remote-storage/remote-storage-service.types';
import {WidgetsGallerySettings, WidgetsGalleryStorage} from '@terminal-core-lib/features/widgets-gallery/types/widgets-gallery-settings.types';
import {WidgetsGallerySettingsHelper} from '@terminal-core-lib/features/widgets-gallery/utils/widgets-gallery-settings.helper';

@Injectable()
export class WidgetsGallerySettingsBrokerService implements WidgetsGalleryStorage {
  private readonly remoteStorage = inject(RemoteStorageService);
  private readonly applicationMeta = inject(ApplicationMetaService);
  private readonly key = 'widgets-gallery-settings';

  read(): Observable<WidgetsGallerySettings | null> {
    return combineLatest([this.applicationMeta.getMeta(), this.remoteStorage.getRecord(this.key)]).pipe(map(([meta, result]) => {
      if (result.status === GetRecordStatus.Error) {
        return null;
      }
      if (result.status === GetRecordStatus.NotFound) {
        return WidgetsGallerySettingsHelper.empty();
      }
      if (result.record != null && meta.lastResetTimestamp != null && meta.lastResetTimestamp > result.record.meta.timestamp) {
        return WidgetsGallerySettingsHelper.empty();
      }
      return result.status === GetRecordStatus.Success
        ? WidgetsGallerySettingsHelper.parse(result.record?.value)
        : null;
    }), take(1));
  }

  save(settings: WidgetsGallerySettings): Observable<boolean> {
    return this.remoteStorage.setRecord({key: this.key, meta: {timestamp: Date.now()}, value: settings});
  }
}
