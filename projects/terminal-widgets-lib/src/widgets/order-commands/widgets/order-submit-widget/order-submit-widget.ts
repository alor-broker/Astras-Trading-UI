import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  viewChild,
  viewChildren,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {OrderSubmitWidgetSettings} from '@terminal-widgets-lib/widgets/order-commands/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {
  asyncScheduler,
  distinctUntilChanged,
  Observable,
  shareReplay,
  subscribeOn,
  switchMap,
  take,
  tap,
  withLatestFrom
} from 'rxjs';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {
  takeUntilDestroyed,
  toObservable
} from '@angular/core/rxjs-interop';
import {
  CommonParameters,
  CommonParametersService
} from '@terminal-widgets-lib/widgets/order-commands/services/common-parameters.service';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {PUSH_NOTIFICATIONS_CONFIG} from '@terminal-core-lib/features/push-notifications/types/push-notifications-config.types';
import {EventsBusService} from '@terminal-core-lib/common/services/events-bus.service';
import {PortfolioKeyEqualityComparer} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {ArrayHelper} from '@terminal-core-lib/common/utils/array.helper';
import {
  filter,
  map
} from 'rxjs/operators';
import {
  SelectedPriceData,
  SelectedPriceEventKey
} from '@terminal-core-lib/features/orders/types/selected-price-event.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WidgetHeaderInstrumentSwitch} from '@terminal-widgets-lib/common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {CompactHeader} from '@terminal-widgets-lib/widgets/order-commands/components/compact-header/compact-header';
import {WorkingVolumes} from '@terminal-widgets-lib/widgets/order-commands/components/working-volumes/working-volumes';
import {LimitOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/limit-order-form/limit-order-form';
import {LimitOrderPriceChange} from '@terminal-widgets-lib/widgets/order-commands/components/limit-order-price-change/limit-order-price-change';
import {MarketOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/market-order-form/market-order-form';
import {StopOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/stop-order-form/stop-order-form';
import {OrderSubmitSettings} from '@terminal-widgets-lib/widgets/order-commands/components/order-submit-settings/order-submit-settings';
import {SetupInstrumentNotifications} from '@terminal-widgets-lib/widgets/order-commands/components/setup-instrument-notifications/setup-instrument-notifications';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-order-submit-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    CompactHeader,
    NzTabsComponent,
    NzTabComponent,
    WorkingVolumes,
    LimitOrderForm,
    LimitOrderPriceChange,
    MarketOrderForm,
    StopOrderForm,
    OrderSubmitSettings,
    SetupInstrumentNotifications,
    NzIconDirective
  ],
  templateUrl: './order-submit-widget.html',
  styleUrl: './order-submit-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CommonParametersService
  ],
})
export class OrderSubmitWidget extends WidgetBase<OrderSubmitWidgetSettings> implements AfterViewInit {
  readonly pushNotificationsConfig = inject(PUSH_NOTIFICATIONS_CONFIG);

  readonly orderTabs = viewChildren<NzTabsComponent>('orderTabs');

  readonly limitOrderTab = viewChild<NzTabComponent>('limitOrderTab');

  readonly marketOrderTab = viewChild<NzTabComponent>('marketOrderTab');

  readonly stopOrderTab = viewChild<NzTabComponent>('stopOrderTab');

  protected currentPortfolio$!: Observable<PortfolioKey>;

  protected currentInstrument$!: Observable<Instrument>;

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly commonParametersService = inject(CommonParametersService);

  private readonly eventsBusService = inject(EventsBusService);

  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  readonly ordersConfig = this.orderCommandService.getOrdersConfig();

  private readonly instrumentService = inject(InstrumentsService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly orderTabsChanges$ = toObservable(this.orderTabs);

  override ngOnInit(): void {
    super.ngOnInit();

    this.currentPortfolio$ = this.dashboardContextService.selectedPortfolio$.pipe(
      distinctUntilChanged((previous, current) => PortfolioKeyEqualityComparer.equals(previous, current)),
      shareReplay(1)
    );

    this.currentInstrument$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => this.isEqualOrderSubmitSettings(previous, current)),
      switchMap(settings => this.instrumentService.getInstrument(settings)),
      filter((i): i is Instrument => !!i),
      tap(() => this.commonParametersService.reset()),
      shareReplay(1)
    );

    this.currentInstrument$.pipe(
      take(1)
    ).subscribe(() => {
      this.eventsBusService.subscribe(event => event.key === SelectedPriceEventKey, {replayLast: true}).pipe(
        map(event => event.payload as SelectedPriceData),
        withLatestFrom(this.settings$),
        filter(([priceData,]) => priceData != null),
        filter(([priceData, settings]) => priceData!.badgeColor === settings.badgeColor),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(([priceData,]) => {
        this.setCommonParameters({
          price: priceData!.price
        });
      });
    });
  }

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }

  ngAfterViewInit(): void {
    this.setDefaultOrderType();
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderSubmitWidgetSettings>(
      this.widgetInstance(),
      'OrderSubmitSettings',
      settings => ({
        ...settings,
        enableLimitOrdersFastEditing: ValueHelper.getValueOrDefault(settings.enableLimitOrdersFastEditing, false),
        limitOrderPriceMoveSteps: ValueHelper.getValueOrDefault(settings.limitOrderPriceMoveSteps, [1, 2, 5, 10]),
        showVolumePanel: ValueHelper.getValueOrDefault(settings.showVolumePanel, false),
        workingVolumes: ValueHelper.getValueOrDefault(settings.workingVolumes, [1, 5, 10, 20, 30, 40, 50, 100, 200])
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }

  private setDefaultOrderType(): void {
    this.orderTabsChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
      filter(t => t != null),
      take(1)
    ).subscribe(t => {
      this.settings$.pipe(
        take(1),
        subscribeOn(asyncScheduler)
      ).subscribe(s => {
        if (s.defaultOrderType != null) {
          switch (s.defaultOrderType) {
            case 'limit':
              this.activateCommandTab(t, this.limitOrderTab());
              break;
            case 'market':
              this.activateCommandTab(t, this.marketOrderTab());
              break;
            case "stop":
              this.activateCommandTab(t, this.stopOrderTab());
              break;
          }
        }
      });
    });
  }

  private isEqualOrderSubmitSettings(
    settings1?: OrderSubmitWidgetSettings,
    settings2?: OrderSubmitWidgetSettings
  ): boolean {
    if (settings1 && settings2) {
      return (
        settings1.linkToActive == settings2.linkToActive &&
        settings1.guid == settings2.guid &&
        settings1.symbol == settings2.symbol &&
        settings1.exchange == settings2.exchange &&
        settings1.enableLimitOrdersFastEditing == settings2.enableLimitOrdersFastEditing &&
        ArrayHelper.isArrayEqual(settings1.limitOrderPriceMoveSteps, settings2.limitOrderPriceMoveSteps, (a, b) => a === b) &&
        settings1.showVolumePanel == settings2.showVolumePanel &&
        ArrayHelper.isArrayEqual(settings1.workingVolumes, settings2.workingVolumes, (a, b) => a === b)
      );
    } else return false;
  }

  private activateCommandTab(tabsSet: NzTabsComponent, targetTab?: NzTabComponent): void {
    if (!targetTab || targetTab.position == null) {
      return;
    }

    tabsSet.setSelectedIndex(targetTab.position);
  }
}
