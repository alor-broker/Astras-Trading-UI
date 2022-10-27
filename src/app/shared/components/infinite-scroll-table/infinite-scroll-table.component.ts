import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ColumnsSettings, FilterData } from "../../models/columns-settings.model";
import { NzTableComponent } from "ng-zorro-antd/table";
import { Subject, takeUntil } from "rxjs";
import { ITEM_HEIGHT } from "../../../modules/all-trades/utils/all-trades.utils";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { debounceTime } from "rxjs/operators";
import { ContextMenu } from "../../models/infinite-scroll-table.model";
import { NzContextMenuService, NzDropdownMenuComponent } from "ng-zorro-antd/dropdown";

@Component({
  selector: 'ats-infinite-scroll-table',
  templateUrl: './infinite-scroll-table.component.html',
  styleUrls: ['./infinite-scroll-table.component.less']
})
export class InfiniteScrollTableComponent implements OnChanges, AfterViewInit, OnDestroy, OnInit {
  private tableData: Array<any> = [];

  @Input() public trackByFn = (data: any) => data.id;
  @Input() public tableContainerHeight = 100;
  @Input() public tableContainerWidth = 100;
  @Input() public isLoading = false;
  @Input() public columns: Array<ColumnsSettings> = [];
  @Input() public contextMenu: Array<ContextMenu> = [];

  @Input() public set data(value: Array<any> ){
    if(this.tableData.length > value.length) {
      this.dataTable?.cdkVirtualScrollViewport?.scrollToIndex(0);
    }

    this.tableData = value;
  }

  public get data(): Array<any> {
    return this.tableData;
  }

  @Output() public rowClick = new EventEmitter();
  @Output() public scrolled = new EventEmitter();
  @Output() public filterApplied = new EventEmitter();

  @ViewChild('dataTable', {static: false}) public dataTable!: NzTableComponent<any>;
  @ViewChild('tableRow') headerRowEl!: ElementRef;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private visibleItemsCount = 1;
  public itemHeight = ITEM_HEIGHT;
  public scrollHeight = 0;
  public filtersForm = new UntypedFormGroup({});
  public activeFilterName = '';
  public sortedColumnName = '';
  public sortedColumnOrder: string | null = '';
  public selectedRow: any = null;

  constructor(
    private readonly nzContextMenuService: NzContextMenuService,
  ) {
  }

  ngOnInit() {
    this.columns
      .filter(col => !!col.filterData)
      .map(col => col.filterData!)
      .forEach(filter => {
        if (!filter.isInterval) {
          this.filtersForm.addControl(filter.filterName, new UntypedFormControl(''));
        } else {
          this.filtersForm.addControl(filter.intervalStartName!, new UntypedFormControl(''));
          this.filtersForm.addControl(filter.intervalEndName!, new UntypedFormControl(''));
        }
      });

    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(val => this.filterApplied.emit(val));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tableContainerHeight || changes.tableContainerWidth) {
      this.calculateScrollHeight();
    }
  }

  public ngAfterViewInit(): void {
    this.dataTable?.cdkVirtualScrollViewport?.scrolledIndexChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((upperItemIndex: number) => {
        if (upperItemIndex >= this.data.length - this.visibleItemsCount - 1) {
          this.scrolled.emit(this.filtersForm.value);
        }
      });
    this.calculateScrollHeight();
  }

  public getWidthArr() {
    return this.columns.map(col => col.width || 'auto');
  }

  public getFilterControl(filterName: string): UntypedFormControl | null {
    return this.filtersForm.get(filterName) as UntypedFormControl;
  }

  public resetFilter(filterData: FilterData) {
    if (filterData.isInterval) {
      this.getFilterControl(filterData.intervalStartName!)?.reset('');
      this.getFilterControl(filterData.intervalEndName!)?.reset('');
    } else {
      this.getFilterControl(filterData.filterName)?.reset('');
    }
  }

  public openedFilterChange(name: string, isOpened: boolean) {
      this.activeFilterName = isOpened ? name : '';
  }

  public defaultFilterChange(name: string, value: string) {
    this.getFilterControl(name)?.setValue(value);
  }

  public sortChange(e: string | null, column: ColumnsSettings) {
    this.sortedColumnName = column.name;
    this.sortedColumnOrder = e;
    column.sortFn!(e);
  }

  public openContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, selectedRow: any): void {
    this.selectedRow = selectedRow;
    this.nzContextMenuService.create($event, menu);
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private calculateScrollHeight() {
    this.scrollHeight = this.tableContainerHeight -
      InfiniteScrollTableComponent.getElementHeight(this.headerRowEl?.nativeElement);
    this.visibleItemsCount = Math.ceil(this.scrollHeight / this.itemHeight);
  }

  private static getElementHeight(el?: any) {
    let elHeight = 0;
    if (el) {
      elHeight = el.offsetHeight;
      elHeight += parseInt(window.getComputedStyle(el).getPropertyValue('margin-top'));
      elHeight += parseInt(window.getComputedStyle(el).getPropertyValue('margin-bottom'));
    }

    return elHeight || 0;
  }
}
