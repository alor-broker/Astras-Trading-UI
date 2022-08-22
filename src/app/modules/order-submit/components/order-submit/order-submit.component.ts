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
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
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
import { CurrentPortfolioOrderService } from "../../../../shared/services/orders/current-portfolio-order.service";
import { SubmitOrderResult } from "../../../command/models/order.model";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { finalize } from "rxjs/operators";

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

  @ViewChild('formTabs', { static: false }) formTabs?: NzTabSetComponent;
  @ViewChild('limitTab', { static: false }) limitTab?: NzTabComponent;
  @ViewChild('marketTab', { static: false }) marketTab?: NzTabComponent;
  @ViewChild('stopTab', { static: false }) stopTab?: NzTabComponent;

  currentInstrument$!: Observable<Instrument>;

  readonly canSubmitOrder$ = new BehaviorSubject(false);
  readonly buyButtonLoading$ = new BehaviorSubject(false);
  readonly sellButtonLoading$ = new BehaviorSubject(false);


  private selectedOrderType: OrderType = OrderType.LimitOrder;
  private limitOrderFormValue: LimitOrderFormValue | null = null;
  private marketOrderFormValue: MarketOrderFormValue | null = null;
  private stopOrderFormValue: StopOrderFormValue | null = null;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentService: InstrumentsService,
    private readonly orderService: CurrentPortfolioOrderService
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

    this.currentInstrument$ = settings$.pipe(
      switchMap(settings => this.instrumentService.getInstrument(settings)),
      filter((i): i is Instrument => !!i),
      shareReplay(1)
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
    this.currentInstrument$.pipe(
      take(1)
    ).subscribe(instrument => {
      let order$: Observable<SubmitOrderResult> | null = null;
      switch (this.selectedOrderType) {
        case OrderType.LimitOrder:
          order$ = this.prepareLimitOrder(instrument, side);
          break;
        case OrderType.MarketOrder:
          order$ = this.prepareMarketOrder(instrument, side);
          break;
        case OrderType.StopOrder:
          order$ = this.prepareStopOrder(instrument, side);
          break;
      }

      if (!order$) {
        return;
      }

      this.canSubmitOrder$.next(false);
      if (side === Side.Buy) {
        this.buyButtonLoading$.next(true);
      } else {
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

  updateCanSubmitOrder() {
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

  ngOnDestroy(): void {
    this.canSubmitOrder$.complete();
    this.buyButtonLoading$.complete();
    this.sellButtonLoading$.complete();
  }

  private prepareLimitOrder(instrument: InstrumentKey, side: Side): Observable<SubmitOrderResult> | null {
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
      }
    );
  }

  private prepareMarketOrder(instrument: InstrumentKey, side: Side): Observable<SubmitOrderResult> | null {
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
      }
    );
  }

  private prepareStopOrder(instrument: InstrumentKey, side: Side): Observable<SubmitOrderResult> | null {
    if (!this.stopOrderFormValue) {
      return null;
    }

    if(!!this.stopOrderFormValue.price){
      return this.orderService.submitStopLimitOrder(
        {
          ...this.stopOrderFormValue,
          instrument: { ...instrument },
          side: side
        }
      );
    }

    return this.orderService.submitMarketOrder(
      {
        ...this.stopOrderFormValue,
        instrument: { ...instrument },
        side: side
      }
    );
  }

  private activateFormTab(targetTab?: NzTabComponent) {
    if (!targetTab || targetTab.position == null) {
      return;
    }

    this.formTabs?.setSelectedIndex(targetTab.position);
  }

}
