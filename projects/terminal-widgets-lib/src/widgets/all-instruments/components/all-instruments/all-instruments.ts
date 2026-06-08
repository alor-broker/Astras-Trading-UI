import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {AllInstrumentsService} from "../../services/all-instruments.service";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  Subscription,
  switchMap,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import {
  filter,
  map
} from 'rxjs/operators';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzContextMenuService} from "ng-zorro-antd/dropdown";
import {formatNumber} from "@angular/common";
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {LazyLoadingBaseTable} from '@terminal-core-lib/features/tables/components/lazy-loading-base-table/lazy-loading-base-table';
import {
  PageInfo,
  SortEnumType
} from '@terminal-core-lib/features/news/graphql/schema/graphql.types';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {
  Instrument,
  InstrumentModelSortInput,
  InstrumentsEdge
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {
  BaseColumnSettings,
  DefaultTableFilters,
  FilterType,
  InputFieldType,
  TableConfig
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {InfiniteScrollTable} from '@terminal-core-lib/features/tables/components/infinite-scroll-table/infinite-scroll-table';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {NavigationStackService} from '@terminal-core-lib/common/services/navigation-stack.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {ContentSize} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {AllInstrumentsWidgetSettings} from '@terminal-widgets-lib/widgets/all-instruments/widget-settings.types';
import {AddToWatchlistMenu} from '@terminal-core-lib/features/watchlist/components/add-to-watchlist-menu/add-to-watchlist-menu';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {
  CsvFormatter,
  csvFormatterConfigDefaults,
  ExportColumnMeta
} from '@terminal-core-lib/common/utils/files/csv-formatter';
import {
  FileSaver,
  FileType
} from '@terminal-core-lib/common/utils/files/file-saver';
import {InstrumentGroups} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {TerminalSettings} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';

interface AllInstrumentsNodeDisplay extends Instrument {
  id: string;
}

interface AllInstrumentsNavigationParameters {
  sort?: {
    parameter?: string;
    order?: SortEnumType;
  };
}

@Component({
  selector: 'ats-all-instruments',
  templateUrl: './all-instruments.html',
  styleUrls: ['./all-instruments.less'],
  imports: [
    LetDirective,
    NzResizeObserverDirective,
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    InfiniteScrollTable,
    AddToWatchlistMenu
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AllInstruments extends LazyLoadingBaseTable<
  AllInstrumentsNodeDisplay,
  DefaultTableFilters,
  PageInfo,
  InstrumentModelSortInput
>
  implements OnInit, OnDestroy {
  readonly table = viewChild<InfiniteScrollTable>('table');

  readonly guid = input.required<string>();

  exportBtnSize$ = new BehaviorSubject<ContentSize | null>(null);

  protected readonly actionsContext = inject(ACTIONS_CONTEXT);

  protected override settingsTableName = 'allInstrumentsTable';

  protected override settingsColumnsName = 'allInstrumentsColumns';

  private readonly service = inject(AllInstrumentsService);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly nzContextMenuService = inject(NzContextMenuService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly translatorService = inject(TranslatorService);

  private readonly modalService = inject(NzModalService);

  private readonly locale = inject(LOCALE_ID);

  public allColumns: BaseColumnSettings<AllInstrumentsNodeDisplay>[] = [
    {
      id: 'name',
      sourceField: 'symbol',
      displayName: 'Тикер',
      width: 80,
      minWidth: 80,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.basicInformation!.symbol,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'symbol'], dir),
      filterData: {
        filterName: 'symbol',
        filterType: FilterType.Search
      },
      showBadges: true
    },
    {
      id: 'shortName',
      displayName: 'Название',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.basicInformation!.shortName ?? '',
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'shortName'], dir),
      filterData: {
        filterName: 'shortName',
        filterType: FilterType.Search
      },
      width: 50,
      minWidth: 50
    },
    {
      id: 'currency',
      sourceField: 'nominal',
      displayName: 'Валюта',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.currencyInformation!.nominal ?? '',
      sortChangeFn: (dir): void => this.sortChange(['currencyInformation', 'nominal'], dir),
      filterData: {
        filterName: 'nominal',
        filterType: FilterType.Search
      },
      width: 90,
      minWidth: 90,
    },
    {
      id: 'dailyGrowth',
      displayName: 'Рост за сегодня',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.dailyGrowth != null ? formatNumber(data.tradingDetails!.dailyGrowth, this.locale, '0.0-10') : '',
      classFn: (data): 'negative-color' | 'positive-color' | null => data.tradingDetails!.dailyGrowth == null
        ? null
        : data.tradingDetails!.dailyGrowth < 0 ? 'negative-color' : 'positive-color',
      width: 100,
      minWidth: 100,
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'dailyGrowth'], dir),
      filterData: {
        filterName: 'dailyGrowth',
        filterType: FilterType.Interval,
        intervalStartName: 'dailyGrowthFrom',
        intervalEndName: 'dailyGrowthTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'dailyGrowthPercent',
      displayName: 'Рост за сегодня, %',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.dailyGrowthPercent != null ? formatNumber(data.tradingDetails!.dailyGrowthPercent, this.locale, '0.0-3') : '',
      classFn: (data): 'negative-color' | 'positive-color' | null => data.tradingDetails!.dailyGrowthPercent == null
        ? null
        : data.tradingDetails!.dailyGrowthPercent < 0 ? 'negative-color' : 'positive-color',
      width: 100,
      minWidth: 100,
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'dailyGrowthPercent'], dir),
      filterData: {
        filterName: 'dailyGrowthPercent',
        filterType: FilterType.Interval,
        intervalStartName: 'dailyGrowthPercentFrom',
        intervalEndName: 'dailyGrowthPercentTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'tradeVolume',
      displayName: 'Объём торгов',
      width: 80,
      minWidth: 80,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.tradeVolume != null ? formatNumber(data.tradingDetails!.tradeVolume, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'tradeVolume'], dir),
      filterData: {
        filterName: 'tradeVolume',
        filterType: FilterType.Interval,
        intervalStartName: 'tradeVolumeFrom',
        intervalEndName: 'tradeVolumeTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'tradeAmount',
      displayName: 'Объём торгов в базовой валюте',
      width: 80,
      minWidth: 80,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.tradeAmount != null ? formatNumber(data.tradingDetails!.tradeAmount, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'tradeAmount'], dir),
      filterData: {
        filterName: 'tradeAmount',
        filterType: FilterType.Interval,
        intervalStartName: 'tradeAmountFrom',
        intervalEndName: 'tradeAmountTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'exchange',
      displayName: 'Биржа',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.basicInformation!.exchange,
      width: 90,
      minWidth: 90,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'exchange'], dir),
      filterData: {
        filterName: 'exchange',
        isOpenedFilter: false,
        filterType: FilterType.DefaultMultiple,
        filters: [
          {value: 'MOEX', text: 'MOEX'},
          {value: 'SPBX', text: 'SPBX'},
        ]
      },
    },
    {
      id: 'board',
      displayName: 'Режим торгов',
      width: 90,
      minWidth: 90,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.boardInformation!.board ?? '',
      sortChangeFn: (dir): void => this.sortChange(['boardInformation', 'board'], dir),
      filterData: {
        filterName: 'board',
        isOpenedFilter: false,
        filterType: FilterType.MultipleAutocomplete,
        multipleAutocompleteSelectedOptionLabelKey: 'nzValue',
        filters: []
      },
    },
    {
      id: 'market',
      displayName: 'Рынок',
      width: 90,
      minWidth: 90,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.basicInformation!.market ?? '',
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'market'], dir),
      filterData: {
        filterName: 'market',
        isOpenedFilter: false,
        filterType: FilterType.DefaultMultiple,
        filters: [
          {value: 'CURR', text: 'CURR'},
          {value: 'FOND', text: 'FOND'},
          {value: 'FORTS', text: 'FORTS'},
          {value: 'SPBX', text: 'SPBX'},
        ]
      },
    },
    {
      id: 'lotSize',
      displayName: 'Лотность',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.lotSize != null ? formatNumber(data.tradingDetails!.lotSize, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'lotSize'], dir),
      filterData: {
        filterName: 'lotSize',
        filterType: FilterType.Interval,
        intervalStartName: 'lotSizeFrom',
        intervalEndName: 'lotSizeTo',
        inputFieldType: InputFieldType.Number
      },
      width: 70,
      minWidth: 70
    },
    {
      id: 'price',
      displayName: 'Цена',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.price != null ? formatNumber(data.tradingDetails!.price, this.locale, '0.0-10') : '',
      width: 80,
      minWidth: 80,
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'price'], dir),
      filterData: {
        filterName: 'price',
        filterType: FilterType.Interval,
        intervalStartName: 'priceFrom',
        intervalEndName: 'priceTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'priceMax',
      displayName: 'Макс. цена',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.priceMax != null ? formatNumber(data.tradingDetails!.priceMax, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceMax'], dir),
      filterData: {
        filterName: 'priceMax',
        filterType: FilterType.Interval,
        intervalStartName: 'priceMaxFrom',
        intervalEndName: 'priceMaxTo',
        inputFieldType: InputFieldType.Number
      },
      width: 60,
      minWidth: 60
    },
    {
      id: 'priceMin',
      displayName: 'Мин. цена',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.priceMin != null ? formatNumber(data.tradingDetails!.priceMin, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceMin'], dir),
      filterData: {
        filterName: 'priceMin',
        filterType: FilterType.Interval,
        intervalStartName: 'priceMinFrom',
        intervalEndName: 'priceMinTo',
        inputFieldType: InputFieldType.Number
      },
      width: 60,
      minWidth: 60
    },
    {
      id: 'priceScale',
      sourceField: 'minStep',
      displayName: 'Шаг цены',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.minStep != null ? formatNumber(data.tradingDetails!.minStep, this.locale, '0.0-10') : '',
      filterData: {
        filterName: 'minStep',
        filterType: FilterType.Interval,
        intervalStartName: 'minStepFrom',
        intervalEndName: 'minStepTo',
        inputFieldType: InputFieldType.Number
      },
      width: 90,
      minWidth: 90,
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'minStep'], dir),
    },
    {
      id: 'priceStep',
      displayName: 'Стоимость шага цены',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.priceStep != null ? formatNumber(data.tradingDetails!.priceStep, this.locale, '0.0-10') : '',
      filterData: {
        filterName: 'priceStep',
        filterType: FilterType.Interval,
        intervalStartName: 'priceStepFrom',
        intervalEndName: 'priceStepTo',
        inputFieldType: InputFieldType.Number
      },
      width: 90,
      minWidth: 90,
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceStep'], dir),
    }
  ];

  private readonly navigationStackService = inject(NavigationStackService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly instrumentsList$ = new BehaviorSubject<AllInstrumentsNodeDisplay[]>([]);

  private settings$!: Observable<AllInstrumentsWidgetSettings>;

  private readonly maxLoadingChunkSize = 1000;

  private updatesSub?: Subscription;

  override ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<AllInstrumentsWidgetSettings>(this.guid())
      .pipe(
        tap(() => this.resetLoadedData()),
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();

    this.navigationStackService.currentState$.pipe(
      filter(state => state.widgetTarget.typeId === 'all-instruments'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      const parameters = this.toNavigationParameters(state.widgetTarget.parameters);
      if (parameters?.sort?.parameter != null) {
        const targetColumn = this.allColumns.find(c => c.id === parameters.sort?.parameter);
        if (targetColumn != null) {
          const order = parameters.sort.order === SortEnumType.Desc ? 'descend' : 'ascend';
          this.table()?.sortChange(order, targetColumn);
        }
      }
    });
  }

  openContextMenu($event: MouseEvent, menu: AddToWatchlistMenu, selectedRow: AllInstrumentsNodeDisplay): void {
    this.nzContextMenuService.close(true);

    const menuRef = menu.menuRef();
    if (menuRef != null) {
      menu.itemToAdd.set(
        {
          symbol: selectedRow.basicInformation!.symbol,
          exchange: selectedRow.basicInformation!.exchange
        }
      );

      this.nzContextMenuService.create($event, menuRef);
    }
  }

  initTableDataStream(): Observable<AllInstrumentsNodeDisplay[]> {
    this.initInstruments();

    return this.instrumentsList$.pipe(
      mapWith(
        () => this.dashboardContextService.instrumentsSelection$,
        (instruments, output) => ({instruments, badges: output})
      ),
      mapWith(
        () => this.terminalSettingsService.getSettings(),
        (source, output) => ({...source, terminalSettings: output})
      ),
      map(s => this.mapInstrumentsToBadges(s.instruments, s.badges, s.terminalSettings))
    );
  }

  onScrolled(): void {
    this.scrolled.set(new Date().getTime());
  }

  override applyFilter(filters: DefaultTableFilters): void {
    const cleanedFilters = Object.keys(filters)
      .filter(key =>
        filters[key] != null &&
        (
          (typeof filters[key] === 'number') ||
          (typeof filters[key] === 'boolean') ||
          (filters[key] as string | string[]).length > 0
        )
      )
      .reduce((acc, curr) => {
        acc[curr] = filters[curr];
        return acc;
      }, {} as DefaultTableFilters);

    this.resetLoadedData();

    this.filters$.next(cleanedFilters);
  }

  override rowClick(node: AllInstrumentsNodeDisplay): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext.selectInstrument({
        symbol: node.basicInformation!.symbol!,
        exchange: node.basicInformation!.exchange!,
        instrumentGroup: node.boardInformation?.board
      }, s.badgeColor ?? DefaultBadge);
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.updatesSub?.unsubscribe();
    this.instrumentsList$.complete();
    this.exportBtnSize$.complete();
  }

  override changeColumnOrder(event: CdkDragDrop<unknown>): void {
    super.changeColumnOrder<AllInstrumentsWidgetSettings>(event, this.settings$);
  }

  override saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<AllInstrumentsWidgetSettings>(event, this.settings$);
  }

  exportBtnSizeChange(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.exportBtnSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  protected override initContentSize(): void {
    this.contentSize$ = combineLatest([
      this.containerSize$,
      this.exportBtnSize$
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([containerSize, exportBtnSize]) => ({
          width: containerSize?.width ?? exportBtnSize?.width ?? 0,
          height: (containerSize?.height ?? 0) - (exportBtnSize?.height ?? 0)
        }))
      );
  }

  protected initTableConfigStream(): Observable<TableConfig<AllInstrumentsNodeDisplay>> {
    return this.instrumentsService.getAllBoards()
      .pipe(
        take(1),
        tap(boards => {
          const boardColumn: BaseColumnSettings<AllInstrumentsNodeDisplay> | undefined = this.allColumns.find(c => c.id === 'board');

          if (boardColumn != null) {
            boardColumn.filterData!.filters = boards?.map(b => ({
              text: `${b.code} (${b.description})`,
              value: b.code
            })) ?? [];
          }
        }),
        switchMap(() => this.settings$),
        mapWith(
          () => this.translatorService.getTranslator('all-instruments/all-instruments'),
          (settings, translate) => ({settings, translate})
        ),
        map(({settings, translate}) => {
          const tableSettings = TableSettingHelper.toTableDisplaySettings(settings.allInstrumentsTable, settings.allInstrumentsColumns);

          return {
            columns: this.allColumns
              .map(column => ({column, settings: tableSettings?.columns.find(c => c.columnId === column.id)}))
              .filter(col => col.settings != null)
              .map((col, index) => ({
                  ...col.column,
                  displayName: translate(
                    ['columns', col.column.id, 'name'],
                    {fallback: col.column.displayName}
                  ),
                  tooltip: translate(
                    ['columns', col.column.id, 'tooltip'],
                    {fallback: col.column.displayName}
                  ),
                  width: col.settings!.columnWidth ?? this.defaultColumnWidth as number,
                  order: col.settings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
                })
              )
              .sort((a, b) => a.order - b.order)
          };
        }),
        shareReplay(1)
      );
  }

  protected exportToFile(): void {
    combineLatest({
      filters: this.filters$,
      sort: this.sort$,
      tableConfig: this.tableConfig$,
      t: this.translatorService.getTranslator('all-instruments/all-instruments'),
    })
      .pipe(
        mapWith(
          ({filters, sort, tableConfig}) => {
            const columnIds = tableConfig.columns.map(c => c.sourceField ?? c.id);

            return this.service.getInstruments(
              columnIds,
              filters,
              {
                first: this.maxLoadingChunkSize,
                sort: sort == null ? null : [sort]
              }
            );
          },
          ({tableConfig, t}, res) => ({tableConfig, t, res})
        ),
        take(1)
      )
      .subscribe(({t, tableConfig, res}) => {
        if (res?.edges == null) {
          return;
        }

        const saveCsv = (): void => {
          const meta = tableConfig.columns.map(c => ({
              title: t(['columns', c.id, 'name']),
              readFn: item => {
                return c.transformFn?.({
                  ...item,
                  id: ''
                }) ?? item[c.id as keyof Instrument];
              }
            } as ExportColumnMeta<Instrument>)
          );

          const csv = CsvFormatter.toCsv(meta, res.edges!.map(i => i.node), csvFormatterConfigDefaults);

          FileSaver.save({
              fileType: FileType.Csv,
              name: t(['csvFileTitle'])
            },
            csv);
        };

        if (res.pageInfo.hasNextPage) {
          this.modalService.warning({
            nzTitle: t(['warningModal', 'title']),
            nzContent: t(['warningModal', 'content']),
            nzOkText: t(['saveBtnText']),
            nzOkType: 'primary',
            nzCancelText: t(['cancelBtnText']),
            nzOnOk: saveCsv
          });
        } else {
          saveCsv();
        }
      });
  }

  private initInstruments(): void {
    combineLatest([
      this.tableConfig$,
      this.filters$,
      this.sort$,
      this.scrolledChanges$
    ])
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap(
          ([tableConfig, filters, sort]) => {
            const columnIds = tableConfig.columns.map(c => c.sourceField ?? c.id);

            return this.service.getInstruments(
              columnIds,
              filters,
              {
                first: this.loadingChunkSize,
                after: this.pagination?.endCursor,
                sort: sort == null ? null : [sort]
              }
            );
          }),
        tap(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(res => {
      if (res == null) {
        return;
      }

      const newInstruments = res.edges?.map((ie: InstrumentsEdge) => ({
        ...ie.node,
        id: ie.cursor
      } as AllInstrumentsNodeDisplay)) ?? [];

      if (this.pagination == null) {
        this.instrumentsList$.next(newInstruments);
        this.pagination = res.pageInfo ?? null;
        this.subscribeToUpdates();
        return;
      }

      this.instrumentsList$.pipe(take(1))
        .subscribe(instruments => {
          this.instrumentsList$.next([...instruments, ...newInstruments]);
          this.pagination = res.pageInfo ?? null;
          this.subscribeToUpdates();
        });
    });
  }

  private mapInstrumentsToBadges(instruments: AllInstrumentsNodeDisplay[], badges: InstrumentGroups, terminalSettings: TerminalSettings): AllInstrumentsNodeDisplay[] {
    const defaultBadges: InstrumentGroups = badges[DefaultBadge] != null
      ? {[DefaultBadge]: badges[DefaultBadge]}
      : {};

    const availableBadges = (terminalSettings.badgesBind ?? false)
      ? badges
      : defaultBadges;

    return instruments.map(instr => ({
      ...instr,
      badges: Object.keys(availableBadges)
        .filter(key =>
          instr.basicInformation!.symbol === availableBadges[key]!.symbol &&
          instr.basicInformation!.exchange as string === availableBadges[key]!.exchange
        )
    }));
  }

  private subscribeToUpdates(): void {
    this.updatesSub?.unsubscribe();

    this.updatesSub = createRefresh(
      10_000,
      this.applicationStatusService.isActive$,
      10_000
    ).pipe(
      withLatestFrom(
        this.tableConfig$,
        this.instrumentsList$,
        this.filters$,
        this.sort$
      ),
      filter(([, , instrumentsList, ,]) => !this.isLoading() && (instrumentsList ?? []).length > 0),
      map(([, tableConfig, instrumentsList, filters, sort]) => ({tableConfig, instrumentsList, filters, sort})),
      switchMap(({tableConfig, instrumentsList, filters, sort}) => {
        const columnIds = tableConfig.columns.map(c => c.sourceField ?? c.id);

        return this.service.getInstruments(
          columnIds,
          filters,
          {
            first: instrumentsList.length,
            sort: sort == null ? null : [sort]
          });
      }),
      filter(i => i != null)
    ).subscribe(res => {
      if (res == null) {
        return;
      }

      const updatedInstruments = res.edges?.map(ie => ({
        ...ie.node,
        id: ie.cursor
      } as AllInstrumentsNodeDisplay)) ?? [];

      this.instrumentsList$.next(updatedInstruments!);
    });
  }

  private sortChange(fields: string[], sort: string | null): void {
    this.resetLoadedData();

    if (sort == null) {
      this.sort$.next(null);
      return;
    }

    const sortObj = fields.reduceRight((acc, curr, index) => {
      if (index === fields.length - 1) {
        return {[curr]: sort === 'descend' ? SortEnumType.Desc : SortEnumType.Asc};
      }
      return {[curr]: acc};
    }, {} as InstrumentModelSortInput);

    this.sort$.next(sortObj);
  }

  private toNavigationParameters(parameters: Record<string, unknown> | undefined): AllInstrumentsNavigationParameters | null {
    const sort = parameters?.sort;
    if (typeof sort !== 'object' || sort == null) {
      return null;
    }

    const sortRecord = sort as Record<string, unknown>;
    return {
      sort: {
        parameter: typeof sortRecord.parameter === 'string' ? sortRecord.parameter : undefined,
        order: sortRecord.order === SortEnumType.Desc ? SortEnumType.Desc : SortEnumType.Asc
      }
    };
  }

  private resetLoadedData(): void {
    this.instrumentsList$.next([]);
    this.pagination = null;
  }
}
