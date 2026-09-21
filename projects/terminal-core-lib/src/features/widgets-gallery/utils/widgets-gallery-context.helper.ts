import {combineLatest, map, Observable, shareReplay} from 'rxjs';
import {ClientDashboardType, DashboardType} from '../../dashboard/types/dashboard.types';
import {WidgetMeta} from '../services/widgets-meta-service.types';
import {WidgetsGalleryHelper} from './widgets-gallery.helper';

export interface WidgetsGalleryContext {
  widgets: WidgetMeta[];
  language: string;
  dashboardType: DashboardType;
}

export class WidgetsGalleryContextHelper {
  static create(
    meta$: Observable<WidgetMeta[] | null>,
    language$: Observable<string>,
    dashboardType$: Observable<DashboardType | undefined>,
    registry: ReadonlyMap<string, unknown>,
    isDemo: () => boolean,
    fallbackTypes: DashboardType[]
  ): Observable<WidgetsGalleryContext> {
    return combineLatest({meta: meta$, language: language$, dashboardType: dashboardType$}).pipe(
      map(context => ({
        widgets: WidgetsGalleryHelper.available(context.meta ?? [], registry,
          context.dashboardType == null ? fallbackTypes : [context.dashboardType], isDemo()),
        language: context.language,
        dashboardType: context.dashboardType ?? ClientDashboardType.ClientDesktop
      })),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
