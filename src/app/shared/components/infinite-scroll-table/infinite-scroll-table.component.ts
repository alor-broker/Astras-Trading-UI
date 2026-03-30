import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  input,
  OnChanges,
  OnInit,
  output,
  SimpleChange,
  SimpleChanges,
  TrackByFunction,
  viewChildren
} from '@angular/core';
import {NzTableComponent, NzTableModule} from "ng-zorro-antd/table";
import {filter, Observable, pairwise, shareReplay, switchMap, take} from "rxjs";
import {ITEM_HEIGHT} from "../../../modules/all-trades/utils/all-trades.utils";
import {debounceTime, map, startWith} from "rxjs/operators";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {TableConfig} from '../../models/table-config.model';
import {
  BaseColumnSettings,
  DefaultTableFilters,
  FilterData,
  FilterType,
  InputFieldType
} from "../../models/settings/table-settings.model";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TableRowHeightDirective} from '../../directives/table-row-height.directive';
import {CdkDrag, CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
import {ResizeColumnDirective} from '../../directives/resize-column.directive';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {MergedBadgeComponent} from '../merged-badge/merged-badge.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {InputNumberComponent} from '../input-number/input-number.component';
import {NzButtonComponent} from 'ng-zorro-antd/button';

export interface TableDataRow {
  id: string | number;

  [propName: string]: any;
}

@Component({
  selector: 'ats-infinite-scroll-table',
  templateUrl: './infinite-scroll-table.component.html',
  styleUrls: ['./infinite-scroll-table.component.less'],
  imports: [
    TableRowHeightDirective,
    CdkDropList,
    ResizeColumnDirective,
    CdkDrag,
    NzTooltipDirective,
    NzIconDirective,
    NzTypographyComponent,
    MergedBadgeComponent,
    NzDropdownMenuComponent,
    TranslocoDirective,
    NzSelectComponent,
    FormsModule,
    ReactiveFormsModule,
    NzOptionComponent,
    NzInputDirective,
    InputNumberComponent,
    NzButtonComponent,
    NzTableModule
  ]
})
export class InfiniteScrollTableComponent implements OnChanges, AfterViewInit, OnInit {
  readonly tableContainerHeight = input(100);
  readonly tableContainerWidth = input(100);
  readonly isLoading = input(false);
  readonly tableConfig = input<TableConfig<any> | null>(null);
  readonly rowClick = output<TableDataRow>();
  readonly scrolled = output();
  readonly filterApplied = output<DefaultTableFilters>();
  readonly orderColumnChange = output<CdkDragDrop<any>>();
  readonly columnWidthChange = output<{ columnId: string, width: number }>();
  readonly rowContextMenu = output<{
    event: MouseEvent;
    row: TableDataRow;
  }>();

  readonly dataTableQuery = viewChildren<NzTableComponent<TableDataRow>>('dataTable');
  readonly headerRowEl = viewChildren<ElementRef>('headerRow');
  filterTypes = FilterType;
  inputFieldType = InputFieldType;
  itemHeight = ITEM_HEIGHT;
  scrollHeight = 0;
  readonly filtersForm = new FormGroup({});
  activeFilterName = '';
  sortedColumnId = '';
  sortedColumnOrder: string | null = '';
  selectedRow: TableDataRow | null = null;
  readonly trackByFn = input<TrackByFunction<TableDataRow>>((index: number, data: TableDataRow) => data.id);
  private readonly nzContextMenuService = inject(NzContextMenuService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dataTableQueryChanges$ = toObservable(this.dataTableQuery);
  private readonly headerRowElChanges$ = toObservable(this.headerRowEl);
  private tableData: TableDataRow[] = [];
  private visibleItemsCount = 1;
  private tableRef$?: Observable<NzTableComponent<TableDataRow>>;

  public get data(): TableDataRow[] {
    return this.tableData;
  }

  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input() public set data(value: TableDataRow[]) {
    if (this.tableData.length > value.length) {
      this.tableRef$?.pipe(
        take(1)
      ).subscribe(x => x.cdkVirtualScrollViewport?.scrollToIndex(0));
    }

    this.tableData = value;
  }

  private static getElementHeight(el?: any): number {
    let elHeight = 0;
    if (el) {
      elHeight = el.offsetHeight as number;
      elHeight += parseInt(window.getComputedStyle(el).getPropertyValue('margin-top'));
      elHeight += parseInt(window.getComputedStyle(el).getPropertyValue('margin-bottom'));
    }

    return elHeight || 0;
  }

  ngOnInit(): void {
    this.filtersForm.valueChanges
      .pipe(
        startWith(null),
        pairwise(),
        filter(([prev, curr]) => {
          // check if form has value and its changed
          const isSameValue = JSON.stringify(prev) === JSON.stringify(curr);

          if (isSameValue) {
            return false;
          }

          if (prev == null) {
            const filtersLength = Object.values(curr as any).filter((f: any) => (f?.length ?? 0) > 0).length;

            return filtersLength > 0;
          }

          return true;
        }),
        map(([, curr]) => curr as Record<string, string | string[] | null>),
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(val => {
        this.filterApplied.emit(val);
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ((changes.tableContainerHeight != null) || (changes.tableContainerWidth != null)) {
      this.calculateScrollHeight();
    }

    if ((changes.tableConfig as SimpleChange | undefined)?.currentValue) {
      (this.tableConfig()?.columns ?? [])
        .filter(col => !!col.filterData)
        .map(col => col.filterData!)
        .forEach(filter => {
          if (filter.filterType === FilterType.Interval) {
            this.filtersForm.addControl(filter.intervalStartName!, new FormControl(''));
            this.filtersForm.addControl(filter.intervalEndName!, new FormControl(''));
          } else if (filter.filterType === FilterType.MultipleAutocomplete) {
            this.filtersForm.addControl(filter.filterName, new FormControl([]));
          } else {
            this.filtersForm.addControl(filter.filterName, new FormControl(''));
          }
        });
    }
  }

  public ngAfterViewInit(): void {
    this.tableRef$ = this.dataTableQueryChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
      filter((x): x is NzTableComponent<any> => !!x),
      shareReplay(1)
    );

    this.tableRef$.pipe(
      filter(x => !!x.cdkVirtualScrollViewport),
      switchMap(x => x.cdkVirtualScrollViewport!.scrolledIndexChange),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((upperItemIndex: number) => {
      if (upperItemIndex >= this.data.length - this.visibleItemsCount - 1) {
        this.scrolled.emit();
      }
    });

    this.headerRowElChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
      filter(x => !!x),
      take(1)
    ).subscribe(() => this.calculateScrollHeight());
  }

  public getWidthArr(): string[] {
    return (this.tableConfig()?.columns ?? []).map(col => (col.width ?? 0) ? `${col.width}px` : 'auto');
  }

  public getFilterControl(filterName: string): FormControl | null {
    return this.filtersForm.get(filterName) as FormControl;
  }

  public resetFilter(filterData: FilterData): void {
    if (filterData.filterType === FilterType.Interval) {
      this.getFilterControl(filterData.intervalStartName!)?.reset('');
      this.getFilterControl(filterData.intervalEndName!)?.reset('');
    } else if (filterData.filterType === FilterType.MultipleAutocomplete) {
      this.getFilterControl(filterData.filterName)?.reset([]);
    } else {
      this.getFilterControl(filterData.filterName)?.reset('');
    }
  }

  public openedFilterChange(name: string, isOpened: boolean): void {
    this.activeFilterName = isOpened ? name : '';
  }

  public defaultFilterChange(name: string, value: string): void {
    this.getFilterControl(name)?.setValue(value);
  }

  public sortChange(e: string | null, column: BaseColumnSettings<any>): void {
    this.sortedColumnId = column.id;
    this.sortedColumnOrder = e;
    column.sortChangeFn!(e);
  }

  public openContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, selectedRow: TableDataRow): void {
    this.selectedRow = selectedRow;
    this.nzContextMenuService.create($event, menu);
  }

  private calculateScrollHeight(): void {
    this.scrollHeight = this.tableContainerHeight() -
      InfiniteScrollTableComponent.getElementHeight(this.headerRowEl()[0]?.nativeElement);

    this.visibleItemsCount = Math.ceil(this.scrollHeight / this.itemHeight);
  }
}
