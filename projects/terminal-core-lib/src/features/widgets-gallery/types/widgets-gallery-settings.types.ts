import {InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import {DashboardType} from '../../dashboard/types/dashboard.types';

export interface FavoriteWidgetPreferences {
  typeId: string;
}

export interface WidgetsGalleryPreferences {
  favoriteWidgets: FavoriteWidgetPreferences[];
  showOtherCategories: boolean;
  showFavoriteCategories: boolean;
}

export interface WidgetsGallerySettings {
  dashboards: Partial<Record<DashboardType, WidgetsGalleryPreferences>>;
}

export interface WidgetsGalleryStorage {
  // null means a failed read; a missing record returns an empty configuration.
  read(): Observable<WidgetsGallerySettings | null>;
  save(settings: WidgetsGallerySettings): Observable<boolean>;
}

export const WIDGETS_GALLERY_STORAGE = new InjectionToken<WidgetsGalleryStorage>('WIDGETS_GALLERY_STORAGE');
