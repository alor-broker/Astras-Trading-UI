import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  NzTabComponent,
  NzTabSetComponent
} from "ng-zorro-antd/tabs";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  Subject,
  switchMap,
  take
} from "rxjs";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { OrderSubmitSettings } from "../../../../shared/models/settings/order-submit-settings.model";
import { isEqualOrderSubmitSettings } from "../../../../shared/utils/settings-helper";
import { OrderType } from '../../models/order-form.model';
import { LimitOrderFormValue } from "../order-forms/limit-order-form/limit-order-form.component";
import { MarketOrderFormValue } from "../order-forms/market-order-form/market-order-form.component";
import { StopOrderFormValue } from "../order-forms/stop-order-form/stop-order-form.component";
import { Side } from "../../../../shared/models/enums/side.model";
import { SubmitOrderResult } from "../../../command/models/order.model";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import {
  finalize,
  map
} from "rxjs/operators";
import { Store } from "@ngrx/store";
import { OrderService } from "../../../../shared/services/orders/order.service";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { getSelectedPortfolio } from "../../../../store/portfolios/portfolios.selectors";
import { QuotesService } from "../../../../shared/services/quotes.service";

@Component({
  selector: 'ats-order-submit[guid]',
  templateUrl: './order-submit.component.html',
  styleUrls: ['./order-submit.component.less'],
  providers: [QuotesService]
})
export class OrderSubmitComponent implements OnInit, OnDestroy {
  readonly orderSides = Side;
  readonly orderTypes = OrderType;

  @Input()
  guid!: string;

  @ViewChild('formTabs', { static: false }) formTabs?: NzTabSetComponent;
  @ViewChild('limitTab', { static: false }) limitTab?: NzTabComponent;
  @ViewChild('marketTab', { static: false }) marketTab?: NzTabComponent;
  @ViewChild('stopTab', { static: false }) stopTab?: NzTabComponent;

  currentInstrumentWithPortfolio$!: Observable<{ instrument: Instrument, portfolio: string }>;
  priceData$!: Observable<{ bid: number, ask: number }>;

  readonly canSubmitOrder$ = new BehaviorSubject(false);
  readonly buyButtonLoading$ = new BehaviorSubject(false);
  readonly sellButtonLoading$ = new BehaviorSubject(false);
  readonly initialValues$ = new Subject<Partial<LimitOrderFormValue & MarketOrderFormValue & StopOrderFormValue> | null>();


