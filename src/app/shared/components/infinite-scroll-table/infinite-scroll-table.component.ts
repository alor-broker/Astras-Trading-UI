import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges, OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ColumnsSettings } from "../../models/columns-settings.model";
import { NzTableComponent } from "ng-zorro-antd/table";
import { Subject, takeUntil } from "rxjs";
import { ITEM_HEIGHT } from "../../../modules/all-trades/utils/all-trades.utils";

@Component({
  selector: 'ats-infinite-scroll-table',
  templateUrl: './infinite-scroll-table.component.html',
  styleUrls: ['./infinite-scroll-table.component.less']
})
export class InfiniteScrollTableComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input() public trackByFn = (data: any) => data.id;
  @Input() public tableContainerHeight = 100;
  @Input() public tableContainerWidth = 100;
  @Input() public data: Array<any> = [];
  @Input() public isLoading = false;
  @Input() public columns: Array<ColumnsSettings> = [];

  @Output() public rowClick = new EventEmitter();
  @Output() public scrolled = new EventEmitter();

  @ViewChild('dataTable', {static: false}) public dataTable!: NzTableComponent<any>;
  @ViewChild('tableRow') headerRowEl!: ElementRef;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private visibleItemsCount = 1;
  public itemHeight = ITEM_HEIGHT;
  public scrollHeight = 0;

  constructor() {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tableContainerHeight || changes.tableContainerWidth) {
      this.scrollHeight = this.tableContainerHeight - this.headerRowEl?.nativeElement?.clientHeight;
      this.visibleItemsCount = Math.ceil(this.scrollHeight / this.itemHeight);
    }
  }

  public ngAfterViewInit(): void {
    this.dataTable?.cdkVirtualScrollViewport?.scrolledIndexChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((upperItemIndex: number) => {
        if (upperItemIndex >= this.data.length - this.visibleItemsCount - 1) {
          this.scrolled.emit();
        }
      });
  }

  public getWidthArr() {
    return this.columns.map(col => col.width || 'auto');
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
