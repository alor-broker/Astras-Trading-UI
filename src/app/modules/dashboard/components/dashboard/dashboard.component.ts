import {
  Component,
  OnInit
} from '@angular/core';
import {
  CompactType,
  DisplayGrid,
  Draggable,
  GridsterConfig,
  GridsterItem,
  GridType,
  PushDirections,
  Resizable,
} from 'angular-gridster2';
import {
  map,
  Observable
} from 'rxjs';
import { ManageDashboardsService } from 'src/app/shared/services/manage-dashboards.service';
import {
  DashboardItemPosition,
  Widget
} from '../../../../shared/models/dashboard/widget.model';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { mobileBreakpoint } from '../../../../shared/utils/device-helper';

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
  options!: Safe;
  items$?: Observable<WidgetItem[]>;
  isBlockWidget = false;

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService
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

    this.items$ = this.dashboardContextService.selectedDashboard$.pipe(
      map(d => d.items.map(i => ({
        widget: i,
        gridsterItem: {
          ...i.position,
          guid: i.guid
        }
      })))
    );
  }

  updateWidgetPosition(widgetGuid: string, position: DashboardItemPosition) {
    this.manageDashboardsService.updateWidgetPosition(widgetGuid, position);
  }

  getItemTrackKey(index: number, item: WidgetItem): string {
    return item.widget.guid;
  }
}
