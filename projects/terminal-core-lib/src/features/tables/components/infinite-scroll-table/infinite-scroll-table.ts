import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  signal,
  SimpleChange,
  SimpleChanges,
  TrackByFunction,
  viewChildren,
  ViewEncapsulation
} from '@angular/core';
import {
  NzTableComponent,
  NzTableModule
} from "ng-zorro-antd/table";
import {
  filter,
  Observable,
  pairwise,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {
  debounceTime,
  map,
  startWith
} from "rxjs/operators";
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {
  takeUntilDestroyed,
  toObservable
} from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from "@angular/forms";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList
} from '@angular/cdk/drag-drop';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  BaseColumnSettings,
  DefaultTableFilters,
  FilterData,
  FilterType,
  InputFieldType,
  TableConfig
} from '../../types/table-display-settings.types';
import {TableRowHeight} from '../../../../common/directives/table-row-height';
import {ResizeColumn} from '../../../../common/directives/resize-column';
import {MergedBadge} from '../../../../common/components/merged-badge/merged-badge';
import {InputNumber} from '../../../../common/components/input-number/input-number';

export interface TableDataRow {
  id: string | number;
}

@Component({
  selector: 'ats-infinite-scroll-table',
  templateUrl: './infinite-scroll-table.html',
  styleUrls: ['./infinite-scroll-table.less'],
  imports: [
    CdkDropList,
    CdkDrag,
    NzTooltipDirective,
    NzIconDirective,
    NzTypographyComponent,
    NzDropdownMenuComponent,
    TranslocoDirective,
    NzSelectComponent,
    FormsModule,
    ReactiveFormsModule,
    NzOptionComponent,
    NzInputDirective,
    NzButtonComponent,
    NzTableModule,
    TableRowHeight,
    ResizeColumn,
    MergedBadge,
    InputNumber
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InfiniteScrollTable implements OnChanges, AfterViewInit, OnInit {
  readonly data = input<TableDataRow[]>([]);

  readonly tableContainerHeight = input(100);

  readonly tableContainerWidth = input(100);

  readonly isLoading = input(false);

  readonly tableConfig = input<TableConfig<never> | null>(null);

  readonly rowClick = output<never>();

  readonly scrolled = output();

  readonly filterApplied = output<DefaultTableFilters>();

  readonly orderColumnChange = output<CdkDragDrop<unknown>>();

  readonly columnWidthChange = output<{ columnId: string, width: number }>();

  readonly rowContextMenu = output<{
    event: MouseEvent;
    row: never;
  }>();

  readonly dataTableQuery = viewChildren<NzTableComponent<TableDataRow>>('dataTable');

  readonly headerRowEl = viewChildren<ElementRef>('headerRow');

  filterTypes = FilterType;

  inputFieldType = InputFieldType;

  scrollHeight = 0;

  readonly filtersForm = new FormGroup({});

  sortedColumnId = '';

  sortedColumnOrder: string | null = '';

  selectedRow: TableDataRow | null = null;

  readonly trackByFn = input<TrackByFunction<TableDataRow>>((index: number, data: TableDataRow) => data.id);

  protected readonly activeFilterName = signal('');

  protected readonly itemHeight = 29;

  private readonly nzContextMenuService = inject(NzContextMenuService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dataTableQueryChanges$ = toObservable(this.dataTableQuery);

  private readonly headerRowElChanges$ = toObservable(this.headerRowEl);

  private previousDataLength = 0;

  private readonly resetScrollOnDataShrink = effect(() => {
    const dataLength = this.data().length;

    if (this.previousDataLength > dataLength) {
      this.tableRef$?.pipe(
        take(1)
      ).subscribe(x => x.cdkVirtualScrollViewport?.scrollToIndex(0));
    }

    this.previousDataLength = dataLength;
  });

  private visibleItemsCount = 1;

  private tableRef$?: Observable<NzTableComponent<TableDataRow>>;

  private static getElementHeight(el?: HTMLElement): number {
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
            const filtersLength = Object.values(curr ?? {})
              .filter((f): f is string | unknown[] => Array.isArray(f) || typeof f === 'string')
              .filter(f => f.length > 0).length;

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
      filter((x): x is NzTableComponent<TableDataRow> => !!x),
      shareReplay(1)
    );

    this.tableRef$.pipe(
      filter(x => !!x.cdkVirtualScrollViewport),
      switchMap(x => x.cdkVirtualScrollViewport!.scrolledIndexChange),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((upperItemIndex: number) => {
      if (upperItemIndex >= this.data().length - this.visibleItemsCount - 1) {
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
    this.activeFilterName.set(isOpened ? name : '');
  }

  public defaultFilterChange(name: string, value: string): void {
    this.getFilterControl(name)?.setValue(value);
  }

  public sortChange(e: string | null, column: BaseColumnSettings<never>): void {
    this.sortedColumnId = column.id;
    this.sortedColumnOrder = e;
    column.sortChangeFn!(e);
  }

  public getRowClass(config: TableConfig<never> | null | undefined, row: TableDataRow): string | null {
    return config?.rowConfig?.rowClass?.(row as never) ?? null;
  }

  public getColumnClass(column: BaseColumnSettings<never>, row: TableDataRow): string | null {
    return column.classFn?.(row as never) ?? null;
  }

  public getDisplayValue(column: BaseColumnSettings<never>, row: TableDataRow): string {
    const value = column.transformFn?.(row as never) ?? this.getCellValue(row, column.id);
    return value == null ? '' : `${value}`;
  }

  public getBadges(row: TableDataRow): string[] {
    const badges = this.getCellValue(row, 'badges');
    return Array.isArray(badges) ? badges.filter((badge): badge is string => typeof badge === 'string') : [];
  }

  public emitRowClick(row: TableDataRow): void {
    this.rowClick.emit(row as never);
  }

  public emitRowContextMenu(event: MouseEvent, row: TableDataRow): void {
    this.rowContextMenu.emit({
      event,
      row: row as never
    });
  }

  public openContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, selectedRow: TableDataRow): void {
    this.selectedRow = selectedRow;
    this.nzContextMenuService.create($event, menu);
  }

  private getCellValue(row: TableDataRow, columnId: string): unknown {
    return (row as unknown as Record<string, unknown>)[columnId];
  }

  private calculateScrollHeight(): void {
    this.scrollHeight = this.tableContainerHeight() -
      InfiniteScrollTable.getElementHeight(this.headerRowEl()[0]?.nativeElement);

    this.visibleItemsCount = Math.ceil(this.scrollHeight / this.itemHeight);
  }
}
