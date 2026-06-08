import {ComponentFixture, TestBed} from '@angular/core/testing';
import {LimitOrderForm} from './limit-order-form';
import {OrderType, TimeInForce} from '@terminal-core-lib/features/orders/types/orders.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {Reason} from '@terminal-core-lib/features/orders/types/new-order.types';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {ExecutionPolicy} from '@terminal-core-lib/features/orders/types/order-group.types';
import {of} from 'rxjs';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {PortfolioFixtures} from '@testing-lib/fixtures/portfolio';
import {
  ConfirmableOrderCommandsServiceMock,
  ConfirmableOrderCommandsServiceMockFactory
} from '@testing-lib/angular/confirmable-order-commands-service.mock';
import {CommonParametersService} from '@terminal-widgets-lib/widgets/order-commands/services/common-parameters.service';
import {PortfolioSubscriptionsServiceMockFactory} from '@testing-lib/angular/portfolio-subscriptions-service.mock';
import {MarketServiceMockFactory} from '@testing-lib/angular/market-service.mock';
import {TimezoneConverterServiceMockFactory} from '@testing-lib/angular/timezone-converter-service.mock';

const instrument = InstrumentFixtures.createInstrument();
const portfolioKey = PortfolioFixtures.createPortfolioKey();

describe('LimitOrderForm', () => {
  let orderCommandServiceMock: ConfirmableOrderCommandsServiceMock;

  beforeEach(() => {
    const orderCommandServiceMockResult = ConfirmableOrderCommandsServiceMockFactory.create();

    orderCommandServiceMock = orderCommandServiceMockResult.service;

    TestBed.overrideComponent(LimitOrderForm, {
      set: {
        template: ''
      }
    });

    TestBed.configureTestingModule({
      imports: [LimitOrderForm],
      providers: [
        orderCommandServiceMockResult.provider,
        CommonParametersService,
        PortfolioSubscriptionsServiceMockFactory.create().provider,
        MarketServiceMockFactory.create(portfolioKey.exchange).provider,
        TimezoneConverterServiceMockFactory.create().provider
      ]
    });
  });

  function createComponent(isBracketsSupported = true): ComponentFixture<LimitOrderForm> {
    const fixture = TestBed.createComponent(LimitOrderForm);

    fixture.componentRef.setInput('portfolioKey', portfolioKey);
    fixture.componentRef.setInput('instrument', instrument);
    fixture.componentRef.setInput('activated', true);
    fixture.componentRef.setInput('limitOrderConfig', {
      isBracketsSupported,
      unsupportedFields: {}
    });
    fixture.detectChanges();

    return fixture;
  }

  it('should submit a single limit order with optional fields', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    component.form.controls.quantity.setValue(5);
    component.form.controls.price.setValue(201.25);
    component.form.controls.timeInForce.setValue(TimeInForce.FillOrKill);
    component.form.controls.isIceberg.setValue(true);
    component.form.controls.icebergFixed.setValue(2);
    component.form.controls.icebergVariance.setValue(1);
    component.form.controls.reason.setValue(Reason.Voice);

    component.submitOrder(Side.Buy);

    expect(orderCommandServiceMock.submitLimitOrder).toHaveBeenCalledWith(
      {
        instrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          instrumentGroup: instrument.instrumentGroup
        },
        price: 201.25,
        quantity: 5,
        side: Side.Buy,
        timeInForce: TimeInForce.FillOrKill,
        icebergFixed: 2,
        icebergVariance: 1,
        reason: Reason.Voice
      },
      portfolioKey
    );
    expect(orderCommandServiceMock.submitOrdersGroup).not.toHaveBeenCalled();
    expect(submittedSpy).toHaveBeenCalledOnce();
  });

  it('should not submit or emit submitted when the form is invalid', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    component.form.controls.price.setValue(null);

    component.submitOrder(Side.Buy);

    expect(orderCommandServiceMock.submitLimitOrder).not.toHaveBeenCalled();
    expect(orderCommandServiceMock.submitOrdersGroup).not.toHaveBeenCalled();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should not emit submitted when the order command fails', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    orderCommandServiceMock.submitLimitOrder.mockReturnValue(of({
      isSuccess: false,
      message: 'failed'
    }));
    component.form.controls.price.setValue(100);

    component.submitOrder(Side.Buy);

    expect(orderCommandServiceMock.submitLimitOrder).toHaveBeenCalledOnce();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should submit bracket orders as a linked orders group', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.quantity.setValue(2);
    component.form.controls.price.setValue(100);
    component.form.controls.topOrderPrice.setValue(120);
    component.form.controls.topOrderSide.setValue(Side.Sell);
    component.form.controls.bottomOrderPrice.setValue(90);
    component.form.controls.bottomOrderSide.setValue(Side.Sell);

    component.submitOrder(Side.Buy);

    expect(orderCommandServiceMock.submitOrdersGroup).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          type: OrderType.Limit,
          price: 100,
          quantity: 2,
          side: Side.Buy
        }),
        expect.objectContaining({
          type: OrderType.StopMarket,
          triggerPrice: 120,
          condition: Condition.MoreOrEqual,
          side: Side.Sell,
          activate: false
        }),
        expect.objectContaining({
          type: OrderType.StopMarket,
          triggerPrice: 90,
          condition: Condition.LessOrEqual,
          side: Side.Sell,
          activate: false
        })
      ],
      portfolioKey,
      ExecutionPolicy.TriggerBracketOrders
    );
    expect(orderCommandServiceMock.submitLimitOrder).not.toHaveBeenCalled();
  });

  it('should disable bracket controls when brackets are not supported', () => {
    const fixture = createComponent(false);
    const component = fixture.componentInstance;

    expect(component.form.controls.topOrderPrice.disabled).toBe(true);
    expect(component.form.controls.topOrderSide.disabled).toBe(true);
    expect(component.form.controls.bottomOrderPrice.disabled).toBe(true);
    expect(component.form.controls.bottomOrderSide.disabled).toBe(true);
  });
});
