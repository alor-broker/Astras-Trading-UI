import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
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

@Component({
  selector: 'ats-all-trades[guid]',
  templateUrl: './all-trades.component.html',
  styleUrls: ['./all-trades.component.less'],
})
export class AllTradesComponent implements OnInit, OnDestroy {
  @Input() guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private datePipe = new DatePipe('ru-RU');
  private take = 50;
  private isScrolled = false;
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

  public columns: ColumnsSettings[] = [
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

  constructor(
    private readonly allTradesService: AllTradesService,
    private readonly settingsService: WidgetSettingsService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<AllTradesSettings>(this.guid)
      .pipe(
        takeUntil(this.destroy$)
      );

    this.initTrades();

    this.settings$
      .subscribe(settings => {
      this.applyFilter({
        exchange: settings.exchange,
        symbol: settings.symbol,
        from: toUnixTimestampSeconds(startOfDay(new Date())),
        to: toUnixTimestampSeconds(new Date()),
        take: this.take
      });
    });

    this.resize
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.tableContainerHeight = data.height ?? 0;
        this.tableContainerWidth = data.width!;
        this.cdr.markForCheck();
      });
  }

  public scrolled(): void {
    if (this.isScrolled) {
      return;
    }

    this.tradesList$.pipe(
      take(1),
      withLatestFrom(this.isLoading$, this.filters$),
      filter(([, isLoading,]) => !isLoading),
      map(([tradesList, , currentFilters]) => ({ tradesList, currentFilters })),
    ).subscribe(s => {
      this.updateFilters(curr => ({
        ...curr,
        offset: s.tradesList.length
      }));
    });
  }

  applyFilter(filters: any) {
    this.isScrolled = false;

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
    this.tradesList$.unsubscribe();
    this.isLoading$.unsubscribe();
    this.filters$.unsubscribe();
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
      filter(() => !this.isScrolled),
      tap(() => this.isLoading$.next(true)),
      mapWith(
        f => this.allTradesService.getTradesList(f),
        (filters, res) => ({ filters, res })
      ),
      withLatestFrom(this.tradesList$),
      map(([s, currentList]) => {
        if (!s.res.length) {
          this.isScrolled = true;
        }
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
        ([, settings]) => this.allTradesService.getNewTrades(settings),
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
