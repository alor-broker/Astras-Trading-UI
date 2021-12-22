import { Component, EventEmitter, OnInit } from '@angular/core';
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
import { Observable } from 'rxjs';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { DashboardService } from '../../services/dashboard.service';

interface Safe extends GridsterConfig {
  draggable: Draggable;
  resizable: Resizable;
  pushDirections: PushDirections;
}

@Component({
  selector: 'ats-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass'],
})
export class DashboardComponent implements OnInit {
  options!: Safe;
  dashboard$!: Observable<Widget[]>;

  resize: EventEmitter<GridsterItem> = new EventEmitter<GridsterItem>();
  constructor(private service: DashboardService) {}

  ngOnInit(): void {
    this.options = {
      gridType: GridType.Fit,
      compactType: CompactType.None,
      margin: 10,
      outerMargin: true,
      outerMarginTop: null,
      outerMarginRight: null,
      outerMarginBottom: null,
      outerMarginLeft: null,
      useTransformPositioning: true,
      mobileBreakpoint: 640,
      minCols: 1,
      maxCols: 100,
      minRows: 1,
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
      fixedRowHeight: 105,
      keepFixedHeightInMobile: false,
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
      },
      resizable: {
        enabled: true,
      },
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: false,
      pushItems: true,
      swap: false,
      disablePushOnDrag: false,
      disablePushOnResize: false,
      displayGrid: DisplayGrid.Always,
      disableWindowResize: false,
      disableWarnings: false,
      scrollToNewItems: false,
      itemResizeCallback: (item, e) => {
        // update DB with new size
        // send the update to widgets
        // this.resize.emit({ item: item, height: e.height, width: e.width });
        this.resize.emit({...item, height: e.height, width: e.width });
      },
    };

    this.dashboard$ = this.service.dashboard$;
  }

  changedOptions(): void {
    if (this.options.api && this.options.api.optionsChanged) {
      this.options.api.optionsChanged();
    }
  }
}
