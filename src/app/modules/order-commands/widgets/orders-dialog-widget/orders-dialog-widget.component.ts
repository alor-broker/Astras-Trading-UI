import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, Observable, shareReplay, switchMap, take, tap } from "rxjs";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {isPortfoliosEqual} from "../../../../shared/utils/portfolios";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {NzTabComponent, NzTabSetComponent} from "ng-zorro-antd/tabs";
import {CommonParameters, CommonParametersService} from "../../services/common-parameters.service";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {OrderDialogParams, OrderFormType} from "../../../../shared/models/orders/orders-dialog.model";
import { HelpService } from "../../../../shared/services/help.service";

@Component({
  selector: 'ats-orders-dialog-widget',
  templateUrl: './orders-dialog-widget.component.html',
  styleUrls: ['./orders-dialog-widget.component.less'],
  providers: [CommonParametersService]
})
export class OrdersDialogWidgetComponent implements OnInit, OnDestroy {
  helpUrl$!: Observable<string | null>;
  dialogParams$!: Observable<OrderDialogParams | null>;

  currentPortfolio$!: Observable<PortfolioKey>;
  currentInstrument$!: Observable<Instrument>;

  commonParameters$ = this.commonParametersService.parameters$;
  tabSetHeight$ = new BehaviorSubject(300);

  @ViewChild('orderTabs', {static: false})
  orderTabs?: NzTabSetComponent;

  @ViewChild('limitOrderTab', {static: false})
  limitOrderTab?: NzTabComponent;

  @ViewChild('marketOrderTab', {static: false})
  marketOrderTab?: NzTabComponent;

  @ViewChild('stopOrderTab', {static: false})
  stopOrderTab?: NzTabComponent;

  constructor(
    private readonly ordersDialogService: OrdersDialogService,
    private readonly currentDashboardService: DashboardContextService,
    private readonly instrumentService: InstrumentsService,
    private readonly commonParametersService: CommonParametersService,
    private readonly helpService: HelpService
  ) {
  }

  ngOnInit(): void {
    this.dialogParams$ = this.ordersDialogService.newOrderDialogParameters$.pipe(
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

    this.helpUrl$ = this.helpService.getHelpLink('new-order');
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
      take(1)
    ).subscribe(params => {
      if (params.initialValues.orderType == null) {
        return;
      }

      switch (params.initialValues.orderType) {
        case OrderFormType.Limit:
          this.activateCommandTab(this.limitOrderTab);
          break;
        case OrderFormType.Market:
          this.activateCommandTab(this.marketOrderTab);
          break;
        case OrderFormType.Stop:
          this.activateCommandTab(this.stopOrderTab);
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

    this.orderTabs?.setSelectedIndex(targetTab.position);
  }
}
