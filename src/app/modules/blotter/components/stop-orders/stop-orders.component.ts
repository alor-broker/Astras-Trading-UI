import {
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import {
  catchError,
  debounceTime,
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
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  isEqualPortfolioDependedSettings
} from "../../../../shared/utils/settings-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { ColumnsNames, TableNames } from '../../models/blotter-settings.model';
import { NzTableFilterList } from "ng-zorro-antd/table/src/table.types";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";
import { DomHelper } from "../../../../shared/utils/dom-helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BaseTableComponent } from "../base-table/base-table.component";
import {StopOrder} from "../../../../shared/models/orders/order.model";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {OrderType} from "../../../../shared/models/orders/orders-dialog.model";

interface DisplayOrder extends StopOrder {
  residue: string,
  volume: number
}

@Component({
  selector: 'ats-stop-orders',
  templateUrl: './stop-orders.component.html',
  styleUrls: ['./stop-orders.component.less'],
})
export class StopOrdersComponent extends BaseTableComponent<DisplayOrder, OrderFilter> implements OnInit {
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  isModalOpened = DomHelper.isModalOpen;
  displayOrders$: Observable<DisplayOrder[]> = of([]);

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
          { text: 'Отменена', value: 'canceled' },
          { text: 'Отложена', value: 'rejected' }
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

  private cancelCommands = new Subject<CancelCommand>();
  private cancels$ = this.cancelCommands.asObservable();
  private orders: StopOrder[] = [];

  settingsTableName = TableNames.StopOrdersTable;
  settingsColumnsName = ColumnsNames.StopOrdersColumns;
  fileSuffix = 'stopOrders';
  badgeColor = defaultBadgeColor;

  constructor(
    protected readonly service: BlotterService,
    protected readonly settingsService: WidgetSettingsService,
    private readonly canceller: OrderCancellerService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly timezoneConverterService: TimezoneConverterService,
    protected readonly translatorService: TranslatorService,
    private readonly ordersGroupService: OrdersGroupService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(service, settingsService, translatorService, destroyRef);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous?.positionsTable, current.positionsTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => combineLatest([
          this.translatorService.getTranslator('blotter/stop-orders'),
          this.translatorService.getTranslator('blotter/blotter-common')
        ]),
        (s, [tStopOrders, tCommon]) => ({ s, tStopOrders, tCommon })
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ s, tStopOrders, tCommon }) => {
      const tableSettings = s.stopOrdersTable ?? TableSettingHelper.toTableDisplaySettings(s.stopOrdersColumns);

      if (tableSettings) {
        this.listOfColumns = this.allColumns
          .map(c => ({column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id)}))
          .filter(c => !!c.columnSettings)
          .map((column, index) => ({
            ...column.column,
            displayName: tStopOrders(['columns', column.column.id, 'name'], { fallback: column.column.displayName }),
            tooltip: tStopOrders(['columns', column.column.id, 'tooltip'], { fallback: column.column.tooltip }),
            filterData: column.column.filterData
              ? {
                ...column.column.filterData,
                filterName: tStopOrders(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                filters: (<NzTableFilterList>column.column.filterData?.filters ?? []).map(f => ({
                  value: f.value,
                  text: tCommon([column.column.id + 'Filters', f.value], {fallback: f.text})
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
      this.filter$,
      this.timezoneConverterService.getConverter(),
      this.ordersGroupService.getAllOrderGroups()
    ]).pipe(
      map(([orders, f, converter, groups]) => orders
        .map(o => ({
          ...o,
          residue: `${o.filled ?? 0}/${o.qty}`,
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
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
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

    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.ordersDialogService.openEditOrderDialog({
        instrumentKey: {
          symbol: order.symbol,
          exchange: order.exchange
        },
        portfolioKey: {
          portfolio: s.portfolio,
          exchange: s.exchange
        },
        orderId: order.id,
        orderType: OrderType.Stop,
        initialValues: {}
      });
    });
  }

  cancelAllOrders() {
    const working = this.orders.filter(o => o.status == 'working').map(o => o.id);
    working.forEach(order => this.cancelOrder(order));
  }

  openOrdersGroup(groupId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.service.openOrderGroupModal(groupId);
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
