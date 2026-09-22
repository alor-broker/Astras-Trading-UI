import {DashboardType} from '../../dashboard/types/dashboard.types';
import {WidgetCategory, WidgetMeta} from '../services/widgets-meta-service.types';
import {WidgetsHelper} from './widgets.helper';
import {WidgetsGalleryPreferences} from '../types/widgets-gallery-settings.types';

export interface GalleryWidget {
  typeId: string;
  name: string;
  description: string;
  icon: string;
  category: WidgetCategory;
  isNew: boolean;
}

export interface GalleryWidgetGroup {
  category: WidgetCategory;
  widgets: GalleryWidget[];
}

export class WidgetsGalleryHelper {
  static readonly inlineNewWidgetsLimit = 3;

  static available(meta: readonly WidgetMeta[], registry: ReadonlyMap<string, unknown>, types: DashboardType[], demo: boolean): WidgetMeta[] {
    return meta.filter(widget => registry.has(widget.typeId)
      && widget.desktopMeta?.enabled === true
      && !types.some(type => widget.hideOnDashboardType?.includes(type) ?? false)
      && (!(widget.isDemoOnly ?? false) || demo))
      .sort((a, b) => (a.desktopMeta?.galleryOrder ?? 0) - (b.desktopMeta?.galleryOrder ?? 0));
  }

  static display(meta: readonly WidgetMeta[], lang: string | undefined, now: number): GalleryWidget[] {
    return meta.map(widget => ({
      typeId: widget.typeId,
      name: WidgetsHelper.getWidgetName(widget.widgetName, lang),
      description: widget.description == null ? '' : WidgetsHelper.getWidgetName(widget.description, lang),
      icon: widget.desktopMeta?.galleryIcon ?? 'appstore',
      category: widget.category,
      isNew: (widget.newUntil?.getTime() ?? 0) > now
    }));
  }

  static group(widgets: GalleryWidget[]): GalleryWidgetGroup[] {
    return Object.values(WidgetCategory).map(category => ({
      category,
      widgets: widgets.filter(widget => widget.category === category)
    })).filter(group => group.widgets.length > 0);
  }

  static sections(widgets: GalleryWidget[], preferences: WidgetsGalleryPreferences): {
    favorites: GalleryWidget[];
    others: GalleryWidget[];
    newWidgets: GalleryWidget[];
    newWidgetsSubmenu: boolean;
  } {
    const ids = new Set(preferences.favoriteWidgets.map(widget => widget.typeId));
    const others = widgets.filter(widget => !ids.has(widget.typeId));
    const newWidgets = others.filter(widget => widget.isNew);
    return {
      favorites: widgets.filter(widget => ids.has(widget.typeId)),
      others,
      newWidgets,
      newWidgetsSubmenu: newWidgets.length > this.inlineNewWidgetsLimit
    };
  }
}
