import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil
} from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { OrderFilter } from '../../models/order-filter.model';
import { Column } from '../../models/column.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { BlotterService } from '../../services/blotter.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { StopOrder } from 'src/app/shared/models/orders/stop-order.model';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { NzTableComponent } from 'ng-zorro-antd/table';
import { ExportHelper } from "../../utils/export-helper";
import { isEqualBlotterSettings } from "../../../../shared/utils/settings-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { InstrumentBadges } from "../../../../shared/models/instruments/instrument.model";
import { Store } from "@ngrx/store";
import { getSelectedInstrumentsWithBadges } from "../../../../store/instruments/instruments.selectors";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";

interface DisplayOrder extends StopOrder {
  residue: string,
  volume: number
}

@Component({
  selector: 'ats-stop-orders[shouldShowSettings][guid]',
  templateUrl: './stop-orders.component.html',
  styleUrls: ['./stop-orders.component.less'],
})
export class StopOrdersComponent implements OnInit, OnDestroy {
  @ViewChild('nzTable')
  table?: NzTableComponent<DisplayOrder>;
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  displayOrders$: Observable<DisplayOrder[]> = of([]);
  searchFilter = new BehaviorSubject<OrderFilter>({});
  isFilterDisabled = () => Object.keys(this.searchFilter.getValue()).length === 0;

