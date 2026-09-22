import {AdminDashboardType, ClientDashboardType} from '../../dashboard/types/dashboard.types';
import {WidgetsGallerySettingsHelper} from './widgets-gallery-settings.helper';

describe('WidgetsGallerySettingsHelper', () => {
  it('should apply defaults only when dashboard preferences are absent', () => {
    const settings = WidgetsGallerySettingsHelper.empty();
    const defaults = WidgetsGallerySettingsHelper.preferences(settings, ClientDashboardType.ClientDesktop);
    expect(defaults.favoriteWidgets.map(widget => widget.typeId)).toEqual([
      'instrument-select', 'order-book', 'light-chart', 'tech-chart', 'blotter',
      'order-submit', 'instrument-info', 'news', 'all-instruments'
    ]);
    settings.dashboards[ClientDashboardType.ClientDesktop] = {...defaults, favoriteWidgets: []};
    expect(WidgetsGallerySettingsHelper.preferences(settings, ClientDashboardType.ClientDesktop).favoriteWidgets).toEqual([]);
    expect(WidgetsGallerySettingsHelper.preferences(settings, AdminDashboardType.AdminMain)).toEqual({favoriteWidgets: [], showOtherCategories: true, showFavoriteCategories: false});
  });

  it('should retain unknown dashboard types and widget IDs', () => {
    const value = {dashboards: {future: {favoriteWidgets: [{typeId: 'unknown', futureOption: true}], showOtherCategories: true, showFavoriteCategories: false}}};
    expect(WidgetsGallerySettingsHelper.parse(value)).toEqual(value);
  });

  it('should copy favorite objects without losing additional parameters', () => {
    const favorite = {typeId: 'order-book', futureOption: {enabled: true}};
    const settings = WidgetsGallerySettingsHelper.empty();
    settings.dashboards[ClientDashboardType.ClientDesktop] = {
      favoriteWidgets: [favorite], showOtherCategories: true, showFavoriteCategories: false
    };

    const preferences = WidgetsGallerySettingsHelper.preferences(settings, ClientDashboardType.ClientDesktop);

    expect(preferences.favoriteWidgets).toEqual([favorite]);
    expect(preferences.favoriteWidgets[0]).not.toBe(favorite);
  });

  it.each(['order-book', 5, null, {}, {typeId: 5}])('should reject invalid favorite objects (%s)', favorite => {
    const value = {dashboards: {desktop: {
      favoriteWidgets: [favorite], showOtherCategories: true, showFavoriteCategories: false
    }}};

    expect(WidgetsGallerySettingsHelper.parse(value)).toBeNull();
  });

  it.each([null, undefined, [], {}, {dashboards: null}, {dashboards: []}, {dashboards: {desktop: {favoriteWidgets: [5]}}}])('should reject malformed settings without replacing them with defaults', value => {
    expect(WidgetsGallerySettingsHelper.parse(value)).toBeNull();
  });
});
