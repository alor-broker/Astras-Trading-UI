import {Provider} from '@angular/core';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';

export interface ConfirmableOrderCommandsServiceMock {
  submitMarketOrder: ReturnType<typeof vi.fn>;
  submitLimitOrder: ReturnType<typeof vi.fn>;
  submitStopMarketOrder: ReturnType<typeof vi.fn>;
  submitStopLimitOrder: ReturnType<typeof vi.fn>;
  submitOrdersGroup: ReturnType<typeof vi.fn>;
}

export interface ConfirmableOrderCommandsServiceMockResult {
  service: ConfirmableOrderCommandsServiceMock;
  provider: Provider;
}

export class ConfirmableOrderCommandsServiceMockFactory {
  static create(): ConfirmableOrderCommandsServiceMockResult {
    const successResult = {isSuccess: true, message: 'success'};
    const service: ConfirmableOrderCommandsServiceMock = {
      submitMarketOrder: vi.fn().mockReturnValue(of(successResult)),
      submitLimitOrder: vi.fn().mockReturnValue(of(successResult)),
      submitStopMarketOrder: vi.fn().mockReturnValue(of(successResult)),
      submitStopLimitOrder: vi.fn().mockReturnValue(of(successResult)),
      submitOrdersGroup: vi.fn().mockReturnValue(of({message: 'success', groupId: 'group-1'}))
    };

    return {
      service,
      provider: {provide: ConfirmableOrderCommandsService, useValue: service}
    };
  }
}
