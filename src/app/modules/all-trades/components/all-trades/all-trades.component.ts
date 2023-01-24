import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AllTradesService } from "../../services/all-trades.service";
import { ColumnsSettings } from "../../../../shared/models/columns-settings.model";
import { DatePipe } from "@angular/common";
import { startOfDay, toUnixTimestampSeconds } from "../../../../shared/utils/datetime";
import { AllTradesSettings } from "../../../../shared/models/settings/all-trades-settings.model";
import { filter, map, tap } from "rxjs/operators";
import {
  BehaviorSubject,
  Observable,
  Subject,
  take,
  takeUntil,
  withLatestFrom
} from "rxjs";
import { AllTradesFilters, AllTradesItem } from "../../models/all-trades.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';

@Component({
  selector: 'ats-all-trades[guid]',
  templateUrl: './all-trades.component.html',
  styleUrls: ['./all-trades.component.less'],
})
export class AllTradesComponent implements OnInit, OnDestroy {
  @Input() guid!: string;

  contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private datePipe = new DatePipe('ru-RU');
  private take = 50;
  private settings$!: Observable<AllTradesSettings>;

  public tableContainerHeight: number = 0;
  public tableContainerWidth: number = 0;
  public tradesList$ = new BehaviorSubject<AllTradesItem[]>([]);
  public isLoading$ = new BehaviorSubject<boolean>(false);
  private filters$ = new BehaviorSubject<AllTradesFilters>({
    take: this.take,
    exchange: '',
    symbol: '',
    to: 0,
    from: 0,
    descending: true
  });

  public allColumns: ColumnsSettings[] = [
    {
      name: 'qty',
      displayName: 'Кол-во',
      classFn: data => data.side,
      sortFn: this.getSortFn('qty'),
      filterData: {
        filterName: 'qty',
        intervalStartName: 'qtyFrom',
        intervalEndName: 'qtyTo',
        isInterval: true
      }
    },
    {
      name: 'price',
      displayName: 'Цена',
      sortFn: this.getSortFn('price'),
      filterData: {
        filterName: 'price',
        intervalStartName: 'priceFrom',
        intervalEndName: 'priceTo',
        isInterval: true
      }
    },
    {name: 'timestamp', displayName: 'Время', transformFn: (data: AllTradesItem) => this.datePipe.transform(data.timestamp, 'HH:mm:ss')},
    {
      name: 'side',
      displayName: 'Сторона',
      classFn: data => data.side,
      sortFn: this.getSortFn('side'),
      filterData: {
        filterName: 'side',
        isDefaultFilter: true,
        filters: [
          { text: 'Продажа', value: 'sell' },
          { text: 'Покупка', value: 'buy' }
        ]
      }
    },
    {name: 'oi', displayName: 'Откр. интерес'},
    {name: 'existing', displayName: 'Новое событие', transformFn: (data: AllTradesItem) => data.existing ? 'Да' : 'Нет'},
  ];
  public displayedColumns: ColumnsSettings[] = [];

  constructor(
    private readonly allTradesService: AllTradesService,
    private readonly settingsService: WidgetSettingsService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<AllTradesSettings>(this.guid)
      .pipe(
        takeUntil(this.destroy$)
      );

    this.initTrades();

    this.settings$
      .pipe(
        mapWith(
          () => this.translatorService.getTranslator('all-trades/all-trades'),
          (settings, translate) => ({ settings, translate })
        ),
      )
      .subscribe(({ settings, translate }) => {
        this.displayedColumns = this.allColumns
          .filter(col => settings.allTradesColumns.includes(col.name))
          .map(col => ({
              ...col,
              displayName: translate(
                ['columns', col.name],
                { fallback: col.displayName }
              )
            })
          );

        this.applyFilter({
        exchange: settings.exchange,
        symbol: settings.symbol,
        from: toUnixTimestampSeconds(startOfDay(new Date())),
        to: toUnixTimestampSeconds(new Date()),
        take: this.take
      });
    });
  }

