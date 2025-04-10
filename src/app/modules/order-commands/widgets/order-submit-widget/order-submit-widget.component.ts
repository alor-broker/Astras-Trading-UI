import {
  Component,
  DestroyRef,
  Inject,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  switchMap,
  withLatestFrom
} from 'rxjs';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { OrderSubmitSettings } from "../../models/order-submit-settings.model";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { isArrayEqual } from "../../../../shared/utils/collections";
import {
  CommonParameters,
  CommonParametersService
} from "../../services/common-parameters.service";
import { SelectedPriceData } from "../../../../shared/models/orders/selected-order-price.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WidgetsSharedDataService } from "../../../../shared/services/widgets-shared-data.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";
import { tap } from "rxjs/operators";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../../shared/services/orders/order-command.service";
import {
  PUSH_NOTIFICATIONS_CONFIG,
  PushNotificationsConfig
} from "../../../push-notifications/services/push-notifications-config";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";

@Component({
  selector: 'ats-order-submit-widget',
  templateUrl: './order-submit-widget.component.html',
  styleUrls: ['./order-submit-widget.component.less'],
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ]
})
export class OrderSubmitWidgetComponent implements OnInit {
  currentPortfolio$!: Observable<PortfolioKey>;
  currentInstrument$!: Observable<Instrument>;

  shouldShowSettings = false;

  @Input({ required: true })
  widgetInstance!: WidgetInstance;

  @Input({ required: true })
  isBlockWidget!: boolean;

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
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderSubmitSettings>(
      this.widgetInstance,
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
}
