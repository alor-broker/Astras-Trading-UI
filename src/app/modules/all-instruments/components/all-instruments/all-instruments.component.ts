import {
  Component,
  DestroyRef,
  Inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { AllInstrumentsService } from "../../services/all-instruments.service";
import {
  BehaviorSubject,
  combineLatest,
  interval,
  Subscription,
  switchMap,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AllInstruments,
  AllInstrumentsFilters
} from "../../model/all-instruments.model";
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
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import {
  WatchlistCollection,
  WatchlistType
} from "../../../instruments/models/watchlist.model";
import { ACTIONS_CONTEXT, ActionsContext } from 'src/app/shared/services/actions-context';
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { BaseTableComponent } from "../../../../shared/components/base-table/base-table.component";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";

@Component({
  selector: 'ats-all-instruments',
  templateUrl: './all-instruments.component.html',
  styleUrls: ['./all-instruments.component.less']
})
export class AllInstrumentsComponent extends BaseTableComponent<AllInstrumentsSettings, AllInstruments, AllInstrumentsFilters>
implements OnInit, OnDestroy {
  public allColumns: BaseColumnSettings<AllInstruments>[] = [
    {
      id: 'name',
      displayName: 'Тикер',
      width: 100,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'symbol' }),
      filterData: {
        filterName: 'query'
      },
      showBadges: true
    },
    { id: 'shortName', displayName: 'Название', width: 100 },
    {
      id: 'currency',
      displayName: 'Валюта',
      width: 90,
      filterData: {
        filterName: 'currency',
        isOpenedFilter: false,
      },
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'currency' }),
    },
    {
      id: 'dailyGrowth',
      displayName: 'Рост за сегодня',
      classFn: (data): 'sell' | 'buy' => data.dailyGrowth < 0 ? 'sell' : 'buy',
      width: 100,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'dailyGrowth' }),
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
      classFn: (data): 'sell' | 'buy' => data.dailyGrowth < 0 ? 'sell' : 'buy',
      width: 100,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'dailyGrowthPercent' }),
    },
    {
      id: 'tradeVolume',
      displayName: 'Объём торгов',
      width: 110,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'tradeVolume' }),
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
      width: 90,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'exchange' }),
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
      id: 'market',
      displayName: 'Рынок',
      width: 90,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'marketType' }),
      filterData: {
        filterName: 'marketType',
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
    { id: 'lotSize', displayName: 'Лотность', width: 70 },
    {
      id: 'price',
      displayName: 'Цена',
      width: 80,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'price' }),
      filterData: {
        filterName: 'price',
        isInterval: true,
        intervalStartName: 'priceFrom',
        intervalEndName: 'priceTo'
      }
    },
    { id: 'priceMax', displayName: 'Макс. цена', width: 80 },
    { id: 'priceMin', displayName: 'Мин. цена', width: 80 },
    {
      id: 'priceScale',
      displayName: 'Шаг цены',
      width: 90,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'priceScale' }),
    },
    {
      id: 'yield',
      displayName: 'Доходность',
      width: 100,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'yield' }),
    },
  ];
  public contextMenu: ContextMenu[] = [];
  private readonly instrumentsList$ = new BehaviorSubject<AllInstruments[]>([]);

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
    super(settingsService, destroyRef, actionsContext);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.watchlistCollectionService.getWatchlistCollection()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(collection => {
        this.initContextMenu(collection);
      });
  }

  protected initTableConfig(): void {
    this.tableConfig$ = this.settings$.pipe(
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

  initTableData(): void {
    this.tableData$ = this.instrumentsList$.pipe(
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

    this.initInstruments();
  }

  scrolled(): void {
    this.instrumentsList$.pipe(
      take(1),
      withLatestFrom(this.isLoading$),
      filter(([, isLoading,]) => !isLoading),
      map(([instrumentsList]) => instrumentsList),
    ).subscribe(instruments => {
      const loadedIndex = this.pagination && (this.pagination.limit + this.pagination.offset);
      if (loadedIndex != null && instruments.length < loadedIndex) {
        return;
      }

      this.pagination = { limit: this.loadingChunkSize, offset: instruments.length };
      this.scrolled$.next(null);
    });
  }

  rowToInstrumentKey(row: AllInstruments): InstrumentKey {
    return {
      symbol: row.name,
      exchange: row.exchange,
    } as InstrumentKey;
  }

  initContextMenu(collection: WatchlistCollection): void {
    const avalableWatchlists = collection.collection.filter(c => c.type != WatchlistType.HistoryList);

    this.contextMenu = [
      {
        title: 'Добавить в список',
        clickFn: (row: AllInstruments) : void => {
          if (avalableWatchlists.length > 1) {
            return;
          }

          this.watchlistCollectionService.addItemsToList(
            avalableWatchlists[0].id,
            [
            { symbol: row.name, exchange: row.exchange }
            ]);
        }
      }
    ];

    if (avalableWatchlists.length > 1) {
      this.contextMenu[0].subMenu = avalableWatchlists
        .map(list => ({
          title: list.title,
          clickFn: (row: AllInstruments): void => {
            this.watchlistCollectionService.addItemsToList(list.id, [
              { symbol: row.name, exchange: row.exchange }
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

  private initInstruments(): void {
    combineLatest([
      this.filters$,
      this.sort$
        .pipe(
          tap(() => this.pagination = null)
        ),
      this.scrolled$
    ])
      .pipe(
        tap(() => this.isLoading$.next(true)),
        mapWith(
          ([filters, sort]) => {
            let reqFilters = (filters ?? {}) as AllInstrumentsFilters;

            if (sort != null) {
              reqFilters = { ...reqFilters, ...sort };
            }

            if (this.pagination == null) {
              reqFilters.limit = this.loadingChunkSize;
              reqFilters.offset = 0;
            } else {
              reqFilters = { ...reqFilters, ...this.pagination };
            }

            return this.service.getAllInstruments(reqFilters).pipe(filter(i => i != null));
          },
          (f, res) => res
        ),
        tap(() => this.isLoading$.next(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(res => {
        if (this.pagination == null) {
          this.instrumentsList$.next(res!);
          this.subscribeToUpdates();
          return;
        }

        this.instrumentsList$.pipe(take(1))
          .subscribe(instruments => {
            this.instrumentsList$.next([...instruments, ...res!]);
            this.subscribeToUpdates();
          });
    });
  }

  private mapInstrumentsToBadges(instruments: AllInstruments[], badges: InstrumentGroups, terminalSettings: TerminalSettings): AllInstruments[] {
    const defaultBadges: InstrumentGroups = badges[defaultBadgeColor] != null
    ? { [defaultBadgeColor]: badges[defaultBadgeColor] }
      : {};

    const availableBadges = (terminalSettings.badgesBind ?? false)
      ? badges
      : defaultBadges;

    return instruments.map(instr => ({
      ...instr,
      badges: Object.keys(availableBadges)
        .filter(key => instr.name === availableBadges[key]!.symbol && instr.exchange === availableBadges[key]!.exchange)
    }));
  }

  private subscribeToUpdates(): void {
    this.updatesSub?.unsubscribe();

    this.updatesSub = interval(10_000)
      .pipe(
        withLatestFrom(this.isLoading$, this.filters$, this.sort$),
        filter(([, isLoading,]) => !isLoading),
        map(([, , filters, sort]) => ({ filters, sort: sort ?? {} })),
        map(({ filters, sort }) => ({
          ...filters,
          ...sort,
          offset: 0,
          limit: this.pagination == null ? this.loadingChunkSize : (this.pagination.limit + this.pagination.offset)
        })),
        switchMap(f => this.service.getAllInstruments(f).pipe(filter(i => i != null)))
      ).subscribe(instruments => {
        if (instruments!.length === 0) {
          return;
        }

        this.instrumentsList$.next(instruments!);
      });
  }
}
