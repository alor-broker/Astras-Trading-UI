import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormControl, FormGroup} from '@angular/forms';
import {of} from 'rxjs';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {
  ConfirmableOrderCommandsServiceMock,
  ConfirmableOrderCommandsServiceMockFactory
} from '@testing-lib/angular/confirmable-order-commands-service.mock';
import {QuotesServiceMockFactory} from '@testing-lib/angular/quotes-service.mock';
import {EvaluationServiceMockFactory} from '@testing-lib/angular/evaluation-service.mock';
import {ApplicationStatusServiceMockFactory} from '@testing-lib/angular/application-status-service.mock';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {PortfolioFixtures} from '@testing-lib/fixtures/portfolio';
import {TradeScreenMarketOrderForm} from './trade-screen-market-order-form';
import {OrderTarget} from '../order-form-base';

interface TradeScreenMarketOrderFormTestingApi {
  form: FormGroup<{
    quantity: FormControl<number>;
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

describe('TradeScreenMarketOrderForm', () => {
  let orderCommandServiceMock: ConfirmableOrderCommandsServiceMock;

  beforeEach(() => {
    const orderCommandServiceMockResult = ConfirmableOrderCommandsServiceMockFactory.create();

    orderCommandServiceMock = orderCommandServiceMockResult.service;

    TestBed.overrideComponent(TradeScreenMarketOrderForm, {
      set: {
        template: ''
      }
    });

    TestBed.configureTestingModule({
      imports: [TradeScreenMarketOrderForm],
      providers: [
        orderCommandServiceMockResult.provider,
        QuotesServiceMockFactory.create().provider,
        EvaluationServiceMockFactory.create().provider,
        ApplicationStatusServiceMockFactory.create().provider
      ]
    });
  });

  function createComponent(side = Side.Buy): ComponentFixture<TradeScreenMarketOrderForm> {
    const fixture = TestBed.createComponent(TradeScreenMarketOrderForm);

    fixture.componentRef.setInput('orderTarget', orderTarget);
    fixture.componentRef.setInput('side', side);
    fixture.detectChanges();

    return fixture;
  }

  function getTestingApi(component: TradeScreenMarketOrderForm): TradeScreenMarketOrderFormTestingApi {
    return component as unknown as TradeScreenMarketOrderFormTestingApi;
  }

  it('should submit a market order and emit submitted', () => {
    const fixture = createComponent(Side.Sell);
    const component = fixture.componentInstance;
    const api = getTestingApi(component);
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    api.form.controls.quantity.setValue(3);

    api.submitOrder();

    expect(orderCommandServiceMock.submitMarketOrder).toHaveBeenCalledWith(
      {
        instrument: {
          symbol: orderTarget.instrument.symbol,
          exchange: orderTarget.instrument.exchange,
          instrumentGroup: orderTarget.instrument.instrumentGroup
        },
        quantity: 3,
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
    api.form.controls.quantity.setValue(0);

    api.submitOrder();

    expect(orderCommandServiceMock.submitMarketOrder).not.toHaveBeenCalled();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should not emit submitted when the order command fails', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const api = getTestingApi(component);
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    orderCommandServiceMock.submitMarketOrder.mockReturnValue(of({
      isSuccess: false,
      message: 'failed'
    }));

    api.submitOrder();

    expect(orderCommandServiceMock.submitMarketOrder).toHaveBeenCalledOnce();
    expect(submittedSpy).not.toHaveBeenCalled();
  });
});
