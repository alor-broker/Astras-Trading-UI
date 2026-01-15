import {Component, DestroyRef, input, OnInit,} from '@angular/core';
import {asyncScheduler, BehaviorSubject, combineLatest, Observable, shareReplay, subscribeOn, take} from "rxjs";
import {BlotterSettings} from "../../models/blotter-settings.model";
import {BaseColumnSettings, FilterType} from "../../../../shared/models/settings/table-settings.model";
import {ExportHelper} from "../../utils/export-helper";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {BaseTableComponent} from "../../../../shared/components/base-table/base-table.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {map} from "rxjs/operators";
import {NzContextMenuService} from "ng-zorro-antd/dropdown";
import {
  AddToWatchlistMenuComponent
} from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {NzSafeAny} from "ng-zorro-antd/core/types";
import {NzTableSortOrder} from "ng-zorro-antd/table";

export interface SortState {
  columnId: string;
  direction: NzTableSortOrder;
}

export interface NzTableFilterListItem {
  text: string;
  value: NzSafeAny;
  byDefault?: boolean;
}

@Component({
  template: ''
})
export abstract class BlotterBaseTableComponent<T extends { id: string }, F extends object>
  extends BaseTableComponent<T, F>
  implements OnInit {
  readonly guid = input.required<string>();

  filterTypes = FilterType;
  settings$!: Observable<BlotterSettings>;
  protected columns!: BaseColumnSettings<T>[];
  protected footerSize$ = new BehaviorSubject<ContentSize | null>(null);
  protected fileSuffix!: string;

  protected constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly translatorService: TranslatorService,
    protected readonly nzContextMenuService: NzContextMenuService,
    protected readonly widgetLocalStateService: WidgetLocalStateService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, destroyRef);
  }

  abstract get restoreFiltersAndSortOnLoad(): boolean;

  private get filterStateStorageKey(): string {
    return `${this.settingsTableName}_filters`;
  }

  private get sortStateStorageKey(): string {
    return `${this.settingsTableName}_sort`;
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid())
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();

    this.tableConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(c => this.columns = c?.columns ?? []);
  }

  changeColumnOrder(event: CdkDragDrop<any>): void {
    super.changeColumnOrder<BlotterSettings>(event, this.settings$);
  }

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<BlotterSettings>(event, this.settings$);
  }

  openContextMenu($event: MouseEvent, menu: AddToWatchlistMenuComponent, selectedRow: T): void {
    this.nzContextMenuService.close(true);

    this.rowToInstrumentKey(selectedRow)
      .subscribe(instrument => {
        const menuRef = menu.menuRef();
        if (instrument == null || menuRef == null) {
          $event.preventDefault();
          return;
        }

        menu.itemToAdd.set(instrument);
        this.nzContextMenuService.create($event, menuRef);
      });
  }

  getSortState(): Observable<SortState | null> {
    return this.widgetLocalStateService.getStateRecord<SortState>(this.guid(), this.sortStateStorageKey);
  }

  footerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.footerSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  formatDate(date: Date): string {
    if (date.toDateString() == new Date().toDateString()) {
      return date.toLocaleTimeString();
    } else return date.toLocaleDateString();
  }

  canExport(data: readonly T[] | undefined | null): boolean {
    return !!data && data.length > 0;
  }

  protected isFilterDisabled = (): boolean => Object.keys(this.filters$.getValue()).length === 0;

  protected getSort(columnId: string, sortState: SortState | null): NzTableSortOrder {
    if (sortState == null) {
      return null;
    }

    if (sortState.columnId !== columnId) {
      return null;
    }

    return sortState.direction;
  }

  protected saveFilterState(filter: F): void {
    setTimeout(() => {
      this.widgetLocalStateService.setStateRecord<F>(
        this.guid(),
        this.filterStateStorageKey,
        filter,
        this.restoreFiltersAndSortOnLoad
      );
    });
  }

  protected saveSortState(columnId: string, direction: NzTableSortOrder): void {
    this.getSortState().pipe(
      take(1),
      subscribeOn(asyncScheduler)
    ).subscribe(sortState => {
      if (sortState != null && direction == null) {
        if (sortState.columnId != columnId) {
          return;
        }
      }

      this.widgetLocalStateService.setStateRecord<SortState>(
        this.guid(),
        this.sortStateStorageKey,
        {
          columnId,
          direction
        },
        this.restoreFiltersAndSortOnLoad
      );
    });
  }

  protected getFiltersState(): Observable<F | null> {
    return this.widgetLocalStateService.getStateRecord<F>(this.guid(), this.filterStateStorageKey);
  }

  protected abstract rowToInstrumentKey(row: T): Observable<InstrumentKey | null>;

  protected initContentSize(): void {
    this.contentSize$ = combineLatest([
      this.containerSize$,
      this.headerSize$,
      this.footerSize$
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([containerSize, headerSize, footerSize]) => ({
          width: containerSize?.width ?? headerSize?.width ?? footerSize?.width ?? 0,
          height: (containerSize?.height ?? 0) - ((headerSize?.height ?? 0) + (footerSize?.height ?? 0))
        }))
      );
  }

  protected filterChange(updates: Partial<F>): void {
    this.filters$.pipe(
      take(1)
    ).subscribe(currentFilters => {
      const newValue = {
        ...currentFilters,
        ...updates
      };

      if (JSON.stringify(currentFilters) === JSON.stringify(newValue)) {
        return;
      }

      this.filters$.next(newValue);
      this.saveFilterState(newValue);
    });
  }

  protected defaultFilterChange(key: string, value: string[]): void {
    this.filterChange(<F>{[key]: value});
  }

  protected isFilterApplied(column: BaseColumnSettings<T>): boolean {
    const filter = this.filters$.getValue() as Record<string, string | string[] | null | undefined>;
    return column.id in filter
      && filter[column.id] != null
      && filter[column.id]!.length > 0;
  }

  protected exportToFile(data?: readonly T[]): void {
    combineLatest({
      tBlotterCommon: this.translatorService.getTranslator('blotter/blotter-common'),
      tBlotter: this.translatorService.getTranslator('blotter'),
      settings: this.settings$,
      tableConfig: this.tableConfig$
    })
      .pipe(
        take(1),
      )
      .subscribe(({tBlotter, tBlotterCommon, settings, tableConfig}) => {
        const valueTranslators = new Map<string, (value: any) => string>([
          ['status', (value): string => tBlotterCommon(['orderStatus', value])],
          ['transTime', (value): string => this.formatDate(value)],
          ['endTime', (value): string => this.formatDate(value)],
          ['date', (value): string => this.formatDate(value)]
        ]);

        ExportHelper.exportToCsv(
          tBlotter([this.fileSuffix + 'Tab']),
          settings,
          [...(data ?? [])],
          tableConfig.columns,
          valueTranslators
        );
      });
  }

  protected trackBy(index: number, item: T): string {
    return item.id;
  }

  protected justifyFilter(item: T, filter: F): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      if ((filter[key as keyof F] as string | undefined) != null && !!(filter[key as keyof F] as string).length) {
        const column = this.columns.find(o => o.id == key);
        if (
          (column!.filterData!.filterType !== FilterType.DefaultMultiple && !this.searchInItem(item, <keyof T>key, <string>filter[<keyof F>key])) ||
          (column!.filterData!.filterType === FilterType.DefaultMultiple && ((<string | undefined>filter[<keyof F>key])?.length ?? 0) && !(<string>filter[<keyof F>key])!.includes(item[<keyof T>key]!.toString()))
        ) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }

  protected searchInItem(item: T, key: keyof T, value?: string): boolean {
    if (value == null || !value.length) {
      return true;
    }
    return item[key]!.toString().toLowerCase().includes((value as string).toLowerCase());
  }

  protected isFilterItemApplied(
    columnId: string,
    filterState: F | null,
    item: NzTableFilterListItem): boolean {
    if (filterState == null) {
      return false;
    }

    const filterValue = filterState[columnId as keyof F] as unknown;
    if (Array.isArray(filterValue)) {
      return filterValue.some(f => f === item.value);
    }

    if (typeof filterValue === 'string') {
      return filterValue === item.value;
    }

    return false;
  }
}