  public scrolled(): void {
    this.tradesList$.pipe(
      take(1),
      withLatestFrom(this.isLoading$, this.filters$),
      filter(([, isLoading,]) => !isLoading),
      map(([tradesList, , currentFilters]) => ({ tradesList, currentFilters })),
    ).subscribe(s => {
      const loadedIndex = s.currentFilters.take! + s.currentFilters.offset!;
      if (s.tradesList.length < loadedIndex) {
        return;
      }

      this.updateFilters(curr => ({
        ...curr,
        offset: s.tradesList.length
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
        descending: cleanedFilters.orderBy ? cleanedFilters.descending || false : true,
        to: toUnixTimestampSeconds(new Date()),
        offset: 0
      };
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.tradesList$.complete();
    this.isLoading$.complete();
    this.filters$.complete();
    this.contentSize$.complete();
  }

  containerSizeChanged(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  private updateFilters(update: (curr: AllTradesFilters) => AllTradesFilters) {
    this.filters$.pipe(
      take(1)
    ).subscribe(curr => {
      this.filters$.next(update(curr));
    });
  }

  private initTrades() {
    this.filters$.pipe(
      tap(() => this.isLoading$.next(true)),
      mapWith(
        f => this.allTradesService.getTradesList(f),
        (filters, res) => ({ filters, res })
      ),
      withLatestFrom(this.tradesList$),
      map(([s, currentList]) => {
        if ((s.filters.offset || 0) > 0) {
          this.tradesList$.next([...currentList, ...s.res]);
        } else {
          this.tradesList$.next(s.res);
        }

        return s.filters;
      }),
      tap(() => this.isLoading$.next(false)),
      withLatestFrom(this.settings$),
      mapWith(
        ([, settings]) => this.allTradesService.getNewTradesSubscription(settings),
        (data, res) => ({filters: data[0], res})
      ),
      takeUntil(this.destroy$),
    ).subscribe(data => {
      this.filterNewTrade(data);
    });
  }

  private filterNewTrade({filters, res}: { filters: AllTradesFilters, res: AllTradesItem }) {
    if (
      filters.qtyFrom && res.qty < filters.qtyFrom ||
      filters.qtyTo && res.qty > filters.qtyTo ||
      filters.priceFrom && res.price < filters.priceFrom ||
      filters.priceTo && res.price > filters.priceTo ||
      filters.side && res.side !== filters.side
    ) {
      return;
    }

    const tradesListCopy = JSON.parse(JSON.stringify(this.tradesList$.getValue()));
    let indexForPaste: number;

    switch (filters.orderBy) {
      case 'side':
        indexForPaste = tradesListCopy.findIndex((item: AllTradesItem) => item.side === res.side);
        break;
      case 'price':
        indexForPaste = tradesListCopy.findIndex((item: AllTradesItem) => filters.descending ? item.price <= res.price : item.price >= res.price);
        break;
      case 'qty':
        indexForPaste = tradesListCopy.findIndex((item: AllTradesItem) => filters.descending ? item.qty <= res.qty : item.qty >= res.qty);
        break;
      default:
        indexForPaste = 0;
    }

    if (indexForPaste !== -1) {
      tradesListCopy.splice(indexForPaste, 0, res);
      this.tradesList$.next(tradesListCopy);
    }
  }

  private getSortFn(orderBy: string): (dir: string | null) => void {
    return (dir: string | null) => {
      this.updateFilters(curr => {
        const filter = {
          ...curr,
          to: toUnixTimestampSeconds(new Date()),
          offset: 0
        };

        delete filter.descending;
        delete filter.orderBy;

        if (dir) {
          filter.descending = dir === 'descend';
          filter.orderBy = orderBy;
        } else {
          filter.descending = true;
        }

        return filter;
      });
    };
  }
}
