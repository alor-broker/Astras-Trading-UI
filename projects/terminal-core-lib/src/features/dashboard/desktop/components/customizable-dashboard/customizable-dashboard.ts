import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  Type,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TerminalSettingsService} from '../../../../terminal-settings/services/terminal-settings.service';
import {WidgetsMetaService} from '../../../../widgets-gallery/services/widgets-meta.service';
import {
  CompactType,
  DisplayGrid,
  Draggable,
  Gridster,
  GridsterConfig,
  GridsterItem,
  GridsterItemConfig,
  GridType,
  PushDirections,
  Resizable
} from 'angular-gridster2';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap
} from 'rxjs';
import {GridType as TerminalGridType} from '../../../../terminal-settings/terminal-settings.types';
import {WidgetInstance} from '../../../types/dashboard-item.types';
import {WidgetMeta} from '../../../../widgets-gallery/services/widgets-meta-service.types';
import {
  DashboardItemPosition,
  Widget
} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {
  AsyncPipe,
  NgComponentOutlet
} from '@angular/common';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {WIDGET_COMPONENT_REGISTRY} from '@terminal-core-lib/features/dashboard/types/widget-component-registry.types';

interface Safe extends GridsterConfig {
  draggable: Draggable;
  resizable: Resizable;
  pushDirections: PushDirections;
}

interface WidgetItem {
  instance: WidgetInstance;
  gridsterItem: GridsterItemConfig;
  componentType: Type<any> | null;
}

