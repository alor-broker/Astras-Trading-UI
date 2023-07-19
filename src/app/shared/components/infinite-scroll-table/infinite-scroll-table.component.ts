import {
  AfterViewInit, Component, DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { NzTableComponent } from "ng-zorro-antd/table";
import {filter, Observable, shareReplay, switchMap, take} from "rxjs";
import { ITEM_HEIGHT } from "../../../modules/all-trades/utils/all-trades.utils";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import {debounceTime, map, startWith} from "rxjs/operators";
import { ContextMenu } from "../../models/infinite-scroll-table.model";
import { NzContextMenuService, NzDropdownMenuComponent } from "ng-zorro-antd/dropdown";
import { TableConfig } from '../../models/table-config.model';
import { BaseColumnSettings, FilterData } from "../../models/settings/table-settings.model";
import {ViewChildren} from "@angular/core";
import {QueryList} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-infinite-scroll-table',
  templateUrl: './infinite-scroll-table.component.html',
  styleUrls: ['./infinite-scroll-table.component.less']
})
export class InfiniteScrollTableComponent implements OnChanges, AfterViewInit, OnInit {
  private tableData: Array<any> = [];

  @Input() trackByFn = (data: any) => data.id;
  @Input() tableContainerHeight = 100;
  @Input() tableContainerWidth = 100;
  @Input() isLoading = false;
  @Input({required: true}) tableConfig: TableConfig<any> | null = null;
  @Input() public contextMenu: Array<ContextMenu> = [];

  @Input() public set data(value: Array<any> ){
    if(this.tableData.length > value.length) {
      this.tableRef$?.pipe(
        take(1)
      ).subscribe(x => x.cdkVirtualScrollViewport?.scrollToIndex(0));
    }

    this.tableData = value;
  }

  public get data(): Array<any> {
    return this.tableData;
  }

  @Output()
  rowClick = new EventEmitter();
  @Output()
  scrolled = new EventEmitter();
  @Output()
  filterApplied = new EventEmitter();

  @ViewChildren('dataTable')
  dataTableQuery!: QueryList<NzTableComponent<any>>;

  @ViewChildren('headerRow')
  headerRowEl!: QueryList<ElementRef>;

  private visibleItemsCount = 1;
  private tableRef$?: Observable<NzTableComponent<any>>;

  itemHeight = ITEM_HEIGHT;
  scrollHeight = 0;
  filtersForm = new UntypedFormGroup({});
  activeFilterName = '';
  sortedColumnId = '';
  sortedColumnOrder: string | null = '';
  selectedRow: any = null;

  constructor(
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(val => {
        this.filterApplied.emit(val);
      });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tableContainerHeight || changes.tableContainerWidth) {
      this.calculateScrollHeight();
    }

    if (changes.tableConfig?.currentValue) {
      (this.tableConfig?.columns ?? [])
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
    }
  }

  public ngAfterViewInit(): void {
    this.tableRef$ = this.dataTableQuery.changes.pipe(
      map(x => x.first),
      startWith(this.dataTableQuery.first),
      filter((x): x is NzTableComponent<any> => !!x),
      shareReplay(1)
    );

    this.tableRef$.pipe(
      filter(x => !!x.cdkVirtualScrollViewport),
      switchMap(x => x.cdkVirtualScrollViewport!.scrolledIndexChange),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((upperItemIndex: number) => {
        if (upperItemIndex >= this.data.length - this.visibleItemsCount - 1) {
          this.scrolled.emit(this.filtersForm.value);
        }
      });

    this.headerRowEl.changes.pipe(
      map(x => x.first),
      startWith(this.headerRowEl.first),
      filter(x => !!x),
      take(1)
    ).subscribe(()=> this.calculateScrollHeight());
  }

  public getWidthArr() {
    return (this.tableConfig?.columns ?? []).map(col => col.width ? col.width + 'px' : 'auto');
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

  public sortChange(e: string | null, column: BaseColumnSettings<any>) {
    this.sortedColumnId = column.id;
    this.sortedColumnOrder = e;
    column.sortChangeFn!(e);
  }

  public openContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, selectedRow: any): void {
    this.selectedRow = selectedRow;
    this.nzContextMenuService.create($event, menu);
  }

  private calculateScrollHeight() {
    this.scrollHeight = this.tableContainerHeight -
      InfiniteScrollTableComponent.getElementHeight(this.headerRowEl?.first?.nativeElement);

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
