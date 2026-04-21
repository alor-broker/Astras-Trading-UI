import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {
  ClientPosition,
  PositionsSearchFilter
} from "../../services/admin-client-positions-service.models";
import {
  BaseTableComponent,
  Sort
} from "../../../../shared/components/base-table/base-table.component";
import {
  BaseColumnId,
  BaseColumnSettings,
  FilterType
} from "../../../../shared/models/settings/table-settings.model";
import {
  TranslatorFn,
  TranslatorService
} from "../../../../shared/services/translator.service";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  defer,
  Observable,
  observeOn,
  shareReplay,
  subscribeOn,
  switchMap,
  take,
  tap,
  timer
} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList
} from "@angular/cdk/drag-drop";
import {
  distinct,
  map
} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {AdminDashboardsHelper} from "../../../admin-clients/utils/admin-dashboards.helper";
import {getMarketTypeByPortfolio} from "../../../../shared/utils/portfolios";
import {
  AdminClientPositionsSettings,
  AdminClientPositionsTableColumns
} from "../../models/admin-client-positions-settings.model";
import {formatNumber} from "@angular/common";
import {AdminClientPositionsService} from "../../services/admin-client-positions.service";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {LetDirective} from "@ngrx/component";
import {
  NzTableModule,
  NzThMeasureDirective
} from "ng-zorro-antd/table";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {ResizeColumnDirective} from "../../../../shared/directives/resize-column.directive";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {TableSearchFilterComponent} from "../../../../shared/components/table-search-filter/table-search-filter.component";
import {
  NzMenuDirective,
  NzMenuItemComponent
} from "ng-zorro-antd/menu";

type PositionDisplay = ClientPosition;

interface TableState {
  pageSize?: number;
  sort?: Sort | null;
  filters?: PositionsSearchFilter | null;
}

interface TableContext {
  commonTranslator: TranslatorFn;
  adminTranslator: TranslatorFn;
  savedFilters: PositionsSearchFilter | null;
}

type ColumnConfigFiller<T> = (columnId: BaseColumnId, context: TableContext) => BaseColumnSettings<T>;

interface ColumnBase {
  id: string;
  displayName: string;
  tooltip?: string;
  sortChangeFn: (direction: string | null) => any;
}

