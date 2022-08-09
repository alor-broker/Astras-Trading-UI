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
import { ColumnsSettings } from "../../models/columns-settings.model";
import { NzTableComponent } from "ng-zorro-antd/table";
import { Subject, takeUntil } from "rxjs";
import { ITEM_HEIGHT } from "../../../modules/all-trades/utils/all-trades.utils";
import { FormControl, FormGroup } from "@angular/forms";
import { debounceTime } from "rxjs/operators";

@Component({
  selector: 'ats-infinite-scroll-table',
  templateUrl: './infinite-scroll-table.component.html',
  styleUrls: ['./infinite-scroll-table.component.less']
})
export class InfiniteScrollTableComponent implements OnChanges, AfterViewInit, OnDestroy, OnInit {

  @Input() public trackByFn = (data: any) => data.id;
  @Input() public tableContainerHeight = 100;
  @Input() public tableContainerWidth = 100;
  @Input() public data: Array<any> = [];
  @Input() public isLoading = false;
  @Input() public columns: Array<ColumnsSettings> = [];

  @Output() public rowClick = new EventEmitter();
  @Output() public scrolled = new EventEmitter();
  @Output() public filterApplied = new EventEmitter();

  @ViewChild('dataTable', {static: false}) public dataTable!: NzTableComponent<any>;
  @ViewChild('tableRow') headerRowEl!: ElementRef;
  private filtersBtnEl!: any;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private visibleItemsCount = 1;
  public itemHeight = ITEM_HEIGHT;
  public scrollHeight = 0;
  public filtersForm = new FormGroup({});
  public activeFilterName = '';

  constructor(
    private elRef: ElementRef
  ) {
  }

  ngOnInit() {
    this.columns.filter(col => col.isFiltering)
      .forEach(filter => {
      this.filtersForm.addControl(filter.name, new FormControl(''));
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
      this.scrollHeight = this.tableContainerHeight -
        (
          InfiniteScrollTableComponent.getElementHeight(this.headerRowEl?.nativeElement) +
          InfiniteScrollTableComponent.getElementHeight(this.filtersBtnEl)
        );
      this.visibleItemsCount = Math.ceil(this.scrollHeight / this.itemHeight);
    }
  }

  public ngAfterViewInit(): void {
    this.filtersBtnEl = this.elRef.nativeElement.querySelector('.filters-btn');
    this.dataTable?.cdkVirtualScrollViewport?.scrolledIndexChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((upperItemIndex: number) => {
        if (upperItemIndex >= this.data.length - this.visibleItemsCount - 1) {
          this.scrolled.emit(this.filtersForm.value);
        }
      });
  }

  public applyFilter() {
    this.filterApplied.emit(this.filtersForm.value);
  }

  public getWidthArr() {
    return this.columns.map(col => col.width || 'auto');
  }

  public getFilterControl(colName: string): FormControl {
    return this.filtersForm.get(colName) as FormControl;
  }

  public resetFilter(colName: string) {
    this.getFilterControl(colName).reset('');
  }

  public openedFilterChange(name: string, isOpened: boolean) {
      this.activeFilterName = isOpened ? name : '';
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
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
