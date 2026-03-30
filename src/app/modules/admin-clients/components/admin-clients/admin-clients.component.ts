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
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {AdminClientsService} from "../../services/clients/admin-clients.service";
import {Client, ClientsSearchFilter, SpectraExtension} from "../../services/clients/admin-clients-service.models";
import {BaseTableComponent, Sort} from "../../../../shared/components/base-table/base-table.component";
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
import {TableConfig} from "../../../../shared/models/table-config.model";
import {AdminClientsSettings, AdminClientsTableColumns,} from "../../models/admin-clients-settings.model";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {distinct, map} from "rxjs/operators";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {BaseColumnId, BaseColumnSettings, FilterType} from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzTableModule} from "ng-zorro-antd/table";
import {LetDirective} from "@ngrx/component";
import {CdkDrag, CdkDragDrop, CdkDropList} from "@angular/cdk/drag-drop";
import {formatNumber} from "@angular/common";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {
  TableSearchFilterComponent
} from "../../../../shared/components/table-search-filter/table-search-filter.component";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {Market} from "../../../../../generated/graphql.types";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {AdminDashboardsHelper} from "../../utils/admin-dashboards.helper";
import {getMarketTypeByPortfolio} from "../../../../shared/utils/portfolios";
import {TranslocoDirective} from "@jsverse/transloco";
import {ResizeColumnDirective} from "../../../../shared/directives/resize-column.directive";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";

type ClientDisplay = Omit<Client, 'spectraExtension'> & Partial<SpectraExtension>;

interface TableState {
  pageSize?: number;
  sort?: Sort | null;
  filters?: ClientsSearchFilter | null;
}

interface TableContext {
  commonTranslator: TranslatorFn;
  adminTranslator: TranslatorFn;
  savedFilters: ClientsSearchFilter | null;
}

type ColumnConfigFiller<T> = (columnId: BaseColumnId, context: TableContext) => BaseColumnSettings<T>;

interface ColumnBase {
  id: string;
  displayName: string;
  tooltip?: string;
  sortChangeFn: (direction: string | null) => any;
}

