import {ClientDashboardType, DashboardType} from '../../dashboard/types/dashboard.types';
import {WidgetsGalleryPreferences} from './widgets-gallery-settings.types';

export const WIDGETS_GALLERY_DEFAULTS: Readonly<Partial<Record<DashboardType, Readonly<WidgetsGalleryPreferences>>>> = {
  [ClientDashboardType.ClientDesktop]: {
    favoriteWidgets: [
      {typeId: 'instrument-select'},
      {typeId: 'order-book'},
      {typeId: 'light-chart'},
      {typeId: 'tech-chart'},
      {typeId: 'blotter'},
      {typeId: 'order-submit'},
      {typeId: 'instrument-info'},
      {typeId: 'news'},
      {typeId: 'all-instruments'}
    ],
    showOtherCategories: true,
    showFavoriteCategories: false
  }
};
