import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DashboardItemContentSize } from "../../../../shared/models/dashboard-item.model";
import { ColumnsSettings } from "../../../../shared/models/columns-settings.model";
import { AllInstrumentsService } from "../../services/all-instruments.service";
import {
  BehaviorSubject,
  interval,
  Observable,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { AllInstrumentsSettings } from "../../../../shared/models/settings/all-instruments-settings.model";
import { AllInstruments, AllInstrumentsFilters } from "../../model/all-instruments.model";
import { Store } from "@ngrx/store";
import { selectNewInstrumentByBadge } from "../../../../store/instruments/instruments.actions";
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";
import { ContextMenu } from "../../../../shared/models/infinite-scroll-table.model";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { getSelectedInstrumentsWithBadges } from "../../../../store/instruments/instruments.selectors";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { mapWith } from '../../../../shared/utils/observable-helper';
import { filter, map } from 'rxjs/operators';
import { InstrumentBadges } from '../../../../shared/models/instruments/instrument.model';
import { TerminalSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { TranslatorService } from "../../../../shared/services/translator.service";

@Component({
  selector: 'ats-all-instruments',
  templateUrl: './all-instruments.component.html',
  styleUrls: ['./all-instruments.component.less']
})
export class AllInstrumentsComponent implements OnInit, OnDestroy {
  @Input() guid!: string;
  @Input() contentSize!: DashboardItemContentSize | null;
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public allColumns: ColumnsSettings[] = [
    {
      name: 'name',
      displayName: 'Тикер',
      width: '100px',
      sortFn: this.getSortFn('symbol'),
      filterData: {
        filterName: 'query'
      },
      showBadges: true
    },
    { name: 'shortName', displayName: 'Название', width: '100px' },
    {
      name: 'currency',
      displayName: 'Валюта',
      width: '90px',
      filterData: {
        filterName: 'currency',
        isOpenedFilter: false,
      },
      sortFn: this.getSortFn('currency'),
    },
    {
      name: 'dailyGrowth',
      displayName: 'Рост за сегодня',
      classFn: data => data.dailyGrowth < 0 ? 'sell' : 'buy',
      width: '100px',
      sortFn: this.getSortFn('dailyGrowth'),
      filterData: {
        filterName: 'dailyGrowth',
        isInterval: true,
        intervalStartName: 'dailyGrowthFrom',
        intervalEndName: 'dailyGrowthTo'
      }
    },
    {
      name: 'tradeVolume',
      displayName: 'Объём торгов',
      width: '110px',
      sortFn: this.getSortFn('tradeVolume'),
      filterData: {
        filterName: 'tradeVolume',
        isInterval: true,
        intervalStartName: 'tradeVolumeFrom',
        intervalEndName: 'tradeVolumeTo'
      }
    },
    {
      name: 'exchange',
      displayName: 'Биржа',
      width: '90px',
      sortFn: this.getSortFn('exchange'),
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
      name: 'market',
      displayName: 'Рынок',
      width: '90px',
      sortFn: this.getSortFn('marketType'),
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
    { name: 'lotSize', displayName: 'Лотность', width: '70px' },
    {
      name: 'price',
      displayName: 'Цена',
      width: '80px',
      sortFn: this.getSortFn('price'),
      filterData: {
        filterName: 'price',
        isInterval: true,
        intervalStartName: 'priceFrom',
        intervalEndName: 'priceTo'
      }
    },
    { name: 'priceMax', displayName: 'Макс. цена', width: '80px' },
    { name: 'priceMin', displayName: 'Мин. цена', width: '80px' },
    { name: 'priceScale', displayName: 'Шаг цены', width: '90px', sortFn: this.getSortFn('priceScale') },
    { name: 'yield', displayName: 'Доходность', width: '100px', sortFn: this.getSortFn('yield') },
  ];
  public displayedColumns$: BehaviorSubject<ColumnsSettings[]> = new BehaviorSubject<ColumnsSettings[]>([]);
  public contextMenu: ContextMenu[] = [];
  public instrumentsDisplay$!: Observable<AllInstruments[]>;
  private instrumentsList$ = new BehaviorSubject<AllInstruments[]>([]);
  private readonly loadingChunkSize = 50;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private updatesSub?: Subscription;
  private filters$ = new BehaviorSubject<AllInstrumentsFilters>({ limit: this.loadingChunkSize, offset: 0 });
  private badgeColor = defaultBadgeColor;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: AllInstrumentsService,
    private readonly store: Store,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.initInstruments();
    this.initContextMenu();

    this.instrumentsDisplay$ = this.instrumentsList$.pipe(
      mapWith(
        () => this.store.select(getSelectedInstrumentsWithBadges),
        (instruments, output) => ({ instruments, badges: output })
      ),
      mapWith(
        () => this.terminalSettingsService.getSettings(),
        (source, output) => ({ ...source, terminalSettings: output })
      ),
      map(s => this.mapInstrumentsToBadges(s.instruments, s.badges, s.terminalSettings))
    );

    this.settingsService.getSettings<AllInstrumentsSettings>(this.guid)
      .pipe(
        mapWith(
          () => this.translatorService.getTranslator('all-instruments/all-instruments'),
          (settings, translate) => ({ settings, translate })
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(({ settings, translate }) => {
        this.displayedColumns$.next(this.allColumns
          .filter(col => settings.allInstrumentsColumns.includes(col.name))
          .map(col => ({
              ...col,
              displayName: translate(
                ['columns', col.name],
                { fallback: col.displayName }
              )
            })
          ));
        this.badgeColor = settings.badgeColor!;
      });

    this.watchlistCollectionService.collectionChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initContextMenu();
      });
  }

  scrolled() {
    this.instrumentsList$.pipe(
      take(1),
      withLatestFrom(this.isLoading$, this.filters$),
      filter(([, isLoading,]) => !isLoading),
      map(([instrumentsList, , currentFilters]) => ({ instrumentsList, currentFilters })),
    ).subscribe(s => {
      const loadedIndex = s.currentFilters.limit! + s.currentFilters.offset!;
      if (s.instrumentsList.length < loadedIndex) {
        return;
      }

      this.updateFilters(curr => ({
        ...curr,
        offset: s.instrumentsList.length
      }));
    });
  }

  applyFilter(filters: any) {
    this.updateFilters(curr => {
      const allFilters = {
        ...curr,
        ...filters
      };

      const cleanedFilters = Object.keys(allFilters)
        .filter(key => !!allFilters[key])
        .reduce((acc, curr) => {
          if (Array.isArray(allFilters[curr])) {
            acc[curr] = allFilters[curr].join(';');
          }
          else {
            acc[curr] = allFilters[curr];
          }
          return acc;
        }, {} as any);

      return {
        ...cleanedFilters,
        offset: 0
      };
    });
  }

  selectInstrument(row: AllInstruments) {
    const instrument = {
      symbol: row.name,
      exchange: row.exchange,
    };
    this.store.dispatch(selectNewInstrumentByBadge({ instrument, badgeColor: this.badgeColor }));
  }

  initContextMenu() {
    this.contextMenu = [
      {
        title: 'Добавить в список',
        clickFn: (row: AllInstruments) => {
          if (this.watchlistCollectionService.getWatchlistCollection().collection.length > 1) {
            return;
          }

          this.watchlistCollectionService.addItemsToList(this.watchlistCollectionService.getWatchlistCollection().collection[0].id, [
            { symbol: row.name, exchange: row.exchange }
          ]);
        }
      }
    ];

    if (this.watchlistCollectionService.getWatchlistCollection().collection.length > 1) {
      this.contextMenu[0].subMenu = this.watchlistCollectionService.getWatchlistCollection().collection
        .map(list => ({
          title: list.title,
          clickFn: (row: AllInstruments) => {
            this.watchlistCollectionService.addItemsToList(list.id, [
              { symbol: row.name, exchange: row.exchange }
            ]);
          }
        }));
    }
  }

  ngOnDestroy() {
    this.updatesSub?.unsubscribe();

    this.filters$.complete();
    this.instrumentsList$.complete();
    this.isLoading$.complete();

    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private updateFilters(update: (curr: AllInstrumentsFilters) => AllInstrumentsFilters) {
    this.filters$.pipe(
      take(1)
    ).subscribe(curr => {
      this.filters$.next(update(curr));
    });
  }

  private initInstruments() {
    this.filters$.pipe(
      tap(() => this.isLoading$.next(true)),
      mapWith(
        f => this.service.getAllInstruments(f),
        (filters, res) => ({ filters, res })
      ),
      withLatestFrom(this.instrumentsList$),
      map(([s, currentList]) => s.filters.offset! > 0 ? [...currentList, ...s.res] : s.res),
      tap(() => this.isLoading$.next(false)),
      takeUntil(this.destroy$)
    ).subscribe(instruments => {
      this.instrumentsList$.next(instruments);
      this.subscribeToUpdates();
    });
  }

  private mapInstrumentsToBadges(instruments: AllInstruments[], badges: InstrumentBadges, terminalSettings: TerminalSettings): AllInstruments[] {
    return instruments.map(instr => ({
      ...instr,
      badges: Object.keys(terminalSettings.badgesBind ? badges : { [defaultBadgeColor]: badges[defaultBadgeColor] })
        .filter(key => instr.name === badges[key].symbol && instr.exchange === badges[key].exchange)
    }));
  }

  private subscribeToUpdates() {
    this.updatesSub?.unsubscribe();

    this.updatesSub = interval(10_000)
      .pipe(
        withLatestFrom(this.isLoading$, this.filters$),
        filter(([, isLoading,]) => !isLoading),
        map(([, , filters]) => filters),
        map(filters => ({
          ...filters,
          offset: 0,
          limit: filters.limit! + filters.offset!
        })),
        switchMap(f => this.service.getAllInstruments(f))
      ).subscribe(instruments => {
        this.instrumentsList$.next(instruments);
      });
  }

  private getSortFn(orderBy: string): (dir: string | null) => void {
    return (dir: string | null) => {
      this.updateFilters(curr => {
        const filter = {
          ...curr,
          offset: 0
        };

        delete filter.descending;
        delete filter.orderBy;

        if (dir) {
          filter.descending = dir === 'descend';
          filter.orderBy = orderBy;
        }

        return filter;
      });

    };
  }
}
