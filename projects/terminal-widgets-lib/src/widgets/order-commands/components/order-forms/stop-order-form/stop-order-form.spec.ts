import {ComponentFixture, TestBed} from '@angular/core/testing';
import {StopOrderForm} from './stop-order-form';
import {OrderType, TimeInForce} from '@terminal-core-lib/features/orders/types/orders.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
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
import {QuotesServiceMockFactory} from '@testing-lib/angular/quotes-service.mock';
import {TimezoneConverterServiceMockFactory} from '@testing-lib/angular/timezone-converter-service.mock';

const instrument = InstrumentFixtures.createInstrument();
const portfolioKey = PortfolioFixtures.createPortfolioKey();

describe('StopOrderForm', () => {
  let orderCommandServiceMock: ConfirmableOrderCommandsServiceMock;

  beforeEach(() => {
    const orderCommandServiceMockResult = ConfirmableOrderCommandsServiceMockFactory.create();

    orderCommandServiceMock = orderCommandServiceMockResult.service;

    TestBed.overrideComponent(StopOrderForm, {
      set: {
        template: ''
      }
    });

    TestBed.configureTestingModule({
      imports: [StopOrderForm],
      providers: [
        orderCommandServiceMockResult.provider,
        CommonParametersService,
        PortfolioSubscriptionsServiceMockFactory.create().provider,
        QuotesServiceMockFactory.create().provider,
        TimezoneConverterServiceMockFactory.create().provider
      ]
    });
  });

  function createComponent(): ComponentFixture<StopOrderForm> {
    const fixture = TestBed.createComponent(StopOrderForm);

    fixture.componentRef.setInput('portfolioKey', portfolioKey);
    fixture.componentRef.setInput('instrument', instrument);
    fixture.componentRef.setInput('activated', true);
    fixture.detectChanges();

    return fixture;
  }

  it('should submit a stop market order when limit mode is disabled', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    component.form.controls.quantity.setValue(4);
    component.form.controls.triggerPrice.setValue(99.5);
    component.form.controls.condition.setValue(Condition.Less);

    component.submitOrder(Side.Sell);

    expect(orderCommandServiceMock.submitStopMarketOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        instrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          instrumentGroup: instrument.instrumentGroup
        },
        quantity: 4,
        triggerPrice: 99.5,
        condition: Condition.Less,
        side: Side.Sell
      }),
      portfolioKey
    );
    expect(orderCommandServiceMock.submitStopLimitOrder).not.toHaveBeenCalled();
    expect(submittedSpy).toHaveBeenCalledOnce();
  });

  it('should not submit or emit submitted when the form is invalid', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    component.form.controls.quantity.setValue(1);
    component.form.controls.triggerPrice.setValue(null);
    component.form.controls.condition.setValue(Condition.Less);

    component.submitOrder(Side.Sell);

    expect(orderCommandServiceMock.submitStopMarketOrder).not.toHaveBeenCalled();
    expect(orderCommandServiceMock.submitStopLimitOrder).not.toHaveBeenCalled();
    expect(orderCommandServiceMock.submitOrdersGroup).not.toHaveBeenCalled();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should not emit submitted when the order command fails', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    orderCommandServiceMock.submitStopMarketOrder.mockReturnValue(of({
      isSuccess: false,
      message: 'failed'
    }));
    component.form.controls.quantity.setValue(4);
    component.form.controls.triggerPrice.setValue(99.5);
    component.form.controls.condition.setValue(Condition.Less);

    component.submitOrder(Side.Sell);

    expect(orderCommandServiceMock.submitStopMarketOrder).toHaveBeenCalledOnce();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should submit a stop limit order with iceberg fields when limit mode is enabled', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.quantity.setValue(6);
    component.form.controls.triggerPrice.setValue(101);
    component.form.controls.condition.setValue(Condition.More);
    component.form.controls.withLimit.setValue(true);
    component.form.controls.price.setValue(101.5);
    component.form.controls.timeInForce.setValue(TimeInForce.GoodTillCancelled);
    component.form.controls.isIceberg.setValue(true);
    component.form.controls.icebergFixed.setValue(3);
    component.form.controls.icebergVariance.setValue(1);

    component.submitOrder(Side.Buy);

    expect(orderCommandServiceMock.submitStopLimitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 6,
        triggerPrice: 101,
        condition: Condition.More,
        side: Side.Buy,
        price: 101.5,
        timeInForce: TimeInForce.GoodTillCancelled,
        icebergFixed: 3,
        icebergVariance: 1
      }),
      portfolioKey
    );
    expect(orderCommandServiceMock.submitStopMarketOrder).not.toHaveBeenCalled();
  });

  it('should submit linked stop orders as a group', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.quantity.setValue(1);
    component.form.controls.triggerPrice.setValue(105);
    component.form.controls.condition.setValue(Condition.More);
    component.form.controls.withLimit.setValue(true);
    component.form.controls.price.setValue(106);
    component.form.controls.allowLinkedOrder.setValue(true);
    component.form.controls.linkedOrder.controls.quantity.setValue(1);
    component.form.controls.linkedOrder.controls.triggerPrice.setValue(95);
    component.form.controls.linkedOrder.controls.condition.setValue(Condition.Less);
    component.form.controls.linkedOrder.controls.side.setValue(Side.Sell);

    component.submitOrder(Side.Buy);

    expect(orderCommandServiceMock.submitOrdersGroup).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          type: OrderType.StopLimit,
          triggerPrice: 105,
          price: 106,
          side: Side.Buy
        }),
        expect.objectContaining({
          type: OrderType.StopMarket,
          triggerPrice: 95,
          condition: Condition.Less,
          side: Side.Sell
        })
      ],
      portfolioKey,
      ExecutionPolicy.OnExecuteOrCancel
    );
    expect(orderCommandServiceMock.submitStopLimitOrder).not.toHaveBeenCalled();
    expect(orderCommandServiceMock.submitStopMarketOrder).not.toHaveBeenCalled();
  });
});