@Component({
  selector: 'ats-admin-client-positions',
  imports: [
    TranslocoDirective,
    NzResizeObserverDirective,
    LetDirective,
    TableRowHeightDirective,
    CdkDropList,
    NzThMeasureDirective,
    CdkDrag,
    NzTableModule,
    ResizeColumnDirective,
    NzTooltipDirective,
    NzIconDirective,
    NzDropdownMenuComponent,
    TableSearchFilterComponent,
    NzMenuDirective,
    NzMenuItemComponent
  ],
  templateUrl: './admin-client-positions.component.html',
  styleUrl: './admin-client-positions.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminClientPositionsComponent extends BaseTableComponent<PositionDisplay, PositionsSearchFilter> implements OnInit, OnDestroy {
  readonly guid = input.required<string>();

  allColumns: BaseColumnSettings<PositionDisplay>[] = [];

  protected readonly settingsService: WidgetSettingsService;

  protected readonly destroyRef: DestroyRef;

  protected readonly widgetLocalStateService = inject(WidgetLocalStateService);

  protected readonly allPageSizes = [10, 25, 50, 100, 200, 500];

  protected readonly page$ = new BehaviorSubject<{ page: number, pageSize: number }>({
    page: 1,
    pageSize: this.allPageSizes[0]
  });

  protected readonly isLoading = signal(false);

  protected readonly totalRecords = signal(0);

  protected settingsTableName = 'table';

  protected settingsColumnsName = '';

  protected readonly FilterType = FilterType;

  protected selectedItem: PositionDisplay | null = null;

  private readonly adminClientPositionsService = inject(AdminClientPositionsService);

  private readonly translatorService = inject(TranslatorService);

  protected readonly valuesTranslator$ = combineLatest({
    commonTranslator: this.translatorService.getTranslator(''),
    adminClientsTranslator: this.translatorService.getTranslator('admin-client-positions')
  }).pipe(
    shareReplay(1)
  );

  private readonly locale = inject(LOCALE_ID);

  private readonly hostElement = inject(ElementRef);

  private readonly manageDashboardsService = inject(ManageDashboardsService);

  private readonly nzContextMenuService = inject(NzContextMenuService);

  private readonly columnFillers: { columnId: string, filler: ColumnConfigFiller<PositionDisplay> }[] = [
    {
      columnId: "symbol",
      filler: (columnId, context): BaseColumnSettings<PositionDisplay> => {
        const columnBase = this.fillColumnBase(columnId, context);
        return {
          ...columnBase,
          transformFn: data => data.symbol,
          filterData: {
            filterName: columnBase.displayName,
            filterType: FilterType.Search,
            initialValue: this.getSavedFiltersState(columnId.id, context.savedFilters) as string | undefined
          }
        };
      }
    },
    {
      columnId: "exchange",
      filler: (columnId, context): BaseColumnSettings<PositionDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => data.exchange
        };
      }
    },
    {
      columnId: "portfolio",
      filler: (columnId, context): BaseColumnSettings<PositionDisplay> => {
        const columnBase = this.fillColumnBase(columnId, context);
        return {
          ...columnBase,
          transformFn: data => data.portfolio
        };
      }
    },
    {
      columnId: "quantityT0",
      filler: (columnId, context): BaseColumnSettings<PositionDisplay> => {
        const savedFilterValue = this.getSavedFiltersState('excludeClosedPositions', context.savedFilters) as boolean | undefined;
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.quantityT0),
          filterData: {
            filterName: 'excludeClosedPositions',
            filterType: FilterType.Default,
            filters: [
              {
                value: true,
                text: context.adminTranslator(['columns', columnId.id, 'filters', 'excludeClosedPositions']),
                byDefault: savedFilterValue ?? false
              },
              {
                value: false,
                text: context.adminTranslator(['columns', columnId.id, 'filters', 'all'])
              }
            ],
            initialValue: savedFilterValue
          }
        };
      }
    }
  ];

  private settings$!: Observable<AdminClientPositionsSettings>;

  private readonly tableStateStorageKey = 'tableState';

  private tableState$!: Observable<TableState | null>;

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, destroyRef);

    this.settingsService = settingsService;
    this.destroyRef = destroyRef;
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<AdminClientPositionsSettings>(this.guid()).pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.tableState$ = this.widgetLocalStateService.getStateRecord<TableState>(
      this.guid(),
      this.tableStateStorageKey
    );

    this.tableState$.pipe(
      take(1)
    ).subscribe(state => {
      if (state != null) {
        if (state.pageSize != null) {
          this.page$.next({
            page: 1,
            pageSize: state.pageSize
          });
        }

        if (state.sort != null) {
          this.sort$.next({
            orderBy: state.sort.orderBy,
            descending: state.sort.descending
          });
        }

        if (state.filters != null) {
          this.applyFilters(state.filters);
        }
      }
    });

    super.ngOnInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.page$.complete();
  }

  formatNumber(value: number | undefined): string {
    if (value != null) {
      return formatNumber(value, this.locale);
    }

    return '';
  }

  changeColumnOrder(event: CdkDragDrop<any>): void {
    super.changeColumnOrder<AdminClientPositionsSettings>(event, this.settings$);
  }

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<AdminClientPositionsSettings>(event, this.settings$);
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, position: PositionDisplay): void {
    this.selectedItem = position;
    menu.nzOverlayClassName = 'admin-client-positions-menu';
    this.nzContextMenuService.create($event, menu);
  }

  protected initTableDataStream(): Observable<PositionDisplay[]> {
    const refreshTimer$ = defer(() => {
      return this.settings$.pipe(
        map(settings => settings.refreshIntervalSec * 1000),
        distinct(),
        switchMap(interval => timer(0, interval)),
        takeUntilDestroyed(this.destroyRef)
      );
    });

    return combineLatest({
      filters: this.filters$,
      sort: this.sort$,
      page: this.page$
    }).pipe(
      mapWith(() => refreshTimer$, (source,) => source),
      observeOn(asyncScheduler),
      tap(() => {
        this.isLoading.set(true);
      }),
      switchMap(x => {
        return this.adminClientPositionsService.searchPositions(
          x.filters,
          {
            page: x.page.page,
            pageSize: x.page.pageSize
          },
          x.sort == null
            ? null
            : {
              sortBy: x.sort.orderBy,
              desc: x.sort.descending,
            }
        );
      }),
      map(result => {
          if (result == null) {
            this.totalRecords.set(0);
            return [];
          }

          this.totalRecords.set(result.total);

          return [...result.items];
        }
      ),
      tap(() => {
        this.isLoading.set(false);
      }),
      subscribeOn(asyncScheduler),
    );
  }

  protected initTableConfigStream(): Observable<TableConfig<PositionDisplay>> {
    const savedFilters$ = defer(() => {
      return this.tableState$.pipe(
        map(s => s?.filters ?? null),
        take(1)
      );
    });

    return combineLatest({
      settings: this.settings$,
      translators: this.valuesTranslator$
    })
      .pipe(
        mapWith(
          () => savedFilters$,
          (source, filters) => ({...source, savedFilters: filters})
        ),
        map(x => {
          const tableSettings = x.settings.table;
          const context: TableContext = {
            commonTranslator: x.translators.commonTranslator,
            adminTranslator: x.translators.adminClientsTranslator,
            savedFilters: x.savedFilters
          };

          return {
            columns: AdminClientPositionsTableColumns
              .map(column => ({column, settings: tableSettings.columns.find(c => c.columnId === column.id)}))
              .filter(c => c.settings != null)
              .map((col, index) => {
                return {
                  displayName: '',
                  ...col.column,
                  ...this.columnFillers.find(f => f.columnId === col.column.id)?.filler(col.column, context),
                  order: col.settings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index),
                  width: col.settings!.columnWidth ?? this.defaultColumnWidth
                };
              })
              .sort((a, b) => a.order - b.order)
          };
        })
      );
  }

  protected changePageOptions(options: Partial<{ page: number, pageSize: number }>): void {
    this.page$.pipe(
      take(1)
    ).subscribe(page => {
      const updatedPage = {
        page: options.page ?? page.page,
        pageSize: options.pageSize ?? page.pageSize
      };

      this.page$.next(updatedPage);
      this.savePageState(updatedPage.pageSize);
    });
  }

  protected initContentSize(): void {
    this.contentSize$ = combineLatest([
      this.containerSize$,
      this.headerSize$
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([containerSize, headerSize]) => {
            let paginatorHeight = 0;
            const paginator = (this.hostElement.nativeElement as HTMLElement).querySelector('.ant-table-pagination') as HTMLElement | null;
            if (paginator != null) {
              const height = paginator.offsetHeight;
              const style = getComputedStyle(paginator);
              const marginTop = parseInt(style.marginTop);
              const marginBottom = parseInt(style.marginBottom);

              paginatorHeight = height + marginTop + marginBottom;
            }

            return {
              width: containerSize?.width ?? headerSize?.width ?? 5,
              height: Math.max((containerSize?.height ?? 0) - (headerSize?.height ?? 0) - paginatorHeight, 5)
            };
          }
        )
      );
  }

  protected applyFilters(filters: Record<string, string | string[] | boolean | null>): void {
    this.filters$.pipe(
      take(1)
    ).subscribe(current => {
      const copy = {
        ...current
      } as Record<string, string | string[] | boolean>;

      for (const key in filters) {
        if (filters[key] == null || filters[key] === '') {
          delete copy[key as keyof PositionsSearchFilter];
        } else {
          copy[key as keyof PositionsSearchFilter] = filters[key];
        }
      }

      this.filters$.next(copy);
      this.saveFiltersState(copy);
    });
  }

  protected isFilterApplied(name: string, allFilters: PositionsSearchFilter): boolean {
    return name in allFilters
      && allFilters[name as keyof PositionsSearchFilter] != null
      && allFilters[name as keyof PositionsSearchFilter] !== '';
  }

  protected nzFilterChange(key: string, value: string[]): void {
    this.applyFilters({
      [key]: value
    });
  }

  protected openDashboardForPosition(position: PositionDisplay): void {
    AdminDashboardsHelper.openDashboardForPortfolio(
      {
        portfolio: position.portfolio,
        exchange: position.exchange,
        marketType: getMarketTypeByPortfolio(position.portfolio)
      },
      this.manageDashboardsService
    );
  }

  private getSavedFiltersState(filterKey: string, filters: PositionsSearchFilter | null): string | boolean | string[] | undefined {
    if (filters != null && filterKey in filters) {
      return filters[filterKey as keyof PositionsSearchFilter];
    }

    return undefined;
  }

  private fillColumnBase(columnId: BaseColumnId, context: TableContext): ColumnBase {
    return {
      id: columnId.id,
      displayName: context.adminTranslator(['columns', columnId.id, 'displayName'], {fallback: columnId.displayName}),
      tooltip: context.adminTranslator(['columns', columnId.id, 'tooltip']),
      sortChangeFn: (direction): any => {
        if (direction == null) {
          this.sort$.next(null);
          this.saveSortState(null);
        } else {
          const sort: Sort = {
            orderBy: columnId.id,
            descending: direction === 'descend'
          };

          this.sort$.next(sort);
          this.saveSortState(sort);
        }
      }
    };
  }

  private saveSortState(sort: Sort | null): void {
    this.saveTableState({
      sort
    });
  }

  private saveFiltersState(filters: PositionsSearchFilter): void {
    this.saveTableState({
      filters
    });
  }

  private savePageState(pageSize: number): void {
    this.saveTableState({
      pageSize
    });
  }

  private saveTableState(state: Partial<TableState>): void {
    this.tableState$.pipe(
      take(1),
      subscribeOn(asyncScheduler)
    ).subscribe(currentState => {
      this.widgetLocalStateService.setStateRecord<TableState>(
        this.guid(),
        this.tableStateStorageKey,
        {
          ...currentState,
          ...state
        },
        true
      );
    });
  }
}
