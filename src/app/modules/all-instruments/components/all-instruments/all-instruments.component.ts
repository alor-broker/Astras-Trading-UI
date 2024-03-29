import {
  Component,
  DestroyRef,
  Inject,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { AllInstrumentsService } from "../../services/all-instruments.service";
import {
  BehaviorSubject,
  combineLatest,
  interval,
  Observable,
  shareReplay,
  Subscription,
  switchMap,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { AllInstrumentsNode } from "../../model/all-instruments.model";
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";
import { ContextMenu } from "../../../../shared/models/infinite-scroll-table.model";
import { mapWith } from '../../../../shared/utils/observable-helper';
import {
  filter,
  map
} from 'rxjs/operators';
import { TerminalSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { InstrumentGroups } from '../../../../shared/models/dashboard/dashboard.model';
import { AllInstrumentsSettings } from '../../model/all-instruments-settings.model';
import { BaseColumnSettings, DefaultTableFilters } from "../../../../shared/models/settings/table-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import {
  WatchlistCollection,
  WatchlistType
} from "../../../instruments/models/watchlist.model";
import { ACTIONS_CONTEXT, ActionsContext } from 'src/app/shared/services/actions-context';
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { TableConfig } from "../../../../shared/models/table-config.model";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import {
  LazyLoadingBaseTableComponent
} from "../../../../shared/components/lazy-loading-base-table/lazy-loading-base-table.component";
import {
  GraphQlEdge,
  GraphQlPageInfo,
  GraphQlSort,
  GraphQlSortType
} from "../../../../shared/models/graph-ql.model";

interface AllInstrumentsNodeDisplay extends AllInstrumentsNode {
  id: string;
}

@Component({
  selector: 'ats-all-instruments',
  templateUrl: './all-instruments.component.html',
  styleUrls: ['./all-instruments.component.less']
})
export class AllInstrumentsComponent extends LazyLoadingBaseTableComponent<
  AllInstrumentsNodeDisplay,
  DefaultTableFilters,
  GraphQlPageInfo,
  GraphQlSort
>
implements OnInit, OnDestroy {
  @Input({ required: true }) guid!: string;

  public allColumns: BaseColumnSettings<AllInstrumentsNodeDisplay>[] = [
    {
      id: 'name',
      sourceField: 'symbol',
      displayName: 'Тикер',
      width: 80,
      minWidth: 80,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.basicInformation!.symbol!,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'symbol'], dir),
      filterData: {
        filterName: 'symbol'
      },
      showBadges: true
    },
    {
      id: 'shortName',
      displayName: 'Название',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.basicInformation!.shortName!,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'shortName'], dir),
      filterData: {
        filterName: 'shortName'
      },
      width: 50,
      minWidth: 50
    },
    {
      id: 'currency',
      sourceField: 'nominal',
      displayName: 'Валюта',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.currencyInformation!.nominal!,
      sortChangeFn: (dir): void => this.sortChange(['currencyInformation', 'nominal'], dir),
      filterData: {
        filterName: 'nominal',
        isOpenedFilter: false,
      },
      width: 90,
      minWidth: 90,
    },
    {
      id: 'dailyGrowth',
      displayName: 'Рост за сегодня',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.realTimeData!.dailyGrowth!.toString(),
      classFn: (data): 'sell' | 'buy' => data.realTimeData!.dailyGrowth! < 0 ? 'sell' : 'buy',
      width: 100,
      minWidth: 100,
      sortChangeFn: (dir): void => this.sortChange(['realTimeData', 'dailyGrowth'], dir),
      filterData: {
        filterName: 'dailyGrowth',
        isInterval: true,
        intervalStartName: 'dailyGrowthFrom',
        intervalEndName: 'dailyGrowthTo'
      }
    },
    {
      id: 'dailyGrowthPercent',
      displayName: 'Рост за сегодня, %',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.realTimeData!.dailyGrowthPercent!.toString(),
      classFn: (data): 'sell' | 'buy' => data.realTimeData!.dailyGrowthPercent! < 0 ? 'sell' : 'buy',
      width: 100,
      minWidth: 100,
      sortChangeFn: (dir): void => this.sortChange(['realTimeData', 'dailyGrowthPercent'], dir),
      filterData: {
        filterName: 'dailyGrowthPercent',
        isInterval: true,
        intervalStartName: 'dailyGrowthPercentFrom',
        intervalEndName: 'dailyGrowthPercentTo'
      }
    },
    {
      id: 'tradeVolume',
      displayName: 'Объём торгов',
      width: 80,
      minWidth: 80,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.realTimeData!.tradeVolume!.toString(),
      sortChangeFn: (dir): void => this.sortChange(['realTimeData', 'tradeVolume'], dir),
      filterData: {
        filterName: 'tradeVolume',
        isInterval: true,
        intervalStartName: 'tradeVolumeFrom',
        intervalEndName: 'tradeVolumeTo'
      }
    },
    {
      id: 'exchange',
      displayName: 'Биржа',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.basicInformation!.exchange!,
      width: 90,
      minWidth: 90,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'exchange'], dir),
      filterData: {
        filterName: 'exchange',
        isOpenedFilter: false,
        isDefaultFilter: true,
        isMultipleFilter: true,
        filters: [
          { value: 'MOEX', text: 'MOEX' },
          { value: 'SPBX', text: 'SPBX' },
        ]
      },
    },
    {
      id: 'board',
      displayName: 'Режим торгов',
      width: 90,
      minWidth: 90,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.boardInformation!.board!,
      sortChangeFn: (dir): void => this.sortChange(['boardInformation', 'board'], dir),
      filterData: {
        filterName: 'board',
        isOpenedFilter: false,
        isDefaultFilter: false,
        isMultipleFilter: true,
        filters: [
          { value: 'CURR', text: 'CURR' },
          { value: 'FOND', text: 'FOND' },
          { value: 'FORTS', text: 'FORTS' },
          { value: 'SPBX', text: 'SPBX' },
        ]
      },
    },
    {
      id: 'market',
      displayName: 'Рынок',
      width: 90,
      minWidth: 90,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.basicInformation!.market!,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'market'], dir),
      filterData: {
        filterName: 'market',
        isOpenedFilter: false,
        isDefaultFilter: true,
        isMultipleFilter: true,
        filters: [
          { value: 'CURR', text: 'CURR' },
          { value: 'FOND', text: 'FOND' },
          { value: 'FORTS', text: 'FORTS' },
          { value: 'SPBX', text: 'SPBX' },
        ]
      },
    },
    {
      id: 'lotSize',
      displayName: 'Лотность',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.lotSize!.toString(),
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'lotSize'], dir),
      filterData: {
        filterName: 'lotSize',
        isInterval: true,
        intervalStartName: 'lotSizeFrom',
        intervalEndName: 'lotSizeTo'
      },
      width: 70,
      minWidth: 70
    },
    {
      id: 'price',
      displayName: 'Цена',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.realTimeData!.price!.toString(),
      width: 80,
      minWidth: 80,
      sortChangeFn: (dir): void => this.sortChange(['realTimeData', 'price'], dir),
      filterData: {
        filterName: 'price',
        isInterval: true,
        intervalStartName: 'priceFrom',
        intervalEndName: 'priceTo'
      }
    },
    {
      id: 'priceMax',
      displayName: 'Макс. цена',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.priceMax!.toString(),
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceMax'], dir),
      filterData: {
        filterName: 'priceMax',
        isInterval: true,
        intervalStartName: 'priceMaxFrom',
        intervalEndName: 'priceMaxTo'
      },
      width: 60,
      minWidth: 60
    },
    {
      id: 'priceMin',
      displayName: 'Мин. цена',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.priceMin!.toString(),
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceMin'], dir),
      filterData: {
        filterName: 'priceMin',
        isInterval: true,
        intervalStartName: 'priceMinFrom',
        intervalEndName: 'priceMinTo'
      },
      width: 60,
      minWidth: 60
    },
    {
      id: 'priceScale',
      sourceField: 'minStep',
      displayName: 'Шаг цены',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.minStep!.toString(),
      filterData: {
        filterName: 'minStep',
        isInterval: true,
        intervalStartName: 'minStepFrom',
        intervalEndName: 'minStepTo'
      },
      width: 90,
      minWidth: 90,
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'minStep'], dir),
    },
    {
      id: 'priceStep',
      displayName: 'Стоимость шага цены',
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.tradingDetails!.priceStep!.toString(),
      filterData: {
        filterName: 'priceStep',
        isInterval: true,
        intervalStartName: 'priceStepFrom',
        intervalEndName: 'priceStepTo'
      },
      width: 90,
      minWidth: 90,
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceStep'], dir),
    },
    {
      id: 'yield',
      displayName: 'Доходность',
      width: 100,
      minWidth: 100,
      transformFn: (data: AllInstrumentsNodeDisplay): string => data.realTimeData!.yield!.toString(),
      sortChangeFn: (dir): void => this.sortChange(['realTimeData', 'yield'], dir),
      filterData: {
        filterName: 'yield',
        isInterval: true,
        intervalStartName: 'yieldFrom',
        intervalEndName: 'yieldTo'
      }
    }
  ];
  public contextMenu: ContextMenu[] = [];
  private readonly instrumentsList$ = new BehaviorSubject<AllInstrumentsNodeDisplay[]>([]);
  private settings$!: Observable<AllInstrumentsSettings>;

  private updatesSub?: Subscription;
  protected settingsTableName = 'allInstrumentsTable';
  protected settingsColumnsName = 'allInstrumentsColumns';

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    private readonly service: AllInstrumentsService,
    private readonly dashboardContextService: DashboardContextService,
    @Inject(ACTIONS_CONTEXT)
    protected readonly actionsContext: ActionsContext,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly translatorService: TranslatorService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, destroyRef);
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<AllInstrumentsSettings>(this.guid)
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();

    this.watchlistCollectionService.getWatchlistCollection()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(collection => {
        this.initContextMenu(collection);
      });
  }

  protected initTableConfigStream(): Observable<TableConfig<AllInstrumentsNodeDisplay>> {
    return this.settings$.pipe(
      mapWith(
        () => this.translatorService.getTranslator('all-instruments/all-instruments'),
        (settings, translate) => ({ settings, translate })
      ),
      map(({ settings, translate }) => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(settings.allInstrumentsTable, settings.allInstrumentsColumns);

        return {
          columns: this.allColumns
            .map(column => ({ column, settings: tableSettings?.columns.find(c => c.columnId === column.id) }))
            .filter(col => col.settings != null)
            .map((col, index) => ({
                ...col.column,
                displayName: translate(
                  ['columns', col.column.id, 'name'],
                  { fallback: col.column.displayName }
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
      })
    );
  }

  initTableDataStream(): Observable<AllInstrumentsNodeDisplay[]> {
    this.initInstruments();

    return this.instrumentsList$.pipe(
      mapWith(
        () => this.dashboardContextService.instrumentsSelection$,
        (instruments, output) => ({ instruments, badges: output })
      ),
      mapWith(
        () => this.terminalSettingsService.getSettings(),
        (source, output) => ({ ...source, terminalSettings: output })
      ),
      map(s => this.mapInstrumentsToBadges(s.instruments, s.badges, s.terminalSettings))
    );
  }

  scrolled(): void {
      this.scrolled$.next(null);
  }

  applyFilter(filters: DefaultTableFilters): void {
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

    this.pagination = null;
    this.filters$.next(cleanedFilters);
  }

  rowClick(row: AllInstrumentsNodeDisplay): void {
      this.settings$.pipe(
        take(1)
      ).subscribe(s => {
        this.actionsContext.instrumentSelected({
          symbol: row.basicInformation!.symbol!,
          exchange: row.basicInformation!.exchange!
        }, s.badgeColor ?? defaultBadgeColor);
      });
  }

  initContextMenu(collection: WatchlistCollection): void {
    const avalableWatchlists = collection.collection.filter(c => c.type != WatchlistType.HistoryList);

    this.contextMenu = [
      {
        title: 'Добавить в список',
        clickFn: (row: AllInstrumentsNodeDisplay) : void => {
          if (avalableWatchlists.length > 1) {
            return;
          }

          this.watchlistCollectionService.addItemsToList(
            avalableWatchlists[0].id,
            [
              {
                symbol: row.basicInformation!.symbol!,
                exchange: row.basicInformation!.exchange!
              }
            ]);
        }
      }
    ];

    if (avalableWatchlists.length > 1) {
      this.contextMenu[0].subMenu = avalableWatchlists
        .map(list => ({
          title: list.title,
          clickFn: (row: AllInstrumentsNodeDisplay): void => {
            this.watchlistCollectionService.addItemsToList(list.id, [
              {
                symbol: row.basicInformation!.symbol!,
                exchange: row.basicInformation!.exchange!
              }
            ]);
          }
        }));
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.updatesSub?.unsubscribe();
    this.instrumentsList$.complete();
  }

  changeColumnOrder(event: CdkDragDrop<any>): void {
    super.changeColumnOrder<AllInstrumentsSettings>(event, this.settings$);
  }

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<AllInstrumentsSettings>(event, this.settings$);
  }

  private initInstruments(): void {
    combineLatest([
      this.tableConfig$,
      this.filters$,
      this.sort$
        .pipe(
          tap(() => this.pagination = null)
        ),
      this.scrolled$
    ])
      .pipe(
        tap(() => this.isLoading$.next(true)),
        switchMap(
          ([tableConfig, filters, sort]) => {
            const columnIds = tableConfig.columns.map(c => c.sourceField ?? c.id);

            return this.service.getInstruments(
              columnIds,
              filters,
              {
                first: this.loadingChunkSize,
                after: this.pagination?.endCursor,
                sort
              }
            );
          }),
        filter(i => i != null),
        tap(() => this.isLoading$.next(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(res => {
        const newInstruments = res!.instruments.edges.map((ie: GraphQlEdge<AllInstrumentsNode>) => ({
          ...ie.node,
          id: ie.cursor
        } as AllInstrumentsNodeDisplay));

        if (this.pagination == null) {
          this.instrumentsList$.next(newInstruments!);
          this.pagination = res!.instruments.pageInfo ?? null;
          this.subscribeToUpdates();
          return;
        }

        this.instrumentsList$.pipe(take(1))
          .subscribe(instruments => {
            this.instrumentsList$.next([...instruments, ...newInstruments!]);
            this.pagination = res!.instruments.pageInfo ?? null;
            this.subscribeToUpdates();
          });
    });
  }

  private mapInstrumentsToBadges(instruments: AllInstrumentsNodeDisplay[], badges: InstrumentGroups, terminalSettings: TerminalSettings): AllInstrumentsNodeDisplay[] {
    const defaultBadges: InstrumentGroups = badges[defaultBadgeColor] != null
    ? { [defaultBadgeColor]: badges[defaultBadgeColor] }
      : {};

    const availableBadges = (terminalSettings.badgesBind ?? false)
      ? badges
      : defaultBadges;

    return instruments.map(instr => ({
      ...instr,
      badges: Object.keys(availableBadges)
        .filter(key =>
          instr.basicInformation!.symbol === availableBadges[key]!.symbol &&
          instr.basicInformation!.exchange === availableBadges[key]!.exchange
        )
    }));
  }

  private subscribeToUpdates(): void {
    this.updatesSub?.unsubscribe();

    this.updatesSub = interval(10_000)
      .pipe(
        withLatestFrom(
          this.isLoading$,
          this.tableConfig$,
          this.instrumentsList$,
          this.filters$,
          this.sort$
        ),
        filter(([, isLoading,, instrumentsList]) => !isLoading && instrumentsList.length > 0),
        map(([,, tableConfig, instrumentsList, filters, sort]) => ({ tableConfig, instrumentsList, filters, sort })),
        switchMap(({ tableConfig, instrumentsList, filters, sort }) => {
          const columnIds = tableConfig.columns.map(c => c.sourceField ?? c.id);

          return this.service.getInstruments(
            columnIds,
            filters,
            {
              first: instrumentsList.length,
              sort
            });
        }),
        filter(i => i != null)
      ).subscribe(res => {
        const updatedInstruments = res!.instruments.edges.map(ie => ({
          ...ie.node,
          id: ie.cursor
        } as AllInstrumentsNodeDisplay));

        this.instrumentsList$.next(updatedInstruments!);
      });
  }

  private sortChange(fields: string[], sort: string | null): void {
    if (sort == null) {
      this.sort$.next(null);
      return;
    }

    const sortObj = fields.reduceRight((acc, curr, index) => {
      if (index === fields.length - 1) {
        return { [curr]: sort === 'descend' ? GraphQlSortType.DESC : GraphQlSortType.ASC };
      }
      return { [curr]: acc };
    }, {} as GraphQlSort);

    this.sort$.next(sortObj);
  }
}
