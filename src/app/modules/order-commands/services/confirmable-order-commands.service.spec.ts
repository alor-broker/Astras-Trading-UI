import { TestBed } from '@angular/core/testing';

import { ConfirmableOrderCommandsService } from './confirmable-order-commands.service';
import {ORDER_COMMAND_SERVICE_TOKEN} from "../../../shared/services/orders/order-command.service";
import { MockProvider } from 'ng-mocks';
import {USER_CONTEXT} from "../../../shared/services/auth/user-context";
import {NzModalService} from "ng-zorro-antd/modal";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";

describe('ConfirmableOrderCommandsService', () => {
  let service: ConfirmableOrderCommandsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule()
      ],
      providers: [
        ConfirmableOrderCommandsService,
        MockProvider(ORDER_COMMAND_SERVICE_TOKEN),
        MockProvider(USER_CONTEXT),
        MockProvider(NzModalService),
      ]
    });
    service = TestBed.inject(ConfirmableOrderCommandsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
