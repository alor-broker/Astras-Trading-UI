import {ClientDashboardType, AdminDashboardType} from '../../dashboard/types/dashboard.types';
import {WidgetCategory, WidgetMeta} from '../services/widgets-meta-service.types';
import {WidgetsGalleryHelper} from './widgets-gallery.helper';
import {WidgetsGallerySettingsHelper} from './widgets-gallery-settings.helper';
import {WidgetsGalleryContextHelper} from './widgets-gallery-context.helper';
import {BehaviorSubject, firstValueFrom, of, take, toArray} from 'rxjs';

class WidgetFixtures {
  static create(typeId: string, overrides: Partial<WidgetMeta> = {}): WidgetMeta {
    return {
      typeId,
      widgetName: {default: typeId, translations: {ru: 'Название'}},
      description: {default: 'Description', translations: {ru: 'Описание'}},
      category: WidgetCategory.Info,
      desktopMeta: {enabled: true, headerIcon: 'appstore', galleryIcon: 'appstore', addOptions: {isFullWidth: false}},
      ...overrides
    };
  }
}

describe('WidgetsGalleryHelper', () => {
  const now = Date.parse('2026-09-18T00:00:00Z');
  const expiry = new Date('2026-10-18T00:00:00Z');

  it('should keep separate fallback filtering for legacy and customizable gallery contexts', async () => {
    const meta = [WidgetFixtures.create('desktop', {hideOnDashboardType: [ClientDashboardType.ClientMobile]})];
    const registry = new Map([['desktop', {}]]);
    const modern = await firstValueFrom(WidgetsGalleryContextHelper.create(
      of(meta), of('ru'), of(undefined), registry, () => false, [ClientDashboardType.ClientDesktop]
    ));
    const legacy = await firstValueFrom(WidgetsGalleryContextHelper.create(
      of(meta), of('ru'), of(undefined), registry, () => false, [ClientDashboardType.ClientDesktop, ClientDashboardType.ClientMobile]
    ));

    expect(modern.widgets).toEqual(meta);
    expect(modern.dashboardType).toBe(ClientDashboardType.ClientDesktop);
    expect(legacy.widgets).toEqual([]);
  });

  it('should update shared gallery context when language or dashboard type changes', async () => {
    const meta = [WidgetFixtures.create('client', {hideOnDashboardType: [AdminDashboardType.AdminMain]})];
    const language$ = new BehaviorSubject('ru');
    const dashboardType$ = new BehaviorSubject<ClientDashboardType | AdminDashboardType>(ClientDashboardType.ClientDesktop);
    const result = firstValueFrom(WidgetsGalleryContextHelper.create(
      of(meta), language$, dashboardType$, new Map([['client', {}]]), () => false, [ClientDashboardType.ClientDesktop]
    ).pipe(take(3), toArray()));

    language$.next('en');
    dashboardType$.next(AdminDashboardType.AdminMain);
    language$.complete();
    dashboardType$.complete();

    const contexts = await result;
    expect(contexts.map(context => context.language)).toEqual(['ru', 'en', 'en']);
    expect(contexts[2].dashboardType).toBe(AdminDashboardType.AdminMain);
    expect(contexts[2].widgets).toEqual([]);
  });

  it('should filter by registry, dashboard, desktop support and demo mode before sorting', () => {
    const early = WidgetFixtures.create('early');
    const late = WidgetFixtures.create('late', {desktopMeta: {...early.desktopMeta!, galleryOrder: 5}});
    const meta = [late, early, WidgetFixtures.create('missing'), WidgetFixtures.create('mobile', {desktopMeta: undefined}),
      WidgetFixtures.create('disabled', {desktopMeta: {...early.desktopMeta!, enabled: false}}),
      WidgetFixtures.create('hidden', {hideOnDashboardType: [ClientDashboardType.ClientDesktop]}),
      WidgetFixtures.create('demo', {isDemoOnly: true})];
    const registry = new Map(meta.filter(widget => widget.typeId !== 'missing').map(widget => [widget.typeId, {}]));

    expect(WidgetsGalleryHelper.available(meta, registry, [ClientDashboardType.ClientDesktop], false).map(widget => widget.typeId)).toEqual(['early', 'late']);
    expect(WidgetsGalleryHelper.available(meta, registry, [ClientDashboardType.ClientDesktop], true).map(widget => widget.typeId)).toEqual(['early', 'demo', 'late']);
    expect(meta[0]).toBe(late);
  });

  it('should preserve the legacy exclusion against both client dashboard types', () => {
    const meta = [WidgetFixtures.create('desktop', {hideOnDashboardType: [ClientDashboardType.ClientMobile]})];
    const registry = new Map([['desktop', {}]]);
    expect(WidgetsGalleryHelper.available(meta, registry, [ClientDashboardType.ClientDesktop, ClientDashboardType.ClientMobile], false)).toEqual([]);
    expect(WidgetsGalleryHelper.available(meta, registry, [ClientDashboardType.ClientDesktop], false)).toEqual(meta);
  });

  it('should keep favorite new widgets out of other and new sections', () => {
    const widgets = WidgetsGalleryHelper.display([
      WidgetFixtures.create('favorite', {newUntil: expiry}),
      WidgetFixtures.create('new', {newUntil: expiry}),
      WidgetFixtures.create('old')
    ], 'ru', now);
    const preferences = {...WidgetsGallerySettingsHelper.preferences(WidgetsGallerySettingsHelper.empty(), AdminDashboardType.AdminMain), favoriteWidgets: [{typeId: 'favorite'}, {typeId: 'unavailable'}]};
    const sections = WidgetsGalleryHelper.sections(widgets, preferences);

    expect(sections.favorites.map(widget => widget.typeId)).toEqual(['favorite']);
    expect(sections.favorites[0].isNew).toBe(true);
    expect(sections.others.map(widget => widget.typeId)).toEqual(['new', 'old']);
    expect(sections.newWidgets.map(widget => widget.typeId)).toEqual(['new']);
    expect(widgets[0]).toMatchObject({name: 'Название', description: 'Описание'});
  });

  it.each([0, 1, 3, 4])('should use a submenu only above three new non-favorite widgets (count %i)', count => {
    const meta = Array.from({length: count}, (value, index) => WidgetFixtures.create(String(index), {newUntil: expiry}));
    const widgets = WidgetsGalleryHelper.display(meta, 'en', now);
    const preferences = WidgetsGallerySettingsHelper.preferences(WidgetsGallerySettingsHelper.empty(), AdminDashboardType.AdminMain);
    expect(WidgetsGalleryHelper.sections(widgets, preferences).newWidgetsSubmenu).toBe(count > 3);
  });

  it('should expire the badge exactly at the boundary without removing the favorite', () => {
    const widgets = WidgetsGalleryHelper.display([WidgetFixtures.create('order-book', {newUntil: expiry})], 'en', expiry.getTime());
    const sections = WidgetsGalleryHelper.sections(widgets, WidgetsGallerySettingsHelper.preferences(WidgetsGallerySettingsHelper.empty(), ClientDashboardType.ClientDesktop));
    expect(sections.favorites).toHaveLength(1);
    expect(sections.favorites[0].isNew).toBe(false);
    expect(sections.newWidgets).toEqual([]);
  });

  it.each([undefined, null, new Date(Number.NaN)])('should not mark widgets with absent or invalid expiry as new (%s)', newUntil => {
    const widgets = WidgetsGalleryHelper.display([WidgetFixtures.create('widget', {newUntil})], 'en', now);
    expect(widgets[0].isNew).toBe(false);
  });

  it('should respect explicit timezone offsets', () => {
    const widgets = WidgetsGalleryHelper.display([
      WidgetFixtures.create('widget', {newUntil: new Date('2026-10-18T05:00:00+05:00')})
    ], 'en', expiry.getTime());
    expect(widgets[0].isNew).toBe(false);
  });

  it('should group in category order, preserve widget order and omit empty categories', () => {
    const widgets = WidgetsGalleryHelper.display([
      WidgetFixtures.create('info'), WidgetFixtures.create('chart', {category: WidgetCategory.ChartsAndOrderbooks}), WidgetFixtures.create('info2')
    ], 'en', now);
    expect(WidgetsGalleryHelper.group(widgets).map(group => [group.category, group.widgets.map(widget => widget.typeId)]))
      .toEqual([[WidgetCategory.ChartsAndOrderbooks, ['chart']], [WidgetCategory.Info, ['info', 'info2']]]);
  });
});
