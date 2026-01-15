import { Component, OnDestroy, OnInit, viewChild, inject } from '@angular/core';
import {
  asyncScheduler,
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  Observable,
  observeOn,
  shareReplay,
  subscribeOn,
  switchMap,
  take,
  tap
} from "rxjs";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {isPortfoliosEqual} from "../../../../shared/utils/portfolios";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {NzTabComponent, NzTabsComponent} from "ng-zorro-antd/tabs";
import {CommonParameters, CommonParametersService} from "../../services/common-parameters.service";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {OrderDialogParams, OrderFormType} from "../../../../shared/models/orders/orders-dialog.model";
import {HelpService} from "../../../../shared/services/help.service";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../../shared/services/orders/order-command.service";
import {
  PUSH_NOTIFICATIONS_CONFIG,
  PushNotificationsConfig
} from "../../../push-notifications/services/push-notifications-config";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzModalComponent, NzModalContentDirective} from 'ng-zorro-antd/modal';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {InstrumentInfoComponent} from '../../components/instrument-info/instrument-info.component';
import {LimitOrderFormComponent} from '../../components/order-forms/limit-order-form/limit-order-form.component';
import {MarketOrderFormComponent} from '../../components/order-forms/market-order-form/market-order-form.component';
import {StopOrderFormComponent} from '../../components/order-forms/stop-order-form/stop-order-form.component';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  SetupInstrumentNotificationsComponent
} from '../../../push-notifications/components/setup-instrument-notifications/setup-instrument-notifications.component';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-orders-dialog-widget',
  templateUrl: './orders-dialog-widget.component.html',
  styleUrls: ['./orders-dialog-widget.component.less'],
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ],
  imports: [
    TranslocoDirective,
    NzModalComponent,
    NzModalContentDirective,
    NzResizeObserverDirective,
    InstrumentInfoComponent,
    NzTabsComponent,
    NzTabComponent,
    LimitOrderFormComponent,
    MarketOrderFormComponent,
    StopOrderFormComponent,
    NzIconDirective,
    SetupInstrumentNotificationsComponent,
    NzTypographyComponent,
    NzButtonComponent,
    AsyncPipe
  ]
})
export class OrdersDialogWidgetComponent implements OnInit, OnDestroy {
  private readonly ordersDialogService = inject(OrdersDialogService);
  private readonly currentDashboardService = inject(DashboardContextService);
  private readonly instrumentService = inject(InstrumentsService);
  private readonly commonParametersService = inject(CommonParametersService);
  private readonly helpService = inject(HelpService);
  private readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);
  readonly pushNotificationsConfig = inject<PushNotificationsConfig>(PUSH_NOTIFICATIONS_CONFIG);

  helpUrl$!: Observable<string | null>;
  dialogParams$!: Observable<OrderDialogParams | null>;

  currentPortfolio$!: Observable<PortfolioKey>;
  currentInstrument$!: Observable<Instrument>;

  commonParameters$ = this.commonParametersService.parameters$;
  tabSetHeight$ = new BehaviorSubject(300);

  readonly orderTabs = viewChild<NzTabsComponent>('orderTabs');

  readonly limitOrderTab = viewChild<NzTabComponent>('limitOrderTab');

  readonly marketOrderTab = viewChild<NzTabComponent>('marketOrderTab');

  readonly stopOrderTab = viewChild<NzTabComponent>('stopOrderTab');

  readonly ordersConfig = this.orderCommandService.getOrdersConfig();

  ngOnInit(): void {
    this.dialogParams$ = this.ordersDialogService.newOrderDialogParameters$.pipe(
      observeOn(asyncScheduler),
      tap(() => this.commonParametersService.reset()),
      shareReplay(1)
    );

    this.currentPortfolio$ = this.currentDashboardService.selectedPortfolio$.pipe(
      distinctUntilChanged((previous, current) => isPortfoliosEqual(previous, current)),
      shareReplay(1)
    );

    this.currentInstrument$ = this.dialogParams$.pipe(
      filter((p): p is OrderDialogParams => !!p),
      switchMap(params => this.instrumentService.getInstrument(params.instrumentKey)),
      filter((i): i is Instrument => !!i),
      shareReplay(1)
    );

    this.helpUrl$ = this.helpService.getSectionHelp('new-order');
  }

  ngOnDestroy(): void {
    this.tabSetHeight$.complete();
  }

  closeDialog(): void {
    this.ordersDialogService.closeNewOrderDialog();
  }

  setInitialTab(): void {
    this.dialogParams$.pipe(
      filter((p): p is OrderDialogParams => !!p),
      take(1),
      subscribeOn(asyncScheduler)
    ).subscribe(params => {
      if (params.initialValues.orderType == null) {
        return;
      }

      switch (params.initialValues.orderType) {
        case OrderFormType.Limit:
          this.activateCommandTab(this.limitOrderTab());
          break;
        case OrderFormType.Market:
          this.activateCommandTab(this.marketOrderTab());
          break;
        case OrderFormType.Stop:
          this.activateCommandTab(this.stopOrderTab());
          break;
        default:
          throw new Error(`Unknown order type ${params.initialValues.orderType}`);
      }
    });
  }

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }

  calculateTabSetHeight(event: ResizeObserverEntry[]): void {
    const modalContentEl = event[0]?.target as Element | undefined;

    if (!modalContentEl) {
      return;
    }

    const containerHeight = window.innerHeight * 0.7 -
      parseFloat(window.getComputedStyle(modalContentEl.parentElement!).paddingTop) -
      parseFloat(window.getComputedStyle(modalContentEl.parentElement!).paddingBottom);

    const instrumentInfoEl = modalContentEl.querySelector('.instrument-info');
    this.tabSetHeight$.next(containerHeight - instrumentInfoEl!.clientHeight);
  }

  private activateCommandTab(targetTab?: NzTabComponent): void {
    if (!targetTab || targetTab.position == null) {
      return;
    }

    this.orderTabs()?.setSelectedIndex(targetTab.position);
  }
}
