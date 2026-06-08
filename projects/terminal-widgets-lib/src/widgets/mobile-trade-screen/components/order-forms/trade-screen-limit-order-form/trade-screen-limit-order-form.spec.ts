import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormControl, FormGroup} from '@angular/forms';
import {of} from 'rxjs';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {
  ConfirmableOrderCommandsServiceMock,
  ConfirmableOrderCommandsServiceMockFactory
} from '@testing-lib/angular/confirmable-order-commands-service.mock';
import {EvaluationServiceMockFactory} from '@testing-lib/angular/evaluation-service.mock';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {PortfolioFixtures} from '@testing-lib/fixtures/portfolio';
import {TradeScreenLimitOrderForm} from './trade-screen-limit-order-form';
import {OrderTarget} from '../order-form-base';

interface TradeScreenLimitOrderFormTestingApi {
  form: FormGroup<{
    quantity: FormControl<number>;
    price: FormControl<number | null>;
  }>;
  submitOrder(): void;
}

const instrument = InstrumentFixtures.createInstrument();
const portfolioKey = PortfolioFixtures.createPortfolioKey();
const orderTarget: OrderTarget = {
  targetPortfolio: {
    portfolio: portfolioKey.portfolio,
    exchange: portfolioKey.exchange
  },
  instrument: {
    symbol: instrument.symbol,
    exchange: instrument.exchange,
    instrumentGroup: instrument.instrumentGroup,
    priceStep: instrument.minstep,
    lotSize: instrument.lotsize ?? 1
  }
};

describe('TradeScreenLimitOrderForm', () => {
  let orderCommandServiceMock: ConfirmableOrderCommandsServiceMock;

  beforeEach(() => {
    const orderCommandServiceMockResult = ConfirmableOrderCommandsServiceMockFactory.create();

    orderCommandServiceMock = orderCommandServiceMockResult.service;

    TestBed.overrideComponent(TradeScreenLimitOrderForm, {
      set: {
        template: ''
      }
    });

    TestBed.configureTestingModule({
      imports: [TradeScreenLimitOrderForm],
      providers: [
        orderCommandServiceMockResult.provider,
        EvaluationServiceMockFactory.create().provider
      ]
    });
  });

  function createComponent(side = Side.Buy, orderPrice = 100): ComponentFixture<TradeScreenLimitOrderForm> {
    const fixture = TestBed.createComponent(TradeScreenLimitOrderForm);

    fixture.componentRef.setInput('orderTarget', orderTarget);
    fixture.componentRef.setInput('side', side);
    fixture.componentRef.setInput('orderPrice', orderPrice);
    fixture.detectChanges();

    return fixture;
  }

  function getTestingApi(component: TradeScreenLimitOrderForm): TradeScreenLimitOrderFormTestingApi {
    return component as unknown as TradeScreenLimitOrderFormTestingApi;
  }

  it('should submit a limit order and emit submitted', () => {
    const fixture = createComponent(Side.Sell, 101.25);
    const component = fixture.componentInstance;
    const api = getTestingApi(component);
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    api.form.controls.quantity.setValue(4);

    api.submitOrder();

    expect(orderCommandServiceMock.submitLimitOrder).toHaveBeenCalledWith(
      {
        instrument: {
          symbol: orderTarget.instrument.symbol,
          exchange: orderTarget.instrument.exchange,
          instrumentGroup: orderTarget.instrument.instrumentGroup
        },
        price: 101.25,
        quantity: 4,
        side: Side.Sell
      },
      orderTarget.targetPortfolio
    );
    expect(submittedSpy).toHaveBeenCalledOnce();
  });

  it('should not submit or emit submitted when the form is invalid', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const api = getTestingApi(component);
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    api.form.controls.price.setValue(null);

    api.submitOrder();

    expect(orderCommandServiceMock.submitLimitOrder).not.toHaveBeenCalled();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should not emit submitted when the order command fails', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const api = getTestingApi(component);
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    orderCommandServiceMock.submitLimitOrder.mockReturnValue(of({
      isSuccess: false,
      message: 'failed'
    }));

    api.submitOrder();

    expect(orderCommandServiceMock.submitLimitOrder).toHaveBeenCalledOnce();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should use order price input as the initial price', () => {
    const fixture = createComponent(Side.Buy, 125.5);
    const api = getTestingApi(fixture.componentInstance);

    expect(api.form.controls.price.value).toBe(125.5);
  });
});
