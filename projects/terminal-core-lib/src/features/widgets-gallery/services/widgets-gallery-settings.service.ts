import {inject, Injectable} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {filter, map, Observable, take} from 'rxjs';
import {GuidGenerator} from '../../../common/utils/guid-generator';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {DashboardType} from '../../dashboard/types/dashboard.types';
import {WidgetsGalleryPreferences} from '../types/widgets-gallery-settings.types';
import {WidgetsGalleryActions, WidgetsGalleryFeature} from '../store/widgets-gallery.store';

@Injectable()
export class WidgetsGallerySettingsService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  readonly state = this.store.selectSignal(WidgetsGalleryFeature.selectWidgetsGalleryState);

  load(): void {
    if (this.state().status !== EntityStatus.Loading && !this.state().saving) {
      this.store.dispatch(WidgetsGalleryActions.load());
    }
  }

  save(dashboardType: DashboardType, preferences: WidgetsGalleryPreferences): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      if (this.state().status !== EntityStatus.Success || this.state().saving) {
        subscriber.next(false);
        subscriber.complete();
        return;
      }
      const requestId = GuidGenerator.newGuid();
      const subscription = this.actions$.pipe(
        ofType(WidgetsGalleryActions.saveSuccess, WidgetsGalleryActions.saveFailure),
        filter(action => action.requestId === requestId),
        map(action => action.type === WidgetsGalleryActions.saveSuccess.type),
        take(1)
      ).subscribe(subscriber);
      this.store.dispatch(WidgetsGalleryActions.save({dashboardType, preferences, requestId}));
      return subscription;
    });
  }
}
