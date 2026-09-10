import {inject, Injectable} from '@angular/core';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {SubmitOrderContext, SubmitOrderParams} from '@terminal-core-lib/features/orders/types/submit-order-context.types';

@Injectable()
export class DesktopSubmitOrderContextService implements SubmitOrderContext {
  private readonly ordersDialogService = inject(OrdersDialogService);

  submitOrder(params: SubmitOrderParams): void {
    if (this.ordersDialogService.dialogOptions.isNewOrderDialogSupported) {
      this.ordersDialogService.openNewOrderDialog(params);
    }
  }
}
