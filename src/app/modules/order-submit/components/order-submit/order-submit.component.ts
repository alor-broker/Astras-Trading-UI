import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
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
  map,
  startWith
} from "rxjs/operators";
import { Store } from "@ngrx/store";
import { OrderService } from "../../../../shared/services/orders/order.service";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { getSelectedPortfolioKey } from "../../../../store/portfolios/portfolios.selectors";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { WidgetsDataProviderService } from "../../../../shared/services/widgets-data-provider.service";
import { SelectedPriceData } from "../../../../shared/models/orders/selected-order-price.model";
import { PositionsService } from "../../../../shared/services/positions.service";
import { Position } from "../../../../shared/models/positions/position.model";

@Component({
  selector: 'ats-order-submit[guid]',
  templateUrl: './order-submit.component.html',
  styleUrls: ['./order-submit.component.less']
})
export class OrderSubmitComponent implements OnInit, OnDestroy {
  readonly orderSides = Side;
  readonly orderTypes = OrderType;
  @Input()
  guid!: string;
  currentInstrumentWithPortfolio$!: Observable<{ instrument: Instrument, portfolio: string }>;
  priceData$!: Observable<{ bid: number, ask: number }>;
  readonly canSubmitOrder$ = new BehaviorSubject(false);
  readonly buyButtonLoading$ = new BehaviorSubject(false);
  readonly sellButtonLoading$ = new BehaviorSubject(false);
  readonly initialValues$ = new Subject<Partial<LimitOrderFormValue & MarketOrderFormValue & StopOrderFormValue> | null>();
  selectedTabIndex$!: Observable<number>;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private selectedOrderType: OrderType = OrderType.LimitOrder;
  private limitOrderFormValue: LimitOrderFormValue | null = null;
  private marketOrderFormValue: MarketOrderFormValue | null = null;
  private stopOrderFormValue: StopOrderFormValue | null = null;
  public positionInfo$!: Observable<{ abs: number, quantity: number }>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentService: InstrumentsService,
    private readonly quotesService: QuotesService,
    private readonly orderService: OrderService,
    private readonly store: Store,
    private readonly widgetsDataProvider: WidgetsDataProviderService,
    private readonly positionService: PositionsService,
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

    const currentPortfolio$ = this.store.select(getSelectedPortfolioKey).pipe(
      filter((p): p is PortfolioKey => !!p),
      map(p => p.portfolio),
    );

    const currentInstrument = settings$.pipe(
      switchMap(settings => this.instrumentService.getInstrument(settings)),
      filter((i): i is Instrument => !!i)
    );

    this.currentInstrumentWithPortfolio$ = combineLatest([currentPortfolio$, currentInstrument]).pipe(
      tap(() => {
        this.limitOrderFormValue = null;
        this.marketOrderFormValue = null;
        this.stopOrderFormValue = null;
      }),
      map(([portfolio, instrument]) => ({ instrument, portfolio })),
      shareReplay(1)
    );

    this.positionInfo$ = this.currentInstrumentWithPortfolio$.pipe(
      switchMap(data => this.positionService.getByPortfolio(data.portfolio, data.instrument.exchange, data.instrument.symbol)),
      filter((p): p is Position => !!p),
      map(p => ({
        abs: Math.abs(p.qtyTFutureBatch),
        quantity: p.qtyTFutureBatch
      })),
      startWith(({
        abs: 0,
        quantity: 0
      }))
    );

    this.priceData$ = this.currentInstrumentWithPortfolio$.pipe(
      switchMap(value => this.quotesService.getQuotes(value.instrument.symbol, value.instrument.exchange, value.instrument.instrumentGroup)),
      map(x => ({
        bid: x.bid,
        ask: x.ask
      }))
    );

    this.selectedTabIndex$ = this.currentInstrumentWithPortfolio$.pipe(
      tap(() => this.setSelectedCommandType(this.selectedOrderType)),
      map(() => this.getFormIndexByType(this.selectedOrderType))
    );

    this.widgetsDataProvider.getDataProvider<SelectedPriceData>('selectedPrice')
      ?.pipe(
        takeUntil(this.destroy$),
        withLatestFrom(settings$),
        filter(([priceData, settings]) => priceData.badgeColor === settings.badgeColor)
      )
      .subscribe(([priceData]) => this.selectPrice(priceData.price));
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
    this.initialValues$.next({ price });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

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

    setTimeout(() => this.canSubmitOrder$.next(isValueSet), 0);
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

  private getFormIndexByType(orderType: OrderType) {
    return [OrderType.LimitOrder, OrderType.MarketOrder, OrderType.StopOrder].indexOf(orderType);
  }

}
