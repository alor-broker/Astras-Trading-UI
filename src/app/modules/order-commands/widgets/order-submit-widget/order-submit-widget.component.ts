import {
  AfterViewInit,
  Component,
  DestroyRef,
  Inject,
  input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {
  asyncScheduler,
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  subscribeOn,
  switchMap,
  take,
  withLatestFrom
} from 'rxjs';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {OrderSubmitSettings} from "../../models/order-submit-settings.model";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {isPortfoliosEqual} from "../../../../shared/utils/portfolios";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {isArrayEqual} from "../../../../shared/utils/collections";
import {CommonParameters, CommonParametersService} from "../../services/common-parameters.service";
import {SelectedPriceData} from "../../../../shared/models/orders/selected-order-price.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {WidgetsSharedDataService} from "../../../../shared/services/widgets-shared-data.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {map, startWith, tap} from "rxjs/operators";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../../shared/services/orders/order-command.service";
import {
  PUSH_NOTIFICATIONS_CONFIG,
  PushNotificationsConfig
} from "../../../push-notifications/services/push-notifications-config";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";
import {NzTabComponent, NzTabsComponent,} from "ng-zorro-antd/tabs";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {
  WidgetHeaderInstrumentSwitchComponent
} from '../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import {CompactHeaderComponent} from '../../components/compact-header/compact-header.component';
import {WorkingVolumesComponent} from '../../components/working-volumes/working-volumes.component';
import {LimitOrderFormComponent} from '../../components/order-forms/limit-order-form/limit-order-form.component';
import {
  LimitOrderPriceChangeComponent
} from '../../components/limit-order-price-change/limit-order-price-change.component';
import {MarketOrderFormComponent} from '../../components/order-forms/market-order-form/market-order-form.component';
import {StopOrderFormComponent} from '../../components/order-forms/stop-order-form/stop-order-form.component';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  SetupInstrumentNotificationsComponent
} from '../../../push-notifications/components/setup-instrument-notifications/setup-instrument-notifications.component';
import {OrderSubmitSettingsComponent} from '../../components/order-submit-settings/order-submit-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-order-submit-widget',
  templateUrl: './order-submit-widget.component.html',
  styleUrls: ['./order-submit-widget.component.less'],
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    WidgetHeaderInstrumentSwitchComponent,
    CompactHeaderComponent,
    NzTabsComponent,
    NzTabComponent,
    WorkingVolumesComponent,
    LimitOrderFormComponent,
    LimitOrderPriceChangeComponent,
    MarketOrderFormComponent,
    StopOrderFormComponent,
    NzIconDirective,
    SetupInstrumentNotificationsComponent,
    OrderSubmitSettingsComponent,
    AsyncPipe
  ]
})
export class OrderSubmitWidgetComponent implements OnInit, AfterViewInit {
  currentPortfolio$!: Observable<PortfolioKey>;
  currentInstrument$!: Observable<Instrument>;

  shouldShowSettings = false;

  @ViewChildren('orderTabs')
  orderTabs?: QueryList<NzTabsComponent>;

  @ViewChild('limitOrderTab', {static: false})
  limitOrderTab?: NzTabComponent;

  @ViewChild('marketOrderTab', {static: false})
  marketOrderTab?: NzTabComponent;

  @ViewChild('stopOrderTab', {static: false})
  stopOrderTab?: NzTabComponent;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<OrderSubmitSettings>;
  showBadge$!: Observable<boolean>;
  readonly ordersConfig = this.orderCommandService.getOrdersConfig();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly instrumentService: InstrumentsService,
    private readonly commonParametersService: CommonParametersService,
    private readonly widgetsSharedDataService: WidgetsSharedDataService,
    @Inject(ORDER_COMMAND_SERVICE_TOKEN)
    private readonly orderCommandService: OrderCommandService,
    @Inject(PUSH_NOTIFICATIONS_CONFIG)
    readonly pushNotificationsConfig: PushNotificationsConfig,
    private readonly destroyRef: DestroyRef
  ) {
  }

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngAfterViewInit(): void {
    this.setDefaultOrderType();
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;

    if (!this.shouldShowSettings) {
      this.setDefaultOrderType();
    }
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderSubmitSettings>(
      this.widgetInstance(),
      'OrderSubmitSettings',
      settings => ({
        ...settings,
        enableLimitOrdersFastEditing: getValueOrDefault(settings.enableLimitOrdersFastEditing, false),
        limitOrderPriceMoveSteps: getValueOrDefault(settings.limitOrderPriceMoveSteps, [1, 2, 5, 10]),
        showVolumePanel: getValueOrDefault(settings.showVolumePanel, false),
        workingVolumes: getValueOrDefault(settings.workingVolumes, [1, 5, 10, 20, 30, 40, 50, 100, 200])
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<OrderSubmitSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.currentPortfolio$ = this.dashboardContextService.selectedPortfolio$.pipe(
      distinctUntilChanged((previous, current) => isPortfoliosEqual(previous, current)),
      shareReplay(1)
    );

    this.currentInstrument$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => this.isEqualOrderSubmitSettings(previous, current)),
      switchMap(settings => this.instrumentService.getInstrument(settings)),
      filter((i): i is Instrument => !!i),
      tap(() => this.commonParametersService.reset()),
      shareReplay(1)
    );

    this.widgetsSharedDataService.getDataProvideValues<SelectedPriceData>('selectedPrice').pipe(
      withLatestFrom(this.settings$),
      filter(([priceData, settings]) => priceData.badgeColor === settings.badgeColor),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([priceData,]) => this.setCommonParameters({
      price: priceData.price
    }));
  }

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }

  private isEqualOrderSubmitSettings(
    settings1?: OrderSubmitSettings,
    settings2?: OrderSubmitSettings
  ): boolean {
    if (settings1 && settings2) {
      return (
        settings1.linkToActive == settings2.linkToActive &&
        settings1.guid == settings2.guid &&
        settings1.symbol == settings2.symbol &&
        settings1.exchange == settings2.exchange &&
        settings1.enableLimitOrdersFastEditing == settings2.enableLimitOrdersFastEditing &&
        isArrayEqual(settings1.limitOrderPriceMoveSteps, settings2.limitOrderPriceMoveSteps, (a, b) => a === b) &&
        settings1.showVolumePanel == settings2.showVolumePanel &&
        isArrayEqual(settings1.workingVolumes, settings2.workingVolumes, (a, b) => a === b)
      );
    } else return false;
  }

  private setDefaultOrderType(): void {
    this.orderTabs?.changes.pipe(
      map(x => x.first as NzTabsComponent | undefined),
      startWith(this.orderTabs?.first),
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
              this.activateCommandTab(t, this.limitOrderTab);
              break;
            case 'market':
              this.activateCommandTab(t, this.marketOrderTab);
              break;
            case "stop":
              this.activateCommandTab(t, this.stopOrderTab);
              break;
          }
        }
      });
    });
  }

  private activateCommandTab(tabsSet: NzTabsComponent, targetTab?: NzTabComponent): void {
    if (!targetTab || targetTab.position == null) {
      return;
    }

    tabsSet.setSelectedIndex(targetTab.position);
  }
}
