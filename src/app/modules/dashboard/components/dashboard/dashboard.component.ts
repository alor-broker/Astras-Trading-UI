import {Component, OnInit, ViewChild} from '@angular/core';
import {
  CompactType,
  DisplayGrid,
  Draggable, GridsterComponent,
  GridsterConfig,
  GridsterItem,
  GridType,
  PushDirections,
  Resizable,
} from 'angular-gridster2';
import {combineLatest, map, Observable, shareReplay, tap} from 'rxjs';
import {ManageDashboardsService} from 'src/app/shared/services/manage-dashboards.service';
import {DashboardItemPosition, Widget} from '../../../../shared/models/dashboard/widget.model';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {mobileBreakpoint} from '../../../../shared/utils/device-helper';
import {WidgetsMetaService} from "../../../../shared/services/widgets-meta.service";
import {filter} from "rxjs/operators";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";

interface Safe extends GridsterConfig {
  draggable: Draggable;
  resizable: Resizable;
  pushDirections: PushDirections;
}

type WidgetItem = { widget: Widget, gridsterItem: GridsterItem };

@Component({
  selector: 'ats-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
  @ViewChild(GridsterComponent)
  gridster?: GridsterComponent;

  private readonly dashboardSize = {
    width: 50,
    itemDefaultWidth: 10,
    itemDefaultHeight: 18
  };

  options!: Safe;
  items$?: Observable<WidgetItem[]>;
  isBlockWidget = false;

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly widgetsMetaService: WidgetsMetaService
  ) {
  }

  ngOnInit(): void {
    this.options = {
      gridType: GridType.Fit,
      compactType: CompactType.None,
      margin: 5,
      outerMargin: true,
      outerMarginTop: null,
      outerMarginRight: null,
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
      fixedColWidth: 105,
      fixedRowHeight: 30,
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
        start: (gridsterItem, gridsterItemComp) => {
          gridsterItemComp.el.style.zIndex = '3';
          this.isBlockWidget = true;
        },
        stop: (gridsterItem, gridsterItemComp) => {
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
        start: () => {
          this.isBlockWidget = true;
        },
        stop: () => {
          this.isBlockWidget = false;
        }
      },
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: false,
      pushItems: true,
      swap: false,
      disablePushOnDrag: true,
      disablePushOnResize: false,
      displayGrid: DisplayGrid.None,
      disableWindowResize: false,
      disableWarnings: true,
      scrollToNewItems: false,
      itemChangeCallback: gridItem => {
        this.updateWidgetPosition(
          gridItem.guid,
          {
            x: gridItem.x,
            y: gridItem.y,
            cols: gridItem.cols,
            rows: gridItem.rows
          }
        );
      }
    };

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
      map(([, items]) => items.map(i => ({
        widget: i,
        gridsterItem: {
          ...i.position!,
          guid: i.guid
        }
      })))
    );
  }

  updateWidgetPosition(widgetGuid: string, position: DashboardItemPosition) {
    this.manageDashboardsService.updateWidgetPositions([{widgetGuid, position}]);
  }

  getItemTrackKey(index: number, item: WidgetItem): string {
    return item.widget.guid;
  }

  private checkNotPositionedItems(items: Widget[], meta: WidgetMeta[]){
    const notPositionedItem = items.find(x => !x.position);
    if(notPositionedItem) {
      const newPosition = {
        x: 0,
        y: 0,
        cols: this.dashboardSize.itemDefaultWidth,
        rows: this.dashboardSize.itemDefaultHeight
      };

      const otherPositionUpdates: { widgetGuid: string, position: DashboardItemPosition } [] = [];

      const widgetMeta = meta.find(m => m.typeId === notPositionedItem.widgetType);
      if (widgetMeta) {
        if (widgetMeta.desktopMeta?.initialHeight != null) {
          newPosition.rows = widgetMeta.desktopMeta.initialHeight;
        }

        const positionedItems = items.filter(x => !!x.position);

        if (widgetMeta.desktopMeta?.initialWidth === "full-width") {
          newPosition.cols = this.gridster?.columns ?? this.options.minCols ?? this.dashboardSize.width;
        }

        const topOffset = newPosition.y + newPosition.rows;
        if(widgetMeta.desktopMeta?.initialPosition === "top") {
          if(positionedItems.some(w => newPosition.y >= w.position!.y && newPosition.y <= (w.position!.y + w.position!.rows))) {
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
        }
      }

      this.manageDashboardsService.updateWidgetPositions([
        {widgetGuid: notPositionedItem.guid, position: newPosition},
        ...otherPositionUpdates
      ]);
    }
  }
}