  private selectedOrderType: OrderType = OrderType.LimitOrder;
  private limitOrderFormValue: LimitOrderFormValue | null = null;
  private marketOrderFormValue: MarketOrderFormValue | null = null;
  private stopOrderFormValue: StopOrderFormValue | null = null;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentService: InstrumentsService,
    private readonly quotesService: QuotesService,
    private readonly orderService: OrderService,
    private readonly store: Store
  ) {
  }

  setSelectedCommandType(orderType: OrderType) {
    this.selectedOrderType = orderType;
    this.updateCanSubmitOrder();
  }

  ngOnInit(): void {
    const settings$ = this.settingsService.getSettings<OrderSubmitSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualOrderSubmitSettings(previous, current))
    );

    const currentPortfolio$ = this.store.select(getSelectedPortfolio).pipe(
      filter((p): p is PortfolioKey => !!p),
      map(p => p.portfolio),
    );

    const currentInstrument = settings$.pipe(
      switchMap(settings => this.instrumentService.getInstrument(settings)),
      filter((i): i is Instrument => !!i)
    );

    this.currentInstrumentWithPortfolio$ = combineLatest([currentPortfolio$, currentInstrument]).pipe(
      map(([portfolio, instrument]) => ({ instrument, portfolio }))
    );

    this.priceData$ = this.currentInstrumentWithPortfolio$.pipe(
      switchMap(value => this.quotesService.getQuotes(value.instrument.symbol, value.instrument.exchange, value.instrument.instrumentGroup, this.guid)),
      map(x => ({
        bid: x.bid,
        ask: x.ask
      }))
    );

    this.setSelectedCommandType(OrderType.LimitOrder);
    this.activateFormTab(this.limitTab);
  }

  setLimitOrderValue(value: LimitOrderFormValue | null) {
    this.limitOrderFormValue = value;
    this.updateCanSubmitOrder();
  }

  setMarketOrderValue(value: MarketOrderFormValue | null) {
    this.marketOrderFormValue = value;
    this.updateCanSubmitOrder();
  }

  setStopOrderValue(value: StopOrderFormValue | null) {
    this.stopOrderFormValue = value;
    this.updateCanSubmitOrder();
  }

  submitOrder(side: Side) {
    this.currentInstrumentWithPortfolio$.pipe(
      take(1)
    ).subscribe(({ instrument, portfolio }) => {
      let order$: Observable<SubmitOrderResult> | null = null;
      switch (this.selectedOrderType) {
        case OrderType.LimitOrder:
          order$ = this.prepareLimitOrder(instrument, portfolio, side);
          break;
        case OrderType.MarketOrder:
          order$ = this.prepareMarketOrder(instrument, portfolio, side);
          break;
        case OrderType.StopOrder:
          order$ = this.prepareStopOrder(instrument, portfolio, side);
          break;
      }

      if (!order$) {
        return;
      }

      this.canSubmitOrder$.next(false);
      if (side === Side.Buy) {
        this.buyButtonLoading$.next(true);
      }
      else {
        this.sellButtonLoading$.next(true);
      }

      order$.pipe(
        finalize(() => {
          this.buyButtonLoading$.next(false);
          this.sellButtonLoading$.next(false);
          this.updateCanSubmitOrder();
        }),
        take(1)
      ).subscribe();
    });
  }

  selectPrice(price: number) {
    this.initialValues$.next({ price: price });
  }

  ngOnDestroy(): void {
    this.canSubmitOrder$.complete();
    this.buyButtonLoading$.complete();
    this.sellButtonLoading$.complete();
  }

  private updateCanSubmitOrder() {
    let isValueSet = false;
    switch (this.selectedOrderType) {
      case OrderType.LimitOrder:
        isValueSet = this.limitOrderFormValue != null;
        break;
      case OrderType.MarketOrder:
        isValueSet = this.marketOrderFormValue != null;
        break;
      case OrderType.StopOrder:
        isValueSet = this.stopOrderFormValue != null;
        break;
    }

    this.canSubmitOrder$.next(isValueSet);
  }

  private prepareLimitOrder(instrument: InstrumentKey, portfolio: string, side: Side): Observable<SubmitOrderResult> | null {
    if (!this.limitOrderFormValue) {
      return null;
    }

    return this.orderService.submitLimitOrder(
      {
        ...this.limitOrderFormValue,
        instrument: {
          ...instrument,
          instrumentGroup: this.limitOrderFormValue.instrumentGroup ?? instrument.instrumentGroup
        },
        side: side
      },
      portfolio
    );
  }

  private prepareMarketOrder(instrument: InstrumentKey, portfolio: string, side: Side): Observable<SubmitOrderResult> | null {
    if (!this.marketOrderFormValue) {
      return null;
    }

    return this.orderService.submitMarketOrder(
      {
        ...this.marketOrderFormValue,
        instrument: {
          ...instrument,
          instrumentGroup: this.marketOrderFormValue.instrumentGroup ?? instrument.instrumentGroup
        },
        side: side
      },
      portfolio
    );
  }

  private prepareStopOrder(instrument: InstrumentKey, portfolio: string, side: Side): Observable<SubmitOrderResult> | null {
    if (!this.stopOrderFormValue) {
      return null;
    }

    if (this.stopOrderFormValue.withLimit) {
      return this.orderService.submitStopLimitOrder(
        {
          ...this.stopOrderFormValue,
          instrument: { ...instrument },
          side: side
        },
        portfolio
      );
    }

    return this.orderService.submitStopMarketOrder(
      {
        ...this.stopOrderFormValue,
        instrument: { ...instrument },
        side: side
      },
      portfolio
    );
  }

  private activateFormTab(targetTab?: NzTabComponent) {
    if (!targetTab || targetTab.position == null) {
      return;
    }

    this.formTabs?.setSelectedIndex(targetTab.position);
  }

}
