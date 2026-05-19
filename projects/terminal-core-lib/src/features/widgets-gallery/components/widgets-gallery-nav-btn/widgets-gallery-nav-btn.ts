import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {TranslatorService} from '../../../translations/services/translator.service';
import {DesktopDashboardContextService} from '../../../dashboard/desktop/services/desktop-dashboard-context.service';
import {LocalStorageService} from '../../../local-storage/local-storage.service';
import {DesktopManageDashboardsService} from '../../../dashboard/desktop/services/desktop-manage-dashboards.service';
import {WidgetsMetaService} from '../../services/widgets-meta.service';
import {
  combineLatest,
  map,
  Observable,
  shareReplay
} from 'rxjs';
import {WidgetCategory} from '../../services/widgets-meta-service.types';
import {LocalStorageCommonConstants} from '../../../local-storage/local-storage.constants';
import {
  ClientDashboardType,
  DashboardType
} from '../../../dashboard/types/dashboard.types';
import {
  GalleryDisplay,
  WidgetDisplay,
  WidgetGroup,
  WidgetsGallerySideMenu
} from '../widgets-gallery-side-menu/widgets-gallery-side-menu';
import {WidgetsHelper} from '../../utils/widgets.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {WIDGET_COMPONENT_REGISTRY} from '@terminal-core-lib/features/dashboard/types/widget-component-registry.types';

@Component({
  selector: 'ats-widgets-gallery-nav-btn',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzButtonComponent,
    NzTooltipDirective,
    NzIconDirective,
    WidgetsGallerySideMenu
  ],
  templateUrl: './widgets-gallery-nav-btn.html',
  styleUrl: './widgets-gallery-nav-btn.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetsGalleryNavBtn implements OnInit {
  galleryVisible = false;

  widgetsGallery$!: Observable<GalleryDisplay>;

  readonly atsDisabled = input(false);

  private readonly manageDashboardsService = inject(DesktopManageDashboardsService);

  private readonly widgetsMetaService = inject(WidgetsMetaService);

  private readonly translatorService = inject(TranslatorService);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  private readonly widgetRegistry = inject(WIDGET_COMPONENT_REGISTRY);

  ngOnInit(): void {
    this.initWidgetsGallery();
  }

  addWidget(type: string): void {
    this.manageDashboardsService.addWidget(type);
  }

  resetDashboard(): void {
    this.manageDashboardsService.resetCurrentDashboard();
  }

  private initWidgetsGallery(): void {
    const orderedCategories = [
      WidgetCategory.All,
      WidgetCategory.ChartsAndOrderbooks,
      WidgetCategory.PositionsTradesOrders,
      WidgetCategory.Info,
      WidgetCategory.Details,
    ];

    this.widgetsGallery$ = combineLatest({
      meta: this.widgetsMetaService.getWidgetsMeta(),
      lang: this.translatorService.getLangChanges(),
      currentDashboardType: this.currentDashboard$.pipe(
        map(d => d.type)
      )
    }).pipe(
      map((s) => {
        const groups = new Map<WidgetCategory, WidgetDisplay[]>();
        const isDemoModeEnabled = this.localStorageService.getItem<boolean>(LocalStorageCommonConstants.DemoModeStorageKey) ?? false;
        const dashboardTypes: DashboardType[] = [];

        if (s.currentDashboardType != null) {
          dashboardTypes.push(s.currentDashboardType);
        } else {
          dashboardTypes.push(ClientDashboardType.ClientDesktop);
          dashboardTypes.push(ClientDashboardType.ClientMobile);
        }

        const widgets = (s.meta ?? [])
          .filter((x) => {
            if (!this.widgetRegistry.has(x.typeId)) {
              return false;
            }

            const isExcludedByDashboardType = dashboardTypes.some(value => (x.hideOnDashboardType ?? []).includes(value));

            return x.desktopMeta != null
              && x.desktopMeta.enabled
              && !isExcludedByDashboardType
              && (!(x.isDemoOnly ?? false) || isDemoModeEnabled);
          })
          .sort((a, b) => {
            return (
              (a.desktopMeta!.galleryOrder ?? 0) -
              (b.desktopMeta!.galleryOrder ?? 0)
            );
          });

        widgets.forEach((widgetMeta) => {
          if (!groups.has(widgetMeta.category)) {
            groups.set(widgetMeta.category, []);
          }

          const groupWidgets = groups.get(widgetMeta.category)!;

          groupWidgets.push({
            typeId: widgetMeta.typeId,
            name: WidgetsHelper.getWidgetName(widgetMeta.widgetName, s.lang),
            icon: widgetMeta.desktopMeta?.galleryIcon ?? 'appstore',
          });
        });

        return Array.from(groups.entries())
          .sort((a, b) => {
            const aIndex = orderedCategories.indexOf(a[0]);
            const bIndex = orderedCategories.indexOf(b[0]);

            return aIndex - bIndex;
          })
          .map(
            (value) =>
              ({
                category: value[0],
                widgets: value[1],
              } as WidgetGroup)
          );
      }),
      map((groups) => {
        const menu: GalleryDisplay = {
          allCategory: groups.find(
            (g) => g.category === WidgetCategory.All
          ) ?? {
            category: WidgetCategory.All,
            widgets: [],
          },
          groups: groups.filter((g) => g.category !== WidgetCategory.All),
        };

        return menu;
      }),
      shareReplay(1)
    );
  }
}
