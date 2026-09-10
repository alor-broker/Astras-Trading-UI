import {TestBed} from '@angular/core/testing';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {OrderFormType, SUBMIT_ORDER_CONTEXT, SubmitOrderParams} from '@terminal-core-lib/features/orders/types/submit-order-context.types';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {provideDesktopSubmitOrderContext} from './desktop-submit-order-context.providers';

describe('DesktopSubmitOrderContextService', () => {
  let dialog: {
    dialogOptions: {isNewOrderDialogSupported: boolean};
    openNewOrderDialog: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dialog = {dialogOptions: {isNewOrderDialogSupported: true}, openNewOrderDialog: vi.fn()};
    TestBed.configureTestingModule({providers: [
      provideDesktopSubmitOrderContext(),
      {provide: OrdersDialogService, useValue: dialog}
    ]});
  });

  it.each([Side.Buy, Side.Sell, undefined])('should forward the instrument, initial values and side %s through the token', side => {
    const params: SubmitOrderParams = {
      instrumentKey: InstrumentFixtures.createInstrumentKey(),
      side,
      initialValues: {
        orderType: OrderFormType.Limit,
        price: 100,
        quantity: 2,
        bracket: {topOrderPrice: 110, topOrderSide: Side.Sell, bottomOrderPrice: 90, bottomOrderSide: Side.Sell}
      }
    };

    TestBed.inject(SUBMIT_ORDER_CONTEXT).submitOrder(params);

    expect(dialog.openNewOrderDialog).toHaveBeenCalledExactlyOnceWith(params);
  });

  it('should not open an unsupported order dialog', () => {
    dialog.dialogOptions.isNewOrderDialogSupported = false;

    TestBed.inject(SUBMIT_ORDER_CONTEXT).submitOrder({instrumentKey: InstrumentFixtures.createInstrumentKey(), initialValues: {}});

    expect(dialog.openNewOrderDialog).not.toHaveBeenCalled();
  });
});
