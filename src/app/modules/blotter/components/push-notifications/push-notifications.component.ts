import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  Observable,
  of,
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
import { BaseTableComponent } from "../base-table/base-table.component";

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
export class PushNotificationsComponent extends BaseTableComponent<DisplayNotification, NotificationFilter> implements OnInit, AfterViewInit, OnDestroy {
  readonly subscriptionTypes = PushSubscriptionType;
  readonly isLoading$ = new BehaviorSubject(false);

  displayNotifications$: Observable<DisplayNotification[]> = of([]);

  isNotificationsAllowed$!: Observable<boolean>;

  private readonly allColumns: BaseColumnSettings<DisplayNotification>[] = [
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
    super(blotterService, widgetSettingsService, translatorService, destroyRef);
  }

  trackBy(index: number, notification: DisplayNotification): string {
    return notification.id!;
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.scrollHeight$.complete();
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.initColumns();
    this.initNotificationStatusCheck();
    this.initDisplayNotifications();
  }

  selectNotificationInstrument(notification: SubscriptionBase): void {
    if (notification.subscriptionType !== PushSubscriptionType.PriceSpark) {
      return;
    }

    const priceSparkSubscription = <PriceSparkSubscription>notification;

    super.selectInstrument(priceSparkSubscription.instrument, priceSparkSubscription.exchange);
  }

  cancelSubscription(id: string): void {
    this.isLoading$.next(true);
    this.pushNotificationsService.cancelSubscription(id).pipe(
      take(1)
    ).subscribe();
  }

  private initColumns(): void {
    this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.notificationsTable, current.notificationsTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/notifications'),
        (s, t) => ({s, t})
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({s, t}) => {
      const tableSettings = TableSettingHelper.toTableDisplaySettings(s.notificationsTable, allNotificationsColumns.filter(c => c.isDefault).map(c => c.id));

      if (tableSettings) {
        this.listOfColumns = this.allColumns
          .map(c => ({column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id)}))
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
            width: column.columnSettings!.columnWidth ?? this.columnDefaultWidth,
            order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
          }))
          .sort((a, b) => a.order - b.order);

        this.tableInnerWidth = this.listOfColumns.reduce((prev, cur) => prev + cur.width!, 0) + 70;
      }

      this.badgeColor = s.badgeColor!;
    });
  }

  private initDisplayNotifications(): void {
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
      this.filter$
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

    this.displayNotifications$ = this.isNotificationsAllowed$.pipe(
      filter(x => x),
      switchMap(() => displayNotifications$)
    );
  }

  private initNotificationStatusCheck(): void {
    this.isNotificationsAllowed$ = this.pushNotificationsService.getBrowserNotificationsStatus().pipe(
      map(s => s === "granted"),
      shareReplay(1)
    );
  }
}