  tableInnerWidth: string = '1000px';
  allColumns: Column<DisplayOrder, OrderFilter>[] = [
    {
      id: 'id',
      name: 'Id',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(a.id) - Number(b.id),
      searchDescription: 'Поиск по Номеру',
      searchFn: (order, filter) => filter.id ? order.id.toLowerCase().includes(filter.id.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Идентификационный номер заявки'
    },
    {
      id: 'symbol',
      name: 'Тикер',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.symbol.localeCompare(b.symbol),
      searchDescription: 'Поиск по Тикеру',
      searchFn: (order, filter) => filter.symbol ? order.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Биржевой идентификатор ценной бумаги'
    },
    {
      id: 'side',
      name: 'Сторона',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.side.toString().localeCompare(b.side.toString()),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: StopOrder) => list.some(val => order.side.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: 'Покупка', value: 'buy' },
        { text: 'Продажа', value: 'sell' }
      ],
      isFilterVisible: false,
      hasFilter: true,
      tooltip: 'Сторона заявки (покупка/продажа)'
    },
    {
      id: 'residue',
      name: 'Остаток',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.filled - a.filled,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Отношение невыполненных заявок к общему количеству'
    },
    {
      id: 'volume',
      name: 'Объем',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.volume - a.volume,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Объем'
    },
    {
      id: 'qty',
      name: 'Кол-во',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.qty - a.qty,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество заявок'
    },
    {
      id: 'price',
      name: 'Цена',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.price - a.price,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Цена'
    },
    {
      id: 'triggerPrice',
      name: 'Сигн. цена',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.triggerPrice - a.triggerPrice,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Сигнальная цена (заявка выставится, когда цена упадёт/поднимется до указанного значения)'
    },
    {
      id: 'status',
      name: 'Статус',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.status.localeCompare(b.status),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: DisplayOrder) => list.some(val => order.status.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: 'Исполнена', value: 'filled' },
        { text: 'Активна', value: 'working' },
        { text: 'Отменена', value: 'canceled' }
      ],
      isFilterVisible: false,
      hasFilter: true,
      tooltip: 'Стаус заявки'
    },
    {
      id: 'conditionType',
      name: 'Условие',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.conditionType.localeCompare(b.conditionType),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: DisplayOrder) => list.some(val => order.conditionType.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: '>', value: 'More' },
        { text: '<', value: 'Less' }
      ],
      isFilterVisible: false,
      hasFilter: true,
      tooltip: 'Условие, при котором будет выставлена заявка'
    },
    {
      id: 'transTime',
      name: 'Время',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(b.transTime) - Number(a.transTime),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Время совершения заявки'
    },
    {
      id: 'exchange',
      name: 'Биржа',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.exchange.localeCompare(a.exchange),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: DisplayOrder) => list.some(val => order.exchange.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: 'ММВБ', value: 'MOEX' },
        { text: 'СПБ', value: 'SPBX' }
      ],
      isFilterVisible: false,
      hasFilter: true,
      tooltip: 'Наименование биржи'
    },
    {
      id: 'type',
      name: 'Тип',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.type.localeCompare(a.type),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: DisplayOrder) => list.some(val => order.type.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: 'Лимит', value: 'limit' },
        { text: 'Рыночн.', value: 'market' }
      ],
      isFilterVisible: false,
      hasFilter: true,
      tooltip: 'Тип заявки (лимитная/рыночная)'
    },
    {
      id: 'endTime',
      name: 'Действ. до.',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(b.endTime) - Number(a.endTime),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Срок действия заявки'
    },
  ];
  listOfColumns: Column<DisplayOrder, OrderFilter>[] = [];
  selectedInstruments$: Observable<InstrumentBadges> = of({});
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private cancelCommands = new Subject<CancelCommand>();
  private cancels$ = this.cancelCommands.asObservable();
  private orders: StopOrder[] = [];
  private settings$!: Observable<BlotterSettings>;
  private badgeColor = defaultBadgeColor;

  constructor(
    private readonly service: BlotterService,
    private readonly settingsService: WidgetSettingsService,
    private readonly canceller: OrderCancellerService,
    private readonly modal: ModalService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly store: Store,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualBlotterSettings(previous, current)),
      shareReplay()
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(s => {
      if (s.stopOrdersColumns) {
        this.listOfColumns = this.allColumns.filter(c => s.stopOrdersColumns.includes(c.id));
        this.tableInnerWidth = `${this.listOfColumns.length * 100}px`;
      }
      this.badgeColor = s.badgeColor!;
    });

    const orders$ = this.settings$.pipe(
      switchMap(settings => this.service.getStopOrders(settings)),
      tap(orders => this.orders = orders)
    );

    this.displayOrders$ = combineLatest([
      orders$,
      this.searchFilter,
      this.timezoneConverterService.getConverter()
    ]).pipe(
      map(([orders, f, converter]) => orders.slice(0, 10)
        .map(o => ({
          ...o,
          residue: `0/${o.qty}`,
          volume: MathHelper.round(o.qtyUnits * o.price, 2),
          transTime: converter.toTerminalDate(o.transTime),
          endTime: !!o.endTime ? converter.toTerminalDate(o.endTime) : o.endTime
        }))
        .filter(o => this.justifyFilter(o, f))
        .sort(this.sortOrders))
    );

    this.cancels$.pipe(
      mergeMap((command) => this.canceller.cancelOrder(command)),
      catchError((_, caught) => caught),
      takeUntil(this.destroy$)
    ).subscribe();

    this.selectedInstruments$ = combineLatest([
      this.store.select(getSelectedInstrumentsWithBadges),
      this.terminalSettingsService.getSettings()
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([badges, settings]) => {
          if (settings.badgesBind) {
            return badges;
          }
          return {[defaultBadgeColor]: badges[defaultBadgeColor]};
        })
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
      newFilter[option as keyof OrderFilter] = text;
      this.searchFilter.next(newFilter);
    }
  }

  getFilter(columnId: string) {
    return this.searchFilter.getValue()[columnId as keyof OrderFilter];
  }

  cancelOrder(orderId: string) {
    this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      take(1)
    ).subscribe(settings => {
      this.cancelCommands?.next({
        portfolio: settings.portfolio,
        exchange: settings.exchange,
        orderid: orderId,
        stop: true
      });
    });
  }

  editOrder(order: StopOrder) {
    this.modal.openEditModal({
      type: order.type,
      quantity: order.qty,
      orderId: order.id,
      price: order.price,
      instrument: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      user: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      side: order.side
    });
  }

  shouldShow(column: string) {
    return this.listOfColumns.map(c => c.id).includes(column);
  }

  cancelAllOrders() {
    const working = this.orders.filter(o => o.status == 'working').map(o => o.id);
    working.forEach(order => this.cancelOrder(order));
  }

  translateStatus(status: string) {
    switch (status) {
      case 'filled':
        return 'Исполн';
      case 'canceled':
        return 'Отменен';
      case 'working':
        return 'Активен';
      default:
        return status;
    }
  }

  formatDate(date: Date) {
    if (date.toDateString() == new Date().toDateString()) {
      return date.toLocaleTimeString();
    }
    else return date.toLocaleDateString();
  }

  selectInstrument(symbol: string, exchange: string) {
    this.service.selectNewInstrument(symbol, exchange, this.badgeColor);
  }

  isFilterApplied(column: Column<DisplayOrder, OrderFilter>) {
    const filter = this.searchFilter.getValue();
    return column.id in filter && filter[column.id] !== '';
  }

  get canExport(): boolean {
    return !!this.table?.data && this.table.data.length > 0;
  }

  exportToFile() {
    const valueTranslators = new Map<string, (value: any) => string>([
      ['status', value => this.translateStatus(value)],
      ['transTime', value => this.formatDate(value)],
      ['endTime', value => this.formatDate(value)],
    ]);

    this.settings$.pipe(take(1)).subscribe(settings => {
      ExportHelper.exportToCsv(
        'Стопы',
        settings,
        [...this.table?.data ?? []],
        this.listOfColumns,
        valueTranslators
      );
    });
  }

  private justifyFilter(order: DisplayOrder, filter: OrderFilter): boolean {
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof OrderFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        return column?.searchFn ? column.searchFn(order, filter) : false;
      }
    }
    return true;
  }

  private sortOrders(a: DisplayOrder, b: DisplayOrder) {
    if (a.status == 'working' && b.status != 'working') {
      return -1;
    }
    else if (b.status == 'working' && a.status != 'working') {
      return 1;
    }
    if (a.endTime < b.endTime) {
      return -1;
    }
    else if (a.endTime > b.endTime) {
      return 1;
    }
    return 0;
  }
}
