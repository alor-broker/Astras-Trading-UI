import {
  Component,
  DestroyRef,
  OnInit
} from "@angular/core";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap
} from "rxjs";
import {WidgetInstance} from "../../../shared/models/dashboard/dashboard-item.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {WidgetCategory} from "../../../shared/models/widget-meta.model";
import {WidgetsHelper} from "../../../shared/utils/widgets";
import {
  GalleryDisplay,
  WidgetDisplay,
  WidgetGroup, WidgetsGalleryComponent
} from "../../../modules/dashboard/components/widgets-gallery/widgets-gallery.component";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {WidgetsMetaService} from "../../../shared/services/widgets-meta.service";
import {TranslatorService} from "../../../shared/services/translator.service";
import {MobileActionsContextService} from "../../../modules/dashboard/services/mobile-actions-context.service";
import {MobileDashboardService} from "../../../modules/dashboard/services/mobile-dashboard.service";
import {WidgetsSharedDataService} from "../../../shared/services/widgets-shared-data.service";
import { map } from "rxjs/operators";
import { arraysEqual } from "ng-zorro-antd/core/util";
import {LetDirective} from "@ngrx/component";
import {NgForOf, NgIf} from "@angular/common";
import {DashboardModule} from "../../../modules/dashboard/dashboard.module";
import {NzIconDirective} from "ng-zorro-antd/icon";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { isInstrumentDependent } from "../../../shared/utils/settings-helper";
import { NavigationStackService } from "../../../shared/services/navigation-stack.service";
@Component({
    selector: 'ats-mobile-dashboard-content',
    templateUrl: './mobile-dashboard-content.component.html',
    styleUrls: ['./mobile-dashboard-content.component.less'],
    imports: [
        LetDirective,
        NgForOf,
        DashboardModule,
        NgIf,
        NzIconDirective,
        WidgetsGalleryComponent
    ]
})
export class MobileDashboardContentComponent implements OnInit {
  readonly newOrderWidgetId = 'order-submit';
  readonly homeWidgetId = 'mobile-home-screen';
  galleryVisible = false;
  defaultWidgetNames = [
    this.newOrderWidgetId,
    'blotter',
    this.homeWidgetId,
    'light-chart',
    'all-instruments'
  ];

  widgets$!: Observable<WidgetInstance[]>;
  defaultWidgets$!: Observable<WidgetInstance[]>;
  selectedWidget$ = new BehaviorSubject<WidgetInstance | null>(null);
  widgetsGallery$!: Observable<GalleryDisplay>;

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService,
    private readonly mobileActionsContextService: MobileActionsContextService,
    private readonly destroyRef: DestroyRef,
    private readonly mobileDashboardService: MobileDashboardService,
    private readonly widgetsSharedDataService: WidgetsSharedDataService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly navigationStackService: NavigationStackService
  ) {
  }

  ngOnInit(): void {
    const currentDashboardWidgets$ = this.dashboardContextService.selectedDashboard$.pipe(
      distinctUntilChanged((previous, current) => arraysEqual(previous.items.map(x => x.guid), current.items.map(x => x.guid))),
      map((dashboard) => dashboard.items)
    );

    this.widgets$ = combineLatest([
      currentDashboardWidgets$,
      this.widgetsMetaService.getWidgetsMeta().pipe(take(1))
    ]).pipe(
      map(([items, meta]) => items.map(x => ({
          instance: x,
          widgetMeta: meta.find(m => m.typeId === x.widgetType)
        } as WidgetInstance))
          .filter(x => (x.widgetMeta.mobileMeta?.enabled ?? false))
      ),
      shareReplay(1)
    );

    this.defaultWidgets$ = this.widgets$.pipe(
      map(widgets => widgets.filter(w => this.defaultWidgetNames.includes(w.instance.widgetType))),
      shareReplay(1)
    );

    // set default widget selection
    this.widgets$
      .pipe(take(1))
      .subscribe(widgets => {
        const homeWidget = widgets.find(w => w.instance.widgetType === this.homeWidgetId) ?? null;

        if(homeWidget != null) {
          this.selectedWidget$.next(homeWidget);
          this.navigationStackService.pushState({
            isFinal: true,
            widgetTarget: {
              typeId: homeWidget.instance.widgetType,
              instanceId: homeWidget.instance.guid
            }
          });
        }
      });

    this.mobileActionsContextService.actionEvents$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      switch (event.eventType) {
        case "instrumentSelected":
          this.selectWidget(this.newOrderWidgetId);
          break;
      }
    });

    this.widgetsSharedDataService.getDataProvideValues('selectedPrice').pipe(
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe(() => {
        this.selectWidget(this.newOrderWidgetId);
      });

    this.initWidgetsGallery();
    this.initNavigationProcessing();
  }

  selectWidget(widgetName: string, skipNavigationStackUpdate = true): void {
    this.widgets$
      .pipe(
        take(1),
        switchMap((widgets) => {
          const selectedWidget = widgets.find(w => w.instance.widgetType === widgetName);

          if (selectedWidget == null) {
            this.mobileDashboardService.addWidget(widgetName);
            return this.widgets$
              .pipe(
                take(1),
                map(newWidgets => newWidgets.find(w => w.instance.widgetType === widgetName)!)
              );
          } else {
            // Some widgets can be unlinked from current instrument. For example Options Board is unlinked after option selection
            // For such widgets need to restore link
            return this.widgetSettingsService.getSettingsOrNull<WidgetSettings>(selectedWidget.instance.guid).pipe(
              take(1),
              tap(s => {
                if(s != null && isInstrumentDependent(s) && (s.linkToActive === false)) {
                  this.widgetSettingsService.updateIsLinked(selectedWidget.instance.guid, true);
                }
              }),
              map(() => selectedWidget)
            );
          }
        })
      )
      .subscribe(newWidget => {
        this.selectedWidget$.next(newWidget);
        if(!skipNavigationStackUpdate) {
          this.navigationStackService.currentState$.pipe(
            take(1)
          ).subscribe(s => {
            if(s.widgetTarget.typeId !== newWidget.instance.widgetType) {
              this.navigationStackService.pushState({
                widgetTarget: {
                  typeId: newWidget.instance.widgetType,
                  instanceId: newWidget.instance.guid
                }
              });
            }
          });
        }
      });
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
    ])
      .pipe(
        map(([meta, lang]) => {
          const groups = new Map<WidgetCategory, WidgetDisplay[]>();

          const widgets = meta
            .filter(x => !!x.mobileMeta && x.mobileMeta.enabled && !this.defaultWidgetNames.includes(x.typeId))
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

  private initNavigationProcessing(): void {
    const initialUrl = window.location.href;
    history.pushState(
      {
      isApp: true
    },
      document.title,
      initialUrl
    );

    // process back button action
    this.navigationStackService.currentState$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(currentState => {
      this.selectedWidget$.pipe(
        take(1)
      ).subscribe(selectedWidget => {
        if(selectedWidget != null && selectedWidget.instance.widgetType != currentState.widgetTarget.typeId) {
          this.selectWidget(currentState.widgetTarget.typeId, true);
        }
      });
    });

    fromEvent(window, 'popstate').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.navigationStackService.popState();

      if(history.state == null || history.state.isApp == null) {
        history.pushState(
          {
            isApp: true
          },
          document.title,
          initialUrl
        );
      }
    });
  }
}