@Component({
  selector: 'ats-admin-clients',
  standalone: true,
  imports: [
    NzResizeObserverDirective,
    LetDirective,
    CdkDropList,
    CdkDrag,
    TableRowHeightDirective,
    TableSearchFilterComponent,
    TranslocoDirective,
    ResizeColumnDirective,
    NzTooltipDirective,
    NzDropdownMenuComponent,
    NzIconDirective,
    NzMenuDirective,
    NzMenuItemComponent,
    NzTableModule
  ],
  templateUrl: './admin-clients.component.html',
  styleUrl: './admin-clients.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminClientsComponent extends BaseTableComponent<ClientDisplay, ClientsSearchFilter> implements OnInit, OnDestroy {
  readonly guid = input.required<string>();
  allColumns: BaseColumnSettings<ClientDisplay>[] = [];
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
  protected readonly filterTypes = FilterType;
  protected selectedItem: ClientDisplay | null = null;
  private readonly adminClientsService = inject(AdminClientsService);
  private readonly translatorService = inject(TranslatorService);
  protected readonly valuesTranslator$ = combineLatest({
    commonTranslator: this.translatorService.getTranslator(''),
    adminClientsTranslator: this.translatorService.getTranslator('admin-clients/admin-clients')
  }).pipe(
    shareReplay(1)
  );

  private readonly locale = inject(LOCALE_ID);
  private readonly hostElement = inject(ElementRef);
  private readonly manageDashboardsService = inject(ManageDashboardsService);
  private readonly nzContextMenuService = inject(NzContextMenuService);
  private readonly columnFillers: { columnId: string, filler: ColumnConfigFiller<ClientDisplay> }[] = [
    {
      columnId: "login",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        const columnBase = this.fillColumnBase(columnId, context);
        return {
          ...columnBase,
          transformFn: data => data.login,
          filterData: {
            filterName: columnBase.displayName,
            filterType: FilterType.Search,
            initialValue: this.getSavedFilterSState(columnId.id, context.savedFilters)
          }
        };
      }
    },
    {
      columnId: "clientName",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        const columnBase = this.fillColumnBase(columnId, context);
        return {
          ...columnBase,
          transformFn: data => data.clientName,
          filterData: {
            filterName: columnBase.displayName,
            filterType: FilterType.Search,
            initialValue: this.getSavedFilterSState(columnId.id, context.savedFilters)
          }
        };
      }
    },
    {
      columnId: "portfolio",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        const columnBase = this.fillColumnBase(columnId, context);
        return {
          ...columnBase,
          transformFn: data => data.portfolio,
          filterData: {
            filterName: columnBase.displayName,
            filterType: FilterType.Search,
            initialValue: this.getSavedFilterSState(columnId.id, context.savedFilters)
          }
        };
      }
    },
    {
      columnId: "exchange",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => data.exchange
        };
      }
    },
    {
      columnId: "market",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        const columnBase = this.fillColumnBase(columnId, context);
        const filterValue = this.getSavedFilterSState(columnId.id, context.savedFilters);

        return {
          ...columnBase,
          transformFn: data => data.market,
          filterData: {
            filterName: columnBase.displayName,
            filterType: FilterType.Default,
            filters: [
              Market.Curr,
              Market.Fond,
              Market.Forts,
              Market.Spbx,
              Market.Terex,
              Market.United
            ].map(value => ({
              text: value,
              value: value,
              byDefault: filterValue === value
            }))
          }
        };
      }
    },
    {
      columnId: "clientRiskType",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => context.commonTranslator(['clientTypeValues', data.clientRiskType], {fallback: data.clientRiskType}),
        };
      }
    },
    {
      columnId: "isQualifiedInvestor",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => data.isQualifiedInvestor ? context.commonTranslator(['yes']) : context.commonTranslator(['no']),
          width: 150,
          minWidth: 150
        };
      }
    },
    {
      columnId: "buyingPowerAtMorning",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.buyingPowerAtMorning),
        };
      }
    },
    {
      columnId: "buyingPower",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.buyingPower),
        };
      }
    },
    {
      columnId: "profit",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.profit),
        };
      }
    },
    {
      columnId: "profitRate",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.profitRate),
        };
      }
    },
    {
      columnId: "portfolioEvaluation",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.portfolioEvaluation),
        };
      }
    },
    {
      columnId: "portfolioLiquidationValue",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.portfolioLiquidationValue),
        };
      }
    },
    {
      columnId: "initialMargin",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.initialMargin),
        };
      }
    },
    {
      columnId: "minimalMargin",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.minimalMargin),
        };
      }
    },
    {
      columnId: "riskBeforeForcePositionClosing",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.riskBeforeForcePositionClosing),
        };
      }
    },
    {
      columnId: "commission",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.commission),
        };
      }
    },
    {
      columnId: "correctedMargin",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.correctedMargin),
          width: 150,
          minWidth: 150
        };
      }
    },
    {
      columnId: "turnover",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.turnover),
        };
      }
    },
    {
      columnId: "moneyFree",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.moneyFree),
        };
      }
    },
    {
      columnId: "moneyOld",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.moneyOld),
        };
      }
    },
    {
      columnId: "moneyBlocked",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.moneyBlocked),
        };
      }
    },
    {
      columnId: "isLimitsSet",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: (data): string => {
            if (data.isLimitsSet != null) {
              return data.isLimitsSet ? context.commonTranslator(['yes']) : context.commonTranslator(['no']);
            }

            return '';
          }
        };
      }
    },
    {
      columnId: "moneyAmount",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.moneyAmount),
        };
      }
    },
    {
      columnId: "moneyPledgeAmount",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.moneyPledgeAmount),
        };
      }
    },
    {
      columnId: "vmCurrentPositions",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.vmCurrentPositions),
        };
      }
    },
    {
      columnId: "varMargin",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.varMargin),
        };
      }
    },
    {
      columnId: "netOptionValue",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.netOptionValue),
        };
      }
    },
    {
      columnId: "indicativeVarMargin",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.indicativeVarMargin),
        };
      }
    },
    {
      columnId: "fee",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.fee),
        };
      }
    },
    {
      columnId: "vmInterCl",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.vmInterCl),
        };
      }
    },
    {
      columnId: "posRisk",
      filler: (columnId, context): BaseColumnSettings<ClientDisplay> => {
        return {
          ...this.fillColumnBase(columnId, context),
          transformFn: data => this.formatNumber(data.posRisk),
        };
      }
    }
  ];

  private settings$!: Observable<AdminClientsSettings>;

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
    this.settings$ = this.settingsService.getSettings<AdminClientsSettings>(this.guid()).pipe(
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
    super.changeColumnOrder<AdminClientsSettings>(event, this.settings$);
  }

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<AdminClientsSettings>(event, this.settings$);
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, client: ClientDisplay): void {
    this.selectedItem = client;
    menu.nzOverlayClassName = 'admin-clients-menu';
    this.nzContextMenuService.create($event, menu);
  }

  protected initTableDataStream(): Observable<ClientDisplay[]> {
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
        return this.adminClientsService.searchClients(
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

          return result.items.map(i => ({
            ...i,
            ...i.spectraExtension
          }));
        }
      ),
      tap(() => {
        this.isLoading.set(false);
      }),
      subscribeOn(asyncScheduler),
    );
  }

  protected initTableConfigStream(): Observable<TableConfig<ClientDisplay>> {
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
            columns: AdminClientsTableColumns
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

  protected applyFilters(filters: Record<string, string>): void {
    this.filters$.pipe(
      take(1)
    ).subscribe(current => {
      const copy = {
        ...current
      };

      for (const key in filters) {
        if (filters[key] == null || filters[key] === '') {
          delete copy[key as keyof ClientsSearchFilter];
        } else {
          copy[key as keyof ClientsSearchFilter] = filters[key];
        }
      }

      this.filters$.next(copy);
      this.saveFiltersState(copy);
    });
  }

  protected isFilterApplied(name: string, allFilters: ClientsSearchFilter): boolean {
    return name in allFilters
      && allFilters[name as keyof ClientsSearchFilter] != null
      && allFilters[name as keyof ClientsSearchFilter] !== '';
  }

  protected nzFilterChange(key: string, value: string): void {
    this.applyFilters({
      [key]: value
    });
  }

  protected openDashboardForClient(client: ClientDisplay): void {
    AdminDashboardsHelper.openDashboardForPortfolio(
      {
        portfolio: client.portfolio,
        exchange: client.exchange,
        marketType: getMarketTypeByPortfolio(client.portfolio)
      },
      this.manageDashboardsService
    );
  }

  private getSavedFilterSState(columnId: string, filters: ClientsSearchFilter | null): string | undefined {
    if (filters != null && columnId in filters) {
      return filters[columnId as keyof ClientsSearchFilter];
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

  private saveFiltersState(filters: ClientsSearchFilter): void {
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