@Component({
  selector: 'ats-customizable-dashboard',
  imports: [
    AsyncPipe,
    Gridster,
    GridsterItem,
    NgComponentOutlet
  ],
  templateUrl: './customizable-dashboard.html',
  styleUrl: './customizable-dashboard.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomizableDashboard implements OnInit {
  readonly gridster = viewChild(Gridster);

  protected options$!: Observable<Safe>;

  protected readonly displayItems = signal<WidgetItem[]>([]);

  protected readonly isBlockWidget = signal(false);

  protected readonly activeWidgetGuid = signal<string | null>(null);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroyRef = inject(DestroyRef);

  private readonly manageDashboardsService = inject(DesktopManageDashboardsService);

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  private readonly widgetsMetaService = inject(WidgetsMetaService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly widgetRegistry = inject(WIDGET_COMPONENT_REGISTRY);

  private readonly dashboardSize = {
    width: 50,
    itemDefaultWidth: 10,
    itemDefaultHeight: 18
  };

  ngOnInit(): void {
    this.options$ = this.terminalSettingsService.getSettings().pipe(
      take(1),
      map(x => x.designSettings?.gridType ?? TerminalGridType.Fit),
      map(gridType => {
        return {
          gridType: this.mapGridType(gridType),
          fixedRowHeight: 28,
          fixedColWidth: 30,
          compactType: CompactType.None,
          margin: 5,
          outerMargin: true,
          outerMarginTop: null,
          outerMarginRight: 6, // needs to fix bug when widget auto shrinks (#783)
          outerMarginBottom: null,
          outerMarginLeft: null,
          useTransformPositioning: true,
          mobileBreakpoint: 550,
          minCols: 50,
          maxCols: 100,
          minRows: 30,
          maxRows: 100,
          maxItemCols: 100,
          minItemCols: 1,
          maxItemRows: 100,
          minItemRows: 1,
          maxItemArea: 2500,
          minItemArea: 1,
          defaultItemCols: 1,
          defaultItemRows: 1,
          keepFixedHeightInMobile: true,
          keepFixedWidthInMobile: false,
          scrollSensitivity: 10,
          scrollSpeed: 20,
          enableEmptyCellClick: false,
          enableEmptyCellContextMenu: false,
          enableEmptyCellDrop: false,
          enableEmptyCellDrag: false,
          enableOccupiedCellDrop: false,
          emptyCellDragMaxCols: 50,
          emptyCellDragMaxRows: 50,
          ignoreMarginInRow: false,
          draggable: {
            enabled: true,
            start: (gridsterItem: any, gridsterItemComp: any): void => {
              gridsterItemComp.el.style.zIndex = '3';
              this.isBlockWidget.set(true);
            },
            stop: (gridsterItem: any, gridsterItemComp: any): void => {
              gridsterItemComp.el.style.zIndex = '2';
              this.isBlockWidget.set(false);
            }
          },
          resizable: {
            enabled: true,
            handles: {
              s: true, n: true, w: true, e: true, nw: true, ne: true, sw: true, se: false
              // se: false
            },
            start: (): void => {
              this.isBlockWidget.set(true);
            },
            stop: (): void => {
              this.isBlockWidget.set(false);
            }
          },
          pushDirections: {north: true, east: true, south: true, west: true},
          pushResizeItems: false,
          pushItems: false,
          swap: false,
          disablePushOnDrag: true,
          disablePushOnResize: false,
          displayGrid: DisplayGrid.None,
          disableWindowResize: false,
          disableWarnings: true,
          scrollToNewItems: false,
          itemChangeCallback: (gridItem: any): void => {
            this.updateWidgetPosition(
              gridItem.guid,
              {
                x: gridItem.x as number,
                y: gridItem.y as number,
                cols: gridItem.cols as number,
                rows: gridItem.rows as number
              }
            );
          }
        };
      }),
      shareReplay(1)
    );

    const meta$ = this.widgetsMetaService.getWidgetsMeta().pipe(
      filter(x => x != null)
    );

    const dashboardGuid$ = this.dashboardContextService.selectedDashboard$.pipe(
      map(d => d.guid),
      distinctUntilChanged()
    );

    combineLatest({
      guid: dashboardGuid$,
      meta: meta$
    }).pipe(
      switchMap(({guid, meta}) => {
        // Dashboard changed — clear items from previous dashboard
        this.displayItems.set([]);
        this.cdr.detectChanges();

        return this.dashboardContextService.selectedDashboard$.pipe(
          filter(d => d.guid === guid),
          map(d => d.items),
          distinctUntilChanged((prev, curr) => this.areItemsStructurallyEqual(prev, curr)),
          tap(items => this.checkNotPositionedItems(items, meta)),
          filter(items => items.every(item => !!item.position)),
          map(items => items.map(i => ({
            instance: {
              instance: i,
              widgetMeta: meta.find(m => m.typeId === i.widgetType)
            } as WidgetInstance,
            gridsterItem: {
              ...i.position!,
              guid: i.guid
            },
            componentType: this.widgetRegistry.get(i.widgetType) ?? null
          }))
            .filter(x => !!(x.instance.widgetMeta as WidgetMeta | undefined)))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      // Flush pending Gridster state before applying new items
      this.cdr.detectChanges();
      this.displayItems.set(items);
    });
  }

  protected getItemTrackKey(index: number, item: WidgetItem): string {
    return item.instance.instance.guid;
  }

  protected onWidgetMouseEnter(widgetGuid: string): void {
    this.activeWidgetGuid.set(widgetGuid);
  }

  protected onWidgetMouseLeave(widgetGuid: string): void {
    if (this.activeWidgetGuid() === widgetGuid) {
      this.activeWidgetGuid.set(null);
    }
  }

  private updateWidgetPosition(widgetGuid: string, position: DashboardItemPosition): void {
    this.manageDashboardsService.updateWidgetPositions([{widgetGuid, position}]);
  }

  private checkNotPositionedItems(items: Widget[], meta: WidgetMeta[]): void {
    this.options$.pipe(
      take(1)
    ).subscribe(options => {
      const notPositionedItem = items.find(x => !x.position);
      if (notPositionedItem) {
        const newPosition = {
          x: 0,
          y: 0,
          cols: this.dashboardSize.itemDefaultWidth,
          rows: this.dashboardSize.itemDefaultHeight
        };

        const otherPositionUpdates: { widgetGuid: string, position: DashboardItemPosition } [] = [];

        const widgetMeta = meta.find(m => m.typeId === notPositionedItem.widgetType);
        if (widgetMeta) {
          if (widgetMeta.desktopMeta?.addOptions.initialHeight != null) {
            newPosition.rows = widgetMeta.desktopMeta.addOptions.initialHeight;
          }

          if (widgetMeta.desktopMeta?.addOptions.initialWidth != null) {
            newPosition.cols = widgetMeta.desktopMeta.addOptions.initialWidth;
          }

          if (notPositionedItem.initialSize != null) {
            newPosition.rows = notPositionedItem.initialSize.rows;
            newPosition.cols = notPositionedItem.initialSize.cols;
          }

          const gridster = this.gridster();
          if (widgetMeta.desktopMeta?.addOptions.initialHeightPx != null && gridster?.curRowHeight != null) {
            const expectedHeight = widgetMeta.desktopMeta.addOptions.initialHeightPx;
            let rowsHeight: number;
            if (gridster.curRowHeight > expectedHeight) {
              rowsHeight = 1;
            } else {
              rowsHeight = Math.ceil(expectedHeight / gridster.curRowHeight);
            }

            newPosition.rows = rowsHeight;
          }

          const positionedItems = items.filter(x => !!x.position);

          if (widgetMeta.desktopMeta?.addOptions.isFullWidth ?? false) {
            newPosition.cols = gridster?.columns ?? options.minCols ?? this.dashboardSize.width;
          }

          const topOffset = newPosition.y + newPosition.rows;
          if (widgetMeta.desktopMeta?.addOptions.initialPosition === "top") {
            if (positionedItems.some(w => newPosition.y >= w.position!.y && newPosition.y <= (w.position!.y + w.position!.rows))) {
              positionedItems
                .filter(w => w.position!.y >= newPosition.y)
                .forEach(w => {
                  otherPositionUpdates.push({
                    widgetGuid: w.guid,
                    position: {
                      ...w.position!,
                      y: w.position!.y + topOffset
                    }
                  });
                });
            }
          } else if (widgetMeta.desktopMeta?.addOptions.initialPosition === "below" && gridster!.grid.length > 0) {
            newPosition.y = Math.max(...gridster!.grid.map(x => {
              const itemConfig = x.item();
              return itemConfig.y + itemConfig.rows;
            }));
          }
        }

        this.manageDashboardsService.updateWidgetPositions([
          {widgetGuid: notPositionedItem.guid, position: newPosition},
          ...otherPositionUpdates
        ]);
      }
    });
  }

  private areItemsStructurallyEqual(prev: Widget[], curr: Widget[]): boolean {
    if (prev.length !== curr.length) {
      return false;
    }

    return prev.every((item, index) =>
      item.guid === curr[index].guid && !!item.position === !!curr[index].position
    );
  }

  private mapGridType(terminalGridType: TerminalGridType): GridType {
    switch (terminalGridType) {
      case TerminalGridType.VerticalFixed:
        return GridType.VerticalFixed;
      case TerminalGridType.HorizontalFixed:
        return GridType.HorizontalFixed;
      default:
        return GridType.Fit;
    }
  }
}
