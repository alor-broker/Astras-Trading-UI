import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, takeUntil } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Trade } from 'src/app/shared/models/trades/trade.model';
import { Column } from '../../models/column.model';
import { TradeFilter } from '../../models/trade-filter.model';
import { BlotterService } from '../../services/blotter.service';

@Component({
  selector: 'ats-trades[guid]',
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.less']
})
export class TradesComponent implements OnInit, OnDestroy {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  tableInnerWidth = '1000px';
  displayTrades$: Observable<Trade[]> = of([]);
  searchFilter = new BehaviorSubject<TradeFilter>({});
  isFilterDisabled = () => Object.keys(this.searchFilter.getValue()).length === 0
  allColumns: Column<Trade, TradeFilter>[] = [
    {
      id: 'id',
      name: 'Id',
      sortOrder: null,
      sortFn: (a: Trade, b: Trade) => Number(a.id) - Number(b.id),
      searchDescription: 'Поиск по Номеру',
      searchFn: (trade, filter) => filter.id ? trade.id.toLowerCase().includes(filter.id.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'orderno',
      name: 'Заявка',
      sortOrder: null,
      sortFn: (a: Trade, b: Trade) => Number(a.orderno) - Number(b.orderno),
      searchDescription: 'Поиск по заявке',
      searchFn: (trade, filter) => filter.orderno ? trade.orderno.toLowerCase().includes(filter.orderno.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'symbol',
      name: 'Тикер',
      sortOrder: null,
      sortFn: (a: Trade, b: Trade) => a.symbol.localeCompare(b.symbol),
      searchDescription: 'Поиск по Тикеру',
      searchFn: (trade, filter) => filter.symbol ? trade.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'side',
      name: 'Сторона',
      sortOrder: null,
      sortFn: (a: Trade, b: Trade) => a.side.toString().localeCompare(b.side.toString()),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], trade: Trade) => list.some(val => trade.side.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: 'Покупка', value: 'buy' },
        { text: 'Продажа', value: 'sell' }
      ],
      isFilterVisible: false,
      hasFilter: true,
    },
    {
      id: 'qty',
      name: 'Кол-во',
      sortOrder: null,
      sortFn: (a: Trade, b: Trade) => Number(a.qty) - Number(b.qty),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'price',
      name: 'Цена',
      sortOrder: null,
      sortFn: (a: Trade, b: Trade) => Number(a.price) - Number(b.price),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'date',
      name: 'Время',
      sortOrder: null,
      sortFn: (a: Trade, b: Trade) => Number(a.date) - Number(b.date),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
  ];
  listOfColumns: Column<Trade, TradeFilter>[] = [];
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private trades: Trade[] = [];
  private trades$: Observable<Trade[]> = of([]);

  constructor(private service: BlotterService) {
  }

  ngOnInit(): void {
    this.service.getSettings(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(s => {
      if (s.ordersColumns) {
        this.listOfColumns = this.allColumns.filter(c => s.tradesColumns.includes(c.id));
        this.tableInnerWidth = `${this.listOfColumns.length * 100}px`;
      }
    });

    this.trades$ = this.service.getTrades(this.guid).pipe(
      tap(trades => this.trades = trades)
    );
    this.displayTrades$ = this.trades$.pipe(
      mergeMap(trades => this.searchFilter.pipe(
        map(f => trades.filter(t => this.justifyFilter(t, f)))
      )),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  reset(): void {
    this.searchFilter.next({});
  }

  filterChange(text: string, option: string) {
    const newFilter = this.searchFilter.getValue();
    if (option) {
      newFilter[option as keyof TradeFilter] = text;
      this.searchFilter.next(newFilter);
    }
  }

  getFilter(columnId: string) {
    return this.searchFilter.getValue()[columnId as keyof TradeFilter];
  }

  shouldShow(column: string) {
    return this.listOfColumns.map(c => c.id).includes(column);
  }

  formatDate(date: Date) {
    return new Date(date).toLocaleTimeString();
  }

  isFilterApplied(column: Column<Trade, TradeFilter>) {
    const filter = this.searchFilter.getValue();
    return column.id in filter && filter[column.id] !== ''
  }

  private justifyFilter(trade: Trade, filter: TradeFilter): boolean {
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof TradeFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        return column?.searchFn ? column.searchFn(trade, filter) : false;
      }
    }
    return true;
  }
}
