import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {OrdersDialogService} from "@terminal-core-lib/features/orders/services/orders-dialog.service";
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {InstrumentsService} from "@terminal-core-lib/features/instruments/services/instruments.service";
import {
  CommonParameters,
  CommonParametersService
} from "../../services/common-parameters.service";
import {HelpService} from "@terminal-core-lib/features/help-docs/services/help.service";
import {ORDER_COMMAND_SERVICE_TOKEN} from "@terminal-core-lib/features/orders/types/order-command-service.types";
import {PUSH_NOTIFICATIONS_CONFIG} from "@terminal-core-lib/features/push-notifications/types/push-notifications-config.types";
import {
  asyncScheduler,
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  observeOn,
  shareReplay,
  subscribeOn,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  OrderDialogParams,
  OrderFormType
} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';
import {PortfolioKey} from "@terminal-core-lib/common/types/portfolio.types";
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {PortfolioKeyEqualityComparer} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {filter} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {
  NzModalComponent,
  NzModalContentDirective
} from 'ng-zorro-antd/modal';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {InstrumentInfo} from '@terminal-widgets-lib/widgets/order-commands/components/instrument-info/instrument-info';
import {LimitOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/limit-order-form/limit-order-form';
import {MarketOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/market-order-form/market-order-form';
import {StopOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/stop-order-form/stop-order-form';
import {SetupInstrumentNotifications} from '@terminal-widgets-lib/widgets/order-commands/components/setup-instrument-notifications/setup-instrument-notifications';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  selector: 'ats-order-submit-dialog-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzModalComponent,
    NzResizeObserverDirective,
    InstrumentInfo,
    NzTabsComponent,
    NzTabComponent,
    NzModalContentDirective,
    LimitOrderForm,
    MarketOrderForm,
    StopOrderForm,
    SetupInstrumentNotifications,
    NzTypographyComponent,
    NzIconDirective,
    NzButtonComponent
  ],
  templateUrl: './order-submit-dialog-widget.html',
  styleUrl: './order-submit-dialog-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CommonParametersService
  ]
})
export class OrderSubmitDialogWidget implements OnInit, OnDestroy {
  readonly pushNotificationsConfig = inject(PUSH_NOTIFICATIONS_CONFIG);

  helpUrl$!: Observable<string | null>;

  dialogParams$!: Observable<OrderDialogParams | null>;

  currentPortfolio$!: Observable<PortfolioKey>;

  currentInstrument$!: Observable<Instrument>;

  tabSetHeight$ = new BehaviorSubject(300);

  readonly orderTabs = viewChild<NzTabsComponent>('orderTabs');

  readonly limitOrderTab = viewChild<NzTabComponent>('limitOrderTab');

  readonly marketOrderTab = viewChild<NzTabComponent>('marketOrderTab');

  readonly stopOrderTab = viewChild<NzTabComponent>('stopOrderTab');

  private readonly ordersDialogService = inject(OrdersDialogService);

  private readonly currentDashboardService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly instrumentService = inject(InstrumentsService);

  private readonly commonParametersService = inject(CommonParametersService);

  commonParameters$ = this.commonParametersService.parameters$;

  private readonly helpService = inject(HelpService);

  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  readonly ordersConfig = this.orderCommandService.getOrdersConfig();

  ngOnInit(): void {
    this.dialogParams$ = this.ordersDialogService.newOrderDialogParameters$.pipe(
      observeOn(asyncScheduler),
      tap(() => this.commonParametersService.reset()),
      shareReplay(1)
    );

    this.currentPortfolio$ = this.currentDashboardService.selectedPortfolio$.pipe(
      distinctUntilChanged((previous, current) => PortfolioKeyEqualityComparer.equals(previous, current)),
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
