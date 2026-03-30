import {Component, DestroyRef, inject, model, OnInit} from "@angular/core";
import {
  combineLatest,
  distinctUntilChanged, filter,
  fromEvent,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import {WidgetInstance} from "../../../shared/models/dashboard/dashboard-item.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {WidgetCategory} from "../../../shared/models/widget-meta.model";
import {WidgetsHelper} from "../../../shared/utils/widgets";
import {
  GalleryDisplay,
  WidgetDisplay,
  WidgetGroup,
  WidgetsGalleryComponent
} from "../../../modules/dashboard/components/widgets-gallery/widgets-gallery.component";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {WidgetsMetaService} from "../../../shared/services/widgets-meta.service";
import {TranslatorService} from "../../../shared/services/translator.service";
import {MobileActionsContextService} from "../../../modules/dashboard/services/mobile-actions-context.service";
import {MobileDashboardService} from "../../../modules/dashboard/services/mobile-dashboard.service";
import {WidgetsSharedDataService} from "../../../shared/services/widgets-shared-data.service";
import {map} from "rxjs/operators";
import {arraysEqual} from "ng-zorro-antd/core/util";
import {LetDirective} from "@ngrx/component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {WidgetSettingsService} from "../../../shared/services/widget-settings.service";
import {WidgetSettings} from "../../../shared/models/widget-settings.model";
import {isInstrumentDependent} from "../../../shared/utils/settings-helper";
import {NavigationStackService} from "../../../shared/services/navigation-stack.service";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {TranslocoDirective} from "@jsverse/transloco";
import {ParentWidgetComponent} from "../../../modules/dashboard/components/parent-widget/parent-widget.component";
import {TerminalSettingsService} from "../../../shared/services/terminal-settings.service";
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {MobileLayoutHelper} from "../../../shared/utils/mobile-layout.helper";
import {ArrayHelper} from "../../../shared/utils/array-helper";

interface QuickAccessPanelWidget extends WidgetInstance {
  isSelectedByDefault: boolean;
}

interface SelectedWidget extends WidgetInstance {
  isDefaultPanelWidget: boolean;
}

@Component({
  selector: 'ats-mobile-dashboard-content',
  templateUrl: './mobile-dashboard-content.component.html',
  styleUrls: ['./mobile-dashboard-content.component.less'],
  imports: [
    LetDirective,
    NzIconDirective,
    WidgetsGalleryComponent,
    NzButtonComponent,
    TranslocoDirective,
    ParentWidgetComponent
  ]
})
export class MobileDashboardContentComponent implements OnInit {
  galleryVisible = false;

  widgets$!: Observable<WidgetInstance[]>;

  quickAccessPanelWidgets$!: Observable<QuickAccessPanelWidget[]>;

  readonly selectedWidget = model<SelectedWidget | null>(null);

  widgetsGallery$!: Observable<GalleryDisplay>;

  private readonly dashboardContextService = inject(DashboardContextService);

  private readonly widgetsMetaService = inject(WidgetsMetaService);

  private readonly translatorService = inject(TranslatorService);

  private readonly mobileActionsContextService = inject(MobileActionsContextService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly mobileDashboardService = inject(MobileDashboardService);

  private readonly widgetsSharedDataService = inject(WidgetsSharedDataService);

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly navigationStackService = inject(NavigationStackService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly manageDashboardsService = inject(ManageDashboardsService);

  readonly getQuickAccessPanelLayout$ = MobileLayoutHelper.getQuickAccessPanelWidgets(this.terminalSettingsService, this.manageDashboardsService)
    .pipe(
      shareReplay(1)
    );

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
          .filter(x => (x.widgetMeta != null && (x.widgetMeta.mobileMeta?.enabled ?? false)))
      ),
      shareReplay(1)
    );

    this.quickAccessPanelWidgets$ = combineLatest({
      allWidgets: this.widgets$,
      layout: this.getQuickAccessPanelLayout$
    }).pipe(
      map(x => {
        return x.layout.map(i => {
          const mapped = x.allWidgets.find(w => w.widgetMeta.typeId === i.widgetType);
          if (mapped == null) {
            return null;
          }

          return {
            ...mapped,
            isSelectedByDefault: i.selectedByDefault ?? false
          } satisfies QuickAccessPanelWidget;
        })
          .filter(i => i != null);
      }),
      shareReplay(1)
    );

    // set default widget selection
    this.quickAccessPanelWidgets$
      .pipe(take(1))
      .subscribe(widgets => {
        let defaultSelection = widgets.find(w => w.isSelectedByDefault) ?? null;
        defaultSelection ??= widgets.find(w => w.widgetMeta.typeId === 'trade-screen') ?? null;
        defaultSelection ??= ArrayHelper.firstOrNull(widgets);

        if (defaultSelection != null) {
          this.selectedWidget.set({
            ...defaultSelection,
            isDefaultPanelWidget: true
          });

          this.navigationStackService.pushState({
            isFinal: true,
            widgetTarget: {
              typeId: defaultSelection.instance.widgetType,
              instanceId: defaultSelection.instance.guid
            }
          });
        }
      });

    this.mobileActionsContextService.actionEvents$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      switch (event.eventType) {
        case "instrumentSelected":
          this.openPreferredOrderWidget();
          break;
      }
    });

    this.widgetsSharedDataService.getDataProvideValues('selectedPrice').pipe(
      filter(x => x != null),
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe(() => {
        this.openExtendedOrderWidget();
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
                if (s != null && isInstrumentDependent(s) && (s.linkToActive === false)) {
                  this.widgetSettingsService.updateIsLinked(selectedWidget.instance.guid, true);
                }
              }),
              map(() => selectedWidget)
            );
          }
        }),
        withLatestFrom(this.getQuickAccessPanelLayout$)
      )
      .subscribe(([newWidget, defaultPanelWidgets]) => {
        const isDefaultPanelWidget = defaultPanelWidgets.find(i => i.widgetType === newWidget.instance.widgetType) != null;

        this.selectedWidget.set({
          ...newWidget,
          isDefaultPanelWidget
        });

        if (!skipNavigationStackUpdate) {
          this.navigationStackService.currentState$.pipe(
            take(1)
          ).subscribe(s => {
            if (s.widgetTarget.typeId !== newWidget.instance.widgetType) {
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

  protected openPreferredOrderWidget(skipNavigationStackUpdate = true): void {
    combineLatest({
      allWidgets: this.widgets$,
      layout: this.getQuickAccessPanelLayout$,
    }).pipe(
      take(1)
    ).subscribe(x => {
      const orderWidgets = x.allWidgets.filter(w => w.widgetMeta.mobileMeta?.isOrderWidget ?? false);
      if (orderWidgets.length === 0) {
        return;
      }

      if (orderWidgets.length === 1) {
        this.selectWidget(orderWidgets[0].instance.widgetType, skipNavigationStackUpdate);
        return;
      }

      const preferredWidget = x.layout.find(i => i.isPreferredOrderWidget ?? false);
      if (preferredWidget == null) {
        this.selectWidget(orderWidgets[0].instance.widgetType, skipNavigationStackUpdate);
        return;
      }

      const target = x.allWidgets.find(w => w.instance.widgetType === preferredWidget.widgetType);
      if (target != null) {
        this.selectWidget(target.instance.widgetType, skipNavigationStackUpdate);
        return;
      }

      this.selectWidget(orderWidgets[0].instance.widgetType, skipNavigationStackUpdate);
    });
  }

  protected openExtendedOrderWidget(): void {
    this.widgets$.pipe(
      take(1)
    ).subscribe(allWidgets => {
      const extendedOrderWidget = allWidgets.find(w => w.widgetMeta.typeId === 'order-submit');
      if (extendedOrderWidget != null) {
        this.selectWidget(extendedOrderWidget.widgetMeta.typeId, true);
        return;
      }

      const orderWidgets = allWidgets.filter(w => w.widgetMeta.mobileMeta?.isOrderWidget ?? false);
      if (orderWidgets.length === 0) {
        return;
      }

      this.selectWidget(orderWidgets[0].instance.widgetType, true);
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

    this.widgetsGallery$ = combineLatest(
      {
        layout: this.getQuickAccessPanelLayout$,
        meta: this.widgetsMetaService.getWidgetsMeta(),
        lang: this.translatorService.getLangChanges()
      }
    ).pipe(
      map(x => {
          const groups = new Map<WidgetCategory, WidgetDisplay[]>();

          const widgets = x.meta
            .filter(w => !!w.mobileMeta && w.mobileMeta.enabled && x.layout.find(i => i.widgetType === w.typeId) == null)
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
              name: WidgetsHelper.getWidgetName(widgetMeta.mobileMeta?.widgetName ?? widgetMeta.widgetName, x.lang),
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
      const selectedWidget = this.selectedWidget();
      if (selectedWidget != null && selectedWidget.instance.widgetType != currentState.widgetTarget.typeId) {
        this.selectWidget(currentState.widgetTarget.typeId, true);
      }
    });

    fromEvent(window, 'popstate').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.navigationStackService.popState();

      if (history.state == null || history.state.isApp == null) {
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
