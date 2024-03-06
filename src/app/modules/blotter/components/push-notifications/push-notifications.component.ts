import {
  Component,
  DestroyRef,
  OnInit,
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  Observable,
  shareReplay,
  take,
  tap
} from "rxjs";
import { filter, map, startWith, switchMap } from "rxjs/operators";
import {
  OrderExecuteSubscription,
  PriceSparkSubscription,
  PushSubscriptionType,
  SubscriptionBase
} from "../../../push-notifications/models/push-notifications.model";
import {
  allNotificationsColumns,
  TableNames
} from "../../models/blotter-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterService } from "../../services/blotter.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { isArrayEqual } from "../../../../shared/utils/collections";
import { PushNotificationsService } from "../../../push-notifications/services/push-notifications.service";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BlotterBaseTableComponent } from "../blotter-base-table/blotter-base-table.component";

interface NotificationFilter {
  id?: string;
  subscriptionType?: string[];
  instrument?: string;
}

type DisplayNotification = Partial<OrderExecuteSubscription> & Partial<PriceSparkSubscription> & { id: string };

@Component({
  selector: 'ats-push-notifications',
  templateUrl: './push-notifications.component.html',
  styleUrls: ['./push-notifications.component.less']
})
export class PushNotificationsComponent extends BlotterBaseTableComponent<DisplayNotification, NotificationFilter> implements OnInit {
  readonly subscriptionTypes = PushSubscriptionType;

  isNotificationsAllowed$!: Observable<boolean>;

  protected readonly allColumns: BaseColumnSettings<DisplayNotification>[] = [
    {
      id: 'id',
      displayName: 'Id',
      filterData: {
        filterName: 'id',
        isDefaultFilter: false
      }
    },
    {
      id: 'subscriptionType',
      displayName: 'subscriptionType',
      filterData: {
        filterName: 'subscriptionType',
        isDefaultFilter: true,
        filters: [
          {value: 'OrderExecute', text: 'OrderExecute'},
          {value: 'PriceSpark', text: 'PriceSpark'},
        ]
      }
    },
    {
      id: 'instrument',
      displayName: 'instrument',
      filterData: {
        filterName: 'instrument'
      }
    },
    {
      id: 'priceCondition',
      displayName: 'priceCondition',
    },
    {
      id: 'price',
      displayName: 'price',
      sortFn: (a, b): number => {
        return (a.price ?? -1) - (b.price ?? -1);
      }
    },
  ];

  settingsTableName = TableNames.NotificationsTable;

  constructor(
    protected readonly widgetSettingsService: WidgetSettingsService,
    protected readonly blotterService: BlotterService,
    private readonly pushNotificationsService: PushNotificationsService,
    protected readonly translatorService: TranslatorService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(widgetSettingsService, translatorService, destroyRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected initTableConfig(): void {
    this.tableConfig$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.notificationsTable, current.notificationsTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/notifications'),
        (s, t) => ({s, t})
      ),
      takeUntilDestroyed(this.destroyRef),
      map(({s, t}) => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(s.notificationsTable, allNotificationsColumns.filter(c => c.isDefault).map(c => c.id));

        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: t(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
              tooltip: t(['columns', column.column.id, 'tooltip'], {fallback: column.column.tooltip}),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: t(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: t(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text})
                  }))
                }
                : undefined,
              width: column.columnSettings!.columnWidth ?? this.defaultColumnWidth,
              order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
            }))
            .sort((a, b) => a.order - b.order)
        };
      })
    );
  }

  protected initTableData(): void {
    this.initNotificationStatusCheck();

    const currentPositions$ = this.settings$.pipe(
      switchMap(s => this.blotterService.getPositions(s)),
      map(p => p.map(p => ({
          symbol: p.symbol,
          exchange: p.exchange
        } as InstrumentKey))
      ),
      distinctUntilChanged((prev, cur) => isArrayEqual(
        prev,
        cur,
        (a, b) => a.symbol === b.symbol && a.exchange === b.exchange)
      )
    );

    const currentSubscriptions$ = combineLatest([
      this.pushNotificationsService.subscriptionsUpdated$.pipe(startWith({})),
      this.pushNotificationsService.getMessages().pipe(startWith({})),
      fromEvent(document, 'visibilitychange')
        .pipe(
          filter(() => document.visibilityState === 'visible'),
          startWith(null)
        )
    ]).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap(() => this.pushNotificationsService.getCurrentSubscriptions())
    );

    const displayNotifications$ = combineLatest([
      this.settings$,
      currentPositions$,
      currentSubscriptions$,
      this.filters$
    ]).pipe(
      map(([
             settings,
             positions,
             subscriptions,
             filter
           ]) => {

        const blotterSubscriptions = ((subscriptions as SubscriptionBase[] | null) ?? []).filter(s => {
          if (s.subscriptionType === PushSubscriptionType.OrderExecute) {
            const orderSubscription = <OrderExecuteSubscription>s;
            return orderSubscription.exchange === settings.exchange
              && orderSubscription.portfolio === settings.portfolio;
          }

          if ((s.subscriptionType as PushSubscriptionType) === PushSubscriptionType.PriceSpark) {
            const priceSparkSubscription = <PriceSparkSubscription>s;
            return !!positions.find(p => p.symbol === priceSparkSubscription.instrument && p.exchange === priceSparkSubscription.exchange);
          }

          return true;
        });

        return blotterSubscriptions.map(s => ({
            ...s,
            price: s.subscriptionType !== PushSubscriptionType.PriceSpark ? undefined : (<PriceSparkSubscription>s).price
          } as DisplayNotification)
        ).filter(s => this.justifyFilter(s, filter))
          .sort((a, b) =>  b.createdAt!.getTime() - a.createdAt!.getTime());
      }),
      tap(() => this.isLoading$.next(false))
    );

    this.tableData$ = this.isNotificationsAllowed$.pipe(
      filter(x => x),
      switchMap(() => displayNotifications$)
    );
  }

  rowClick(row: DisplayNotification): void {
    if (row.subscriptionType !== PushSubscriptionType.PriceSpark) {
      return;
    }

    super.rowClick(row);
  }

  rowToInstrumentKey(row: SubscriptionBase): InstrumentKey {
    const priceSparkSubscription = <PriceSparkSubscription>row;
    return {
      symbol: priceSparkSubscription.instrument,
      exchange: priceSparkSubscription.exchange
    };
  }

  cancelSubscription(id: string): void {
    this.isLoading$.next(true);
    this.pushNotificationsService.cancelSubscription(id).pipe(
      take(1)
    ).subscribe();
  }

  private initNotificationStatusCheck(): void {
    this.isNotificationsAllowed$ = this.pushNotificationsService.getBrowserNotificationsStatus().pipe(
      map(s => s === "granted"),
      shareReplay(1)
    );
  }
}
