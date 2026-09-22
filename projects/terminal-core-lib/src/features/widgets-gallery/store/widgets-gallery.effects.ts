import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {catchError, exhaustMap, map, of, withLatestFrom} from 'rxjs';
import {WIDGETS_GALLERY_STORAGE, WidgetsGallerySettings} from '../types/widgets-gallery-settings.types';
import {WidgetsGalleryActions, WidgetsGalleryFeature} from './widgets-gallery.store';

@Injectable()
export class WidgetsGalleryEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly storage = inject(WIDGETS_GALLERY_STORAGE);

  readonly load$ = createEffect(() => this.actions$.pipe(
    ofType(WidgetsGalleryActions.load),
    exhaustMap(() => this.storage.read().pipe(
      map(settings => settings == null ? WidgetsGalleryActions.loadFailure() : WidgetsGalleryActions.loadSuccess({settings})),
      catchError(() => of(WidgetsGalleryActions.loadFailure()))
    ))
  ));

  readonly save$ = createEffect(() => this.actions$.pipe(
    ofType(WidgetsGalleryActions.save),
    withLatestFrom(this.store.select(WidgetsGalleryFeature.selectSettings)),
    exhaustMap(([action, previous]) => {
      const settings: WidgetsGallerySettings = {
        ...previous,
        dashboards: {...previous.dashboards, [action.dashboardType]: action.preferences}
      };
      return this.storage.save(settings).pipe(
        map(success => success
          ? WidgetsGalleryActions.saveSuccess({settings, requestId: action.requestId})
          : WidgetsGalleryActions.saveFailure({requestId: action.requestId})),
        catchError(() => of(WidgetsGalleryActions.saveFailure({requestId: action.requestId})))
      );
    })
  ));
}
