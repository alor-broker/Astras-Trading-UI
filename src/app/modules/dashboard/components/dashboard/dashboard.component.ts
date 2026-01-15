import { Component, OnInit, viewChild, inject } from '@angular/core';
import { CompactType, DisplayGrid, Draggable, GridsterComponent, GridsterConfig, GridsterItem, GridType, PushDirections, Resizable, GridsterItemComponent } from 'angular-gridster2';
import {
  combineLatest,
  map,
  Observable,
  shareReplay,
  take,
  tap
} from 'rxjs';
import { ManageDashboardsService } from 'src/app/shared/services/manage-dashboards.service';
import {
  DashboardItemPosition,
  Widget
} from '../../../../shared/models/dashboard/widget.model';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { mobileBreakpoint } from '../../../../shared/utils/device-helper';
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { filter } from "rxjs/operators";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { GridType as TerminalGridType } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { ParentWidgetComponent } from '../parent-widget/parent-widget.component';
import { AsyncPipe } from '@angular/common';
interface Safe extends GridsterConfig {
  draggable: Draggable;
  resizable: Resizable;
  pushDirections: PushDirections;
}

interface WidgetItem { instance: WidgetInstance, gridsterItem: GridsterItem }

@Component({
    selector: 'ats-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    imports: [
      GridsterComponent,
      GridsterItemComponent,
      ParentWidgetComponent,
      AsyncPipe
    ]
})
export class DashboardComponent implements OnInit {
  private readonly manageDashboardsService = inject(ManageDashboardsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly widgetsMetaService = inject(WidgetsMetaService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  readonly gridster = viewChild(GridsterComponent);

  options$!: Observable<Safe>;
  items$?: Observable<WidgetItem[]>;
  isBlockWidget = false;
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
          mobileBreakpoint,
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
              this.isBlockWidget = true;
            },
            stop: (gridsterItem: any, gridsterItemComp: any): void => {
              gridsterItemComp.el.style.zIndex = '2';
              this.isBlockWidget = false;
            }
          },
          resizable: {
            enabled: true,
            handles: {
              s: true, n: true, w: true, e: true, nw: true, ne: true, sw: true, se: false
              // se: false
            },
            start: (): void => {
              this.isBlockWidget = true;
            },
            stop: (): void => {
              this.isBlockWidget = false;
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

    const currentItems$ = this.dashboardContextService.selectedDashboard$.pipe(
      map(s => s.items),
      shareReplay(1)
    );

    this.items$ = combineLatest([
      this.widgetsMetaService.getWidgetsMeta(),
      currentItems$
    ]).pipe(
      tap(([meta, items]) => this.checkNotPositionedItems(items, meta)),
      filter(([, items]) => items.every(x => !!x.position)),
      map(([meta, items]) => items.map(i => ({
          instance: {
            instance: i,
            widgetMeta: meta.find(m => m.typeId === i.widgetType)
          } as WidgetInstance,
          gridsterItem: {
            ...i.position!,
            guid: i.guid
          }
        }))
          .filter(x => !!(x.instance.widgetMeta as WidgetMeta | undefined))
      )
    );
  }

  updateWidgetPosition(widgetGuid: string, position: DashboardItemPosition): void {
    this.manageDashboardsService.updateWidgetPositions([{widgetGuid, position}]);
  }

  getItemTrackKey(index: number, item: WidgetItem): string {
    return item.instance.instance.guid;
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

          if(notPositionedItem.initialSize != null) {
            newPosition.rows = notPositionedItem.initialSize.rows;
            newPosition.cols = notPositionedItem.initialSize.cols;
          }

          const gridster = this.gridster();
          if (widgetMeta.desktopMeta?.addOptions.initialHeightPx != null && gridster?.curRowHeight != null) {
            const expectedHeight = widgetMeta.desktopMeta.addOptions.initialHeightPx;
            let rowsHeight: number;
            if(gridster.curRowHeight > expectedHeight) {
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
          } else if(widgetMeta.desktopMeta?.addOptions.initialPosition === "below" && gridster!.grid.length > 0) {
            newPosition.y = Math.max(...gridster!.grid.map(x => x.item.y + x.item.rows));
          }
        }

        this.manageDashboardsService.updateWidgetPositions([
          {widgetGuid: notPositionedItem.guid, position: newPosition},
          ...otherPositionUpdates
        ]);
      }
    });
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
