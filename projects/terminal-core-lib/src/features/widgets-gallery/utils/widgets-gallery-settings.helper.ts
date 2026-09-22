import {DashboardType} from '../../dashboard/types/dashboard.types';
import {WIDGETS_GALLERY_DEFAULTS} from '../types/widgets-gallery-defaults';
import {WidgetsGalleryPreferences, WidgetsGallerySettings} from '../types/widgets-gallery-settings.types';

export class WidgetsGallerySettingsHelper {
  static empty(): WidgetsGallerySettings {
    return {dashboards: {}};
  }

  static preferences(settings: WidgetsGallerySettings, type: DashboardType): WidgetsGalleryPreferences {
    const value = settings.dashboards[type] ?? WIDGETS_GALLERY_DEFAULTS[type];
    return {
      favoriteWidgets: (value?.favoriteWidgets ?? []).map(widget => ({...widget})),
      showOtherCategories: value?.showOtherCategories ?? true,
      showFavoriteCategories: value?.showFavoriteCategories ?? false
    };
  }

  static parse(value: unknown): WidgetsGallerySettings | null {
    if (!this.isRecord(value) || !this.isRecord(value['dashboards'])) {
      return null;
    }

    for (const preferences of Object.values(value['dashboards'])) {
      if (!this.isRecord(preferences)
        || typeof preferences['showOtherCategories'] !== 'boolean'
        || typeof preferences['showFavoriteCategories'] !== 'boolean') {
        return null;
      }
      const widgets = preferences['favoriteWidgets'];
      if (!Array.isArray(widgets) || !widgets.every((widget: unknown) => this.isRecord(widget) && typeof widget['typeId'] === 'string')) {
        return null;
      }
    }

    // Preserve unknown dashboard types and widget IDs for forwards compatibility.
    return value as unknown as WidgetsGallerySettings;
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return value != null && typeof value === 'object' && !Array.isArray(value);
  }
}
