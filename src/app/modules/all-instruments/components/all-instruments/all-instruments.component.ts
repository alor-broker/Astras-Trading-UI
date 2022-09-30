import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DashboardItemContentSize } from "../../../../shared/models/dashboard-item.model";
import { ColumnsSettings } from "../../../../shared/models/columns-settings.model";
import { AllInstrumentsService } from "../../services/all-instruments.service";
import { interval, Subject, Subscription, switchMap, takeUntil, withLatestFrom } from "rxjs";
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
import { mapWith } from "../../../../shared/utils/observable-helper";

@Component({
  selector: 'ats-all-instruments',
  templateUrl: './all-instruments.component.html',
  styleUrls: ['./all-instruments.component.less']
})
export class AllInstrumentsComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private instrumentsSub!: Subscription;
  private filters: AllInstrumentsFilters = {
    limit: 50,
    offset: 0
  };
  private badgeColor = defaultBadgeColor;

  @Input() guid!: string;
  @Input() contentSize!: DashboardItemContentSize | null;

  public instrumentsList: Array<AllInstruments> = [];
  public isLoading = false;

  public allColumns: ColumnsSettings[] = [
    {
      name: 'name',
      displayName: 'Тикер',
      width: '100px',
      sortFn: this.getSortFn('symbol'),
      filterData: {
        filterName: 'query',
        // isOpenedFilter: false,
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
    {name: 'lotSize', displayName: 'Лотность', width: '70px'},
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
    {name: 'priceMax', displayName: 'Макс. цена', width: '80px'},
    {name: 'priceMin', displayName: 'Мин. цена', width: '80px'},
    {name: 'priceScale', displayName: 'Шаг цены', width: '90px', sortFn: this.getSortFn('priceScale')},
    {name: 'yield', displayName: 'Доходность', width: '100px', sortFn: this.getSortFn('yield')},
  ];
  public displayedColumns: ColumnsSettings[] = [];
  public contextMenu: ContextMenu[] = [];

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: AllInstrumentsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly store: Store,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) { }

  ngOnInit(): void {
    this.getInstruments();
    this.initContextMenu();
    this.badgesChangeSubscribe();

    this.settingsService.getSettings<AllInstrumentsSettings>(this.guid)
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.displayedColumns = this.allColumns.filter(col => settings.allInstrumentsColumns.includes(col.name));
        this.badgeColor = settings.badgeColor!;
      });

    this.watchlistCollectionService.collectionChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initContextMenu();
      });
  }

  scrolled() {
    this.filters = {
      ...this.filters,
      offset: this.instrumentsList.length
    };
    this.getInstruments();
  }

  applyFilter(filters: any) {
    const allFilters = {
      ...this.filters,
      ...filters
    };

    this.filters = Object.keys(allFilters)
      .filter(key => !!allFilters[key])
      .reduce((acc, curr) => {
        if (Array.isArray(allFilters[curr])) {
          acc[curr] = allFilters[curr].join(';');
        } else {
          acc[curr] = allFilters[curr];
        }
        return acc;
      }, { offset: 0 } as any);
    this.getInstruments(true);
  }

  selectInstrument(row: AllInstruments) {
    const instrument = {
      symbol: row.name,
      exchange: row.exchange,
    };
    this.store.dispatch(selectNewInstrumentByBadge({instrument, badgeColor: this.badgeColor}));
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
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private getInstruments(isFiltersChanged = false) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.service.getAllInstruments(this.filters)
      .pipe(
        withLatestFrom(
          this.store.select(getSelectedInstrumentsWithBadges),
          this.terminalSettingsService.getSettings()
        )
      )
      .subscribe(([res, badges, settings]) => {
        const newDataWithBadges = res.map(instr => ({
          ...instr,
          badges: Object.keys(settings.badgesBind ? badges : {[defaultBadgeColor]: badges[defaultBadgeColor]})
            .filter(key => instr.name === badges[key].symbol  && instr.exchange === badges[key].exchange)
        }));
        if (isFiltersChanged) {
          this.instrumentsList = newDataWithBadges;
        } else {
          this.instrumentsList = [...this.instrumentsList, ...newDataWithBadges];
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      });

    if (this.instrumentsSub) {
      this.instrumentsSub.unsubscribe();
    }

    const filterForSub = JSON.parse(JSON.stringify(this.filters));
    filterForSub.limit += filterForSub.offset;
    filterForSub.offset = 0;

    this.instrumentsSub = interval(10_000)
      .pipe(
        switchMap(() => this.service.getAllInstruments(filterForSub)),
        withLatestFrom(
          this.store.select(getSelectedInstrumentsWithBadges),
          this.terminalSettingsService.getSettings()
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([res, badges, settings]) => {
        this.instrumentsList = res.map(instr => ({
          ...instr,
          badges: Object.keys(settings.badgesBind ? badges : {[defaultBadgeColor]: badges[defaultBadgeColor]})
            .filter(key => instr.name === badges[key].symbol  && instr.exchange === badges[key].exchange)
        }));
        this.cdr.markForCheck();
      });
  }

  private badgesChangeSubscribe() {
    this.store.select(getSelectedInstrumentsWithBadges)
      .pipe(
        mapWith(
          () => this.terminalSettingsService.getSettings(),
          (badges, settings) => ({badges, settings})),
        takeUntil(this.destroy$)
      )
      .subscribe(({badges, settings}) => {
        this.instrumentsList = this.instrumentsList.map(instr => ({
          ...instr,
          badges: Object.keys(settings.badgesBind ? badges : {[defaultBadgeColor]: badges[defaultBadgeColor]})
            .filter(key => instr.name === badges[key].symbol  && instr.exchange === badges[key].exchange)
        }));
        this.cdr.markForCheck();
      });
  }

  private getSortFn(orderBy: string): (dir: string | null) => void {
    return (dir: string | null) => {
      let filter = {};
      if (dir) {
        filter = {descending: dir === 'descend', orderBy};
      } else {
        delete this.filters.descending;
        delete this.filters.orderBy;
      }
      this.applyFilter(filter);
    };
  }

}
