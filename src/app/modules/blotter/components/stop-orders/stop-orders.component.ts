import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of, shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil
} from 'rxjs';
import {
  catchError,
  debounceTime,
  filter,
  map,
  mergeMap,
  startWith,
  tap
} from 'rxjs/operators';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { OrderFilter } from '../../models/order-filter.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { BlotterService } from '../../services/blotter.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { StopOrder } from 'src/app/shared/models/orders/stop-order.model';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NzTableComponent } from 'ng-zorro-antd/table';
import { ExportHelper } from "../../utils/export-helper";
import {
  isEqualPortfolioDependedSettings
} from "../../../../shared/utils/settings-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { TableAutoHeightBehavior } from '../../utils/table-auto-height.behavior';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { BlotterTablesHelper } from '../../utils/blotter-tables.helper';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { BlotterSettings } from '../../models/blotter-settings.model';
import { NzTableFilterList } from "ng-zorro-antd/table/src/table.types";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import {LessMore} from "../../../../shared/models/enums/less-more.model";
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";

interface DisplayOrder extends StopOrder {
  residue: string,
  volume: number
}

@Component({
  selector: 'ats-stop-orders[shouldShowSettings][guid]',
  templateUrl: './stop-orders.component.html',
  styleUrls: ['./stop-orders.component.less'],
})
export class StopOrdersComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly columnDefaultWidth = 100;

  @ViewChild('nzTable')
  table?: NzTableComponent<DisplayOrder>;

  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;

  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  isModalOpened$?: Observable<boolean>;
  displayOrders$: Observable<DisplayOrder[]> = of([]);
  filter = new BehaviorSubject<OrderFilter>({});
  isFilterDisabled = () => Object.keys(this.filter.getValue()).length === 0;


  tableInnerWidth: number = 1000;
  allColumns: BaseColumnSettings<DisplayOrder>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(a.id) - Number(b.id),
      filterData: {
        filterName: 'id',
        isDefaultFilter: false
      },
      tooltip: 'Идентификационный номер заявки'
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.symbol.localeCompare(b.symbol),
      filterData: {
        filterName: 'id',
        isDefaultFilter: false
      },
      tooltip: 'Биржевой идентификатор ценной бумаги',
      minWidth: 75
    },
    {
      id: 'side',
      displayName: 'Сторона',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.side.toString().localeCompare(b.side.toString()),
      filterData: {
        filterName: 'side',
        isDefaultFilter: true,
        filters: [
          { text: 'Покупка', value: 'buy' },
          { text: 'Продажа', value: 'sell' }
        ]
      },
      tooltip: 'Сторона заявки (покупка/продажа)',
      minWidth: 85
    },
    {
      id: 'residue',
      displayName: 'Остаток',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.filled - a.filled,
      tooltip: 'Отношение невыполненных заявок к общему количеству',
      minWidth: 70
    },
    {
      id: 'volume',
      displayName: 'Объем',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.volume - a.volume,
      tooltip: 'Объем',
      minWidth: 60
    },
    {
      id: 'qty',
      displayName: 'Кол-во',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.qty - a.qty,
      tooltip: 'Количество заявок',
      minWidth: 65
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.price - a.price,
      tooltip: 'Цена',
      minWidth: 55
    },
    {
      id: 'triggerPrice',
      displayName: 'Сигн. цена',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.triggerPrice - a.triggerPrice,
      tooltip: 'Сигнальная цена (заявка выставится, когда цена упадёт/поднимется до указанного значения)',
    },
    {
      id: 'status',
      displayName: 'Статус',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.status.localeCompare(b.status),
      filterData: {
        filterName: 'status',
        isDefaultFilter: true,
        filters: [
          { text: 'Исполнена', value: 'filled' },
          { text: 'Активна', value: 'working' },
          { text: 'Отменена', value: 'canceled' }
        ]
      },
      tooltip: 'Стаус заявки',
      minWidth: 80
    },
    {
      id: 'conditionType',
      displayName: 'Условие',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.conditionType.localeCompare(b.conditionType),
      filterData: {
        filterName: 'conditionType',
        isDefaultFilter: true,
        filters: [
          { text: '>', value: 'more' },
          { text: '<', value: 'less' }
        ]
      },
      tooltip: 'Условие, при котором будет выставлена заявка',
      minWidth: 85
    },
    {
      id: 'transTime',
      displayName: 'Время',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(b.transTime) - Number(a.transTime),
      tooltip: 'Время совершения заявки',
      minWidth: 60
    },
    {
      id: 'exchange',
      displayName: 'Биржа',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.exchange.localeCompare(a.exchange),
      filterData: {
        filterName: 'exchange',
        isDefaultFilter: true,
        filters: [
          { text: 'ММВБ', value: 'MOEX' },
          { text: 'СПБ', value: 'SPBX' }
        ]
      },
      tooltip: 'Наименование биржи',
      minWidth: 80
    },
    {
      id: 'type',
      displayName: 'Тип',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.type.localeCompare(a.type),
      filterData: {
        filterName: 'exchange',
        isDefaultFilter: true,
        filters: [
          { text: 'Лимит', value: 'stoplimit' },
          { text: 'Рыночн.', value: 'stop' }
        ]
      },
      tooltip: 'Тип заявки (лимитная/рыночная)',
      minWidth: 65
    },
    {
      id: 'endTime',
      displayName: 'Действ. до.',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(b.endTime) - Number(a.endTime),
      tooltip: 'Срок действия заявки',
      minWidth: 65
    },
  ];
  listOfColumns: BaseColumnSettings<DisplayOrder>[] = [];
  settings$!: Observable<BlotterSettings>;
  readonly scrollHeight$ = new BehaviorSubject<number>(100);

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private cancelCommands = new Subject<CancelCommand>();
  private cancels$ = this.cancelCommands.asObservable();
  private orders: StopOrder[] = [];
  private badgeColor = defaultBadgeColor;

  constructor(
    private readonly service: BlotterService,
    private readonly settingsService: WidgetSettingsService,
    private readonly canceller: OrderCancellerService,
    private readonly modal: ModalService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly translatorService: TranslatorService,
    private readonly ordersGroupService: OrdersGroupService
  ) {
  }

  ngAfterViewInit(): void {
    const container$ =  this.tableContainer.changes.pipe(
      map(x => x.first),
      startWith(this.tableContainer.first),
      filter((x): x is ElementRef<HTMLElement> => !!x),
      shareReplay(1)
    );

    container$.pipe(
      switchMap(x => TableAutoHeightBehavior.getScrollHeight(x)),
      takeUntil(this.destroy$)
    ).subscribe(x => {
      setTimeout(()=> this.scrollHeight$.next(x));
    });
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid);

    this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous?.positionsTable, current.positionsTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/stop-orders'),
        (s, t) => ({ s, t })
      ),
      takeUntil(this.destroy$)
    ).subscribe(({ s, t }) => {
      const tableSettings = s.stopOrdersTable ?? TableSettingHelper.toTableDisplaySettings(s.stopOrdersColumns);

      if (tableSettings) {
        this.listOfColumns = this.allColumns
          .map(c => ({column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id)}))
          .filter(c => !!c.columnSettings)
          .map((column, index) => ({
            ...column.column,
            displayName: t(['columns', column.column.id, 'name'], { fallback: column.column.displayName }),
            tooltip: t(['columns', column.column.id, 'tooltip'], { fallback: column.column.tooltip }),
            filterData: column.column.filterData
              ? {
                ...column.column.filterData,
                filterName: t(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                filters: (<NzTableFilterList>column.column.filterData?.filters ?? []).map(f => ({
                  value: f.value,
                  text: t(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text})
                }))
              }
              : undefined,
            width: column.columnSettings!.columnWidth ?? this.columnDefaultWidth,
            order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
          }))
          .sort((a, b) => a.order - b.order);

        this.tableInnerWidth = this.listOfColumns.reduce((prev, cur) =>prev + cur.width! , 0) + 70;
      }
      this.badgeColor = s.badgeColor!;
    });

    const orders$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getStopOrders(settings)),
      debounceTime(100),
      startWith([]),
      tap(orders => this.orders = orders)
    );

    this.displayOrders$ = combineLatest([
      orders$,
      this.filter,
      this.timezoneConverterService.getConverter(),
      this.ordersGroupService.getAllOrderGroups()
    ]).pipe(
      map(([orders, f, converter, groups]) => orders
        .map(o => ({
          ...o,
          residue: `0/${o.qty}`,
          volume: MathHelper.round(o.qtyUnits * o.price, 2),
          transTime: converter.toTerminalDate(o.transTime),
          endTime: !!o.endTime ? converter.toTerminalDate(o.endTime) : o.endTime,
          groupId: groups.find(g => !!g.orders.find(go => go.orderId === o.id))?.id
        }))
        .filter(o => this.justifyFilter(o, f))
        .sort(this.sortOrders))
    );

    this.cancels$.pipe(
      mergeMap((command) => this.canceller.cancelOrder(command)),
      catchError((_, caught) => caught),
      takeUntil(this.destroy$)
    ).subscribe();

    this.isModalOpened$ = this.service.shouldShowOrderGroupModal$;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.scrollHeight$.complete();
  }

  reset(): void {
    this.filter.next({});
  }

  filterChange(newFilter: OrderFilter) {
    this.filter.next({
      ...this.filter.getValue(),
      ...newFilter
    });
  }

  defaultFilterChange(key: string, value: string[]) {
    this.filterChange({ [key]: value });
  }

  cancelOrder(orderId: string) {
    this.settings$.pipe(
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

  editOrder(order: StopOrder, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

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
      side: order.side,
      triggerPrice: order.triggerPrice,
      stopEndUnixTime: order.endTime,
      condition: order.conditionType === 'less' ? LessMore.Less : LessMore.More,
      timeInForce: order.timeInForce,
      icebergFixed: order.icebergFixed,
      icebergVariance: order.icebergVariance
    });
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

  isFilterApplied(column: BaseColumnSettings<DisplayOrder>) {
    const filter = this.filter.getValue();
    return column.id in filter && !!filter[column.id];
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

  saveColumnWidth(id: string, width: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = settings.stopOrdersTable ?? TableSettingHelper.toTableDisplaySettings(settings.stopOrdersColumns);
      if (tableSettings) {
        this.settingsService.updateSettings<BlotterSettings>(
          settings.guid,
          {
            stopOrdersTable: TableSettingHelper.updateColumn(
              id,
              tableSettings,
              {
                columnWidth: width
              }
            )
          }
        );
      }
    });
  }

  recalculateTableWidth(widthChange: { columnWidth: number, delta: number | null }) {
    const delta = widthChange.delta ?? widthChange.columnWidth - this.columnDefaultWidth;
    this.tableInnerWidth += delta;
  }

  changeColumnOrder(event: CdkDragDrop<any>) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.settingsService.updateSettings<BlotterSettings>(
        settings.guid,
        {
          stopOrdersTable: BlotterTablesHelper.changeColumnOrder(
            event,
            settings.stopOrdersTable ?? TableSettingHelper.toTableDisplaySettings(settings.stopOrdersColumns)!,
            this.listOfColumns
          )
        }
      );
    });
  }

  openOrdersGroup(groupId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.service.openOrderGroupModal(groupId);
  }

  trackBy(index: number, order: DisplayOrder): string {
    return order.id;
  }

  private justifyFilter(order: DisplayOrder, filter: OrderFilter): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof OrderFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        if (
          !column!.filterData!.isDefaultFilter && !this.searchInOrder(order, <keyof DisplayOrder>key, <string>filter[key]) ||
          column!.filterData!.isDefaultFilter && filter[key]?.length  && !filter[key]?.includes(order[<keyof DisplayOrder>key]!.toString())
        ) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }

  private searchInOrder(order: DisplayOrder, key: keyof DisplayOrder, value?: string): boolean {
    if (!value) {
      return true;
    }
    return order[key]!.toString().toLowerCase().includes(value.toLowerCase());
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
