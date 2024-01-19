import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  filter,
  map
} from "rxjs/operators";
import {WidgetsHelper} from "../../../../shared/utils/widgets";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {WidgetsMetaService} from "../../../../shared/services/widgets-meta.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import { WidgetCategory, WidgetMeta } from "../../../../shared/models/widget-meta.model";
import {arraysEqual} from "ng-zorro-antd/core/util";
import { MobileActionsContextService } from "../../services/mobile-actions-context.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GalleryDisplay, WidgetDisplay, WidgetGroup } from "../widgets-gallery/widgets-gallery.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { DefaultMobileDashboardConfig } from "../../../../shared/models/dashboard/dashboard.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { MobileDashboardService } from "../../services/mobile-dashboard.service";
import { Widget } from "../../../../shared/models/dashboard/widget.model";

@Component({
  selector: 'ats-mobile-dashboard',
  templateUrl: './mobile-dashboard.component.html',
  styleUrls: ['./mobile-dashboard.component.less']
})
export class MobileDashboardComponent implements OnInit {
  readonly newOrderWidgetId = 'order-submit';
  galleryVisible = false;

  widgets$!: Observable<WidgetInstance[]>;
  selectedWidget$ = new BehaviorSubject<WidgetInstance | null>(null);
  widgetsGallery$!: Observable<GalleryDisplay>;

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly dashboardsService: ManageDashboardsService,
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService,
    private readonly mobileActionsContextService: MobileActionsContextService,
    private readonly destroyRef: DestroyRef,
    private readonly mobileDashboardService: MobileDashboardService
  ) {
  }

  ngOnInit(): void {
    const widgets$ = this.dashboardContextService.selectedDashboard$.pipe(
      distinctUntilChanged((previous, current) => arraysEqual(previous.items.map(x => x.guid), current.items.map(x => x.guid))),
      mapWith(
        () => this.dashboardsService.getDefaultDashboardConfig(),
        (dashboard, config) => {
          const defaultWidgets = (config.find(c => c.type === 'mobile') as DefaultMobileDashboardConfig).widgets.map(w => w.widgetTypeId);
          return dashboard.items.filter(w => defaultWidgets.includes(w.widgetType));
        }
      )
    );

    this.widgets$ = combineLatest([
      widgets$,
      this.widgetsMetaService.getWidgetsMeta().pipe(take(1))
    ]).pipe(
      map(([items, meta]) => {
        return items.map(x => ({
          instance: x,
          widgetMeta: meta.find(m => m.typeId === x.widgetType)
        } as WidgetInstance))
          .filter(x => (x.widgetMeta.mobileMeta?.enabled ?? false));
      }),
      shareReplay(1)
    );

    this.widgets$
      .pipe(take(1))
      .subscribe(widgets => {
        this.selectedWidget$.next(widgets.find(w => w.instance.widgetType === this.newOrderWidgetId) ?? null);
      });

    this.mobileActionsContextService.actionEvents$.pipe(
      filter(e => e.eventType === "instrumentSelected"),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.widgets$.pipe(
        take(1)
      ).subscribe(widgets => {
        const newOrderWidget = widgets.find(w => w.instance.widgetType === this.newOrderWidgetId);
        if (newOrderWidget == null) {
          return;
        }

        this.selectWidget(newOrderWidget);
      });
    });

    this.initWidgetsGallery();
  }

  getWidgetName(meta: WidgetMeta): string {
    return WidgetsHelper.getWidgetName(meta.mobileMeta?.widgetName ?? meta.widgetName, this.translatorService.getActiveLang());
  }

  selectWidget(widget: WidgetInstance): void {
    this.removeWidgets()
      .subscribe(() => {
        this.selectedWidget$.next(widget);
      });
  }

  selectOuterWidget(widgetName: string): void {
    this.removeWidgets()
      .pipe(
        tap(() => this.mobileDashboardService.addWidget(widgetName)),
        switchMap(() => this.dashboardContextService.selectedDashboard$
          .pipe(take(1))
        ),
        mapWith(
          () => this.dashboardsService.getDefaultDashboardConfig(),
          (dashboard, config) => ({
            dashboard,
            config: config.find(c => c.type === 'mobile') as DefaultMobileDashboardConfig
          })
        ),
        map(({dashboard, config}) => {
            return dashboard.items
              .find(w => !config.widgets
                .map(cw => cw.widgetTypeId)
                .includes(w.widgetType)
              ) as Widget;
          }
        ),
        mapWith(
          () => this.widgetsMetaService.getWidgetsMeta().pipe(take(1)),
          (x, meta) => ({
            instance: x,
            widgetMeta: meta.find(m => m.typeId === x.widgetType)
          } as WidgetInstance)
        )
      )
      .subscribe(newWidget => this.selectedWidget$.next(newWidget));
  }

  removeWidgets(): Observable<null> {
    return this.dashboardContextService.selectedDashboard$
      .pipe(
        mapWith(
          () => this.dashboardsService.getDefaultDashboardConfig(),
          (dashboard, config) => ({
            dashboard,
            config: config.find(c => c.type === 'mobile') as DefaultMobileDashboardConfig
          })
        ),
        take(1),
        tap(({dashboard, config}) => {
          const widgetsToRemove = dashboard.items
            .filter(w => !config.widgets
              .map(cw => cw.widgetTypeId)
              .includes(w.widgetType)
            )
            .map(w => w.guid);

          if (widgetsToRemove.length > 0) {
            this.mobileDashboardService.removeWidgets(widgetsToRemove);
          }
        }),
        map(() => null)
      );
  }

  private initWidgetsGallery(): void {
    const orderedCategories = [
      WidgetCategory.All,
      WidgetCategory.ChartsAndOrderbooks,
      WidgetCategory.PositionsTradesOrders,
      WidgetCategory.Info,
      WidgetCategory.Details
    ];

    this.widgetsGallery$ = combineLatest([
      this.widgetsMetaService.getWidgetsMeta(),
      this.translatorService.getLangChanges(),
      this.dashboardsService.getDefaultDashboardConfig()
    ])
      .pipe(
        map(([meta, lang, config]) => {
          const groups = new Map<WidgetCategory, WidgetDisplay[]>;
          const mobileDefaultWidgets = (config
            .find(c => c.type === 'mobile') as DefaultMobileDashboardConfig).widgets
            .map(cw => cw.widgetTypeId);

          const widgets = meta
            .filter(x => !!x.mobileMeta && x.mobileMeta.enabled && !mobileDefaultWidgets.includes(x.typeId))
            .sort((a, b) => {
                return (a.mobileMeta!.galleryOrder ?? 0) - (b.mobileMeta!.galleryOrder ?? 0);
              }
            );

          widgets.forEach(widgetMeta => {
            if (!groups.has(widgetMeta.category)) {
              groups.set(widgetMeta.category, []);
            }

            const groupWidgets = groups.get(widgetMeta.category)!;

            groupWidgets.push(({
              typeId: widgetMeta.typeId,
              name: WidgetsHelper.getWidgetName(widgetMeta.widgetName, lang),
              icon: widgetMeta.mobileMeta?.galleryIcon ?? 'appstore'
            }));
          });

          return Array.from(groups.entries())
            .sort((a, b) => {
              const aIndex = orderedCategories.indexOf(a[0]);
              const bIndex = orderedCategories.indexOf(b[0]);

              return aIndex - bIndex;
            })
            .map(value => ({
              category: value[0],
              widgets: value[1]
            } as WidgetGroup));
        }
      ),
      map(groups => {
        const menu: GalleryDisplay = {
          allCategory: groups.find(g => g.category === WidgetCategory.All) ?? {
            category: WidgetCategory.All,
            widgets: []
          },
          groups: groups.filter(g => g.category !== WidgetCategory.All)
        };

        return menu;
      }),
      shareReplay(1)
    );
  }
}
