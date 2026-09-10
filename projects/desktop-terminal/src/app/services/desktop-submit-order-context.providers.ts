import {Provider} from '@angular/core';
import {SUBMIT_ORDER_CONTEXT} from '@terminal-core-lib/features/orders/types/submit-order-context.types';
import {DesktopSubmitOrderContextService} from './desktop-submit-order-context.service';

export function provideDesktopSubmitOrderContext(): Provider[] {
  return [{provide: SUBMIT_ORDER_CONTEXT, useClass: DesktopSubmitOrderContextService}];
}
