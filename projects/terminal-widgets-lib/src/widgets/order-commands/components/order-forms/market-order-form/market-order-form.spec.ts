import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MarketOrderForm} from './market-order-form';
import {TimeInForce} from '@terminal-core-lib/features/orders/types/orders.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
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

const instrument = InstrumentFixtures.createInstrument();
const portfolioKey = PortfolioFixtures.createPortfolioKey();

describe('MarketOrderForm', () => {
  let orderCommandServiceMock: ConfirmableOrderCommandsServiceMock;
  let commonParametersService: CommonParametersService;

  beforeEach(() => {
    const orderCommandServiceMockResult = ConfirmableOrderCommandsServiceMockFactory.create();

    orderCommandServiceMock = orderCommandServiceMockResult.service;

    TestBed.overrideComponent(MarketOrderForm, {
      set: {
        template: ''
      }
    });

    TestBed.configureTestingModule({
      imports: [MarketOrderForm],
      providers: [
        orderCommandServiceMockResult.provider,
        CommonParametersService,
        PortfolioSubscriptionsServiceMockFactory.create().provider,
        QuotesServiceMockFactory.create().provider
      ]
    });

    commonParametersService = TestBed.inject(CommonParametersService);
  });

  function createComponent(options: {activated?: boolean} = {}): ComponentFixture<MarketOrderForm> {
    const fixture = TestBed.createComponent(MarketOrderForm);

    fixture.componentRef.setInput('portfolioKey', portfolioKey);
    fixture.componentRef.setInput('instrument', instrument);
    fixture.componentRef.setInput('activated', options.activated ?? true);
    fixture.componentRef.setInput('marketOrderConfig', {unsupportedFields: {}});
    fixture.detectChanges();

    return fixture;
  }

  it('should submit a market order with selected time in force and instrument group', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    component.form.controls.quantity.setValue(3);
    component.form.controls.timeInForce.setValue(TimeInForce.ImmediateOrCancel);

    component.submitOrder(Side.Sell);

    expect(orderCommandServiceMock.submitMarketOrder).toHaveBeenCalledWith(
      {
        instrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          instrumentGroup: instrument.instrumentGroup
        },
        quantity: 3,
        side: Side.Sell,
        timeInForce: TimeInForce.ImmediateOrCancel
      },
      portfolioKey
    );
    expect(submittedSpy).toHaveBeenCalledOnce();
  });

  it('should not submit or emit submitted when the form is invalid', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    component.form.controls.quantity.setValue(-1);

    component.submitOrder(Side.Buy);

    expect(orderCommandServiceMock.submitMarketOrder).not.toHaveBeenCalled();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should not emit submitted when the order command fails', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const submittedSpy = vi.spyOn(component.submitted, 'emit');
    orderCommandServiceMock.submitMarketOrder.mockReturnValue(of({
      isSuccess: false,
      message: 'failed'
    }));

    component.submitOrder(Side.Buy);

    expect(orderCommandServiceMock.submitMarketOrder).toHaveBeenCalledOnce();
    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('should publish quantity changes only when activated', () => {
    const setParametersSpy = vi.spyOn(commonParametersService, 'setParameters');
    const inactiveFixture = createComponent({activated: false});

    inactiveFixture.componentInstance.setQuantity(10);

    expect(setParametersSpy).not.toHaveBeenCalled();

    const activeFixture = createComponent();
    setParametersSpy.mockClear();

    activeFixture.componentInstance.setQuantity(10);

    expect(setParametersSpy).toHaveBeenCalledWith({quantity: 10});
  });
});
