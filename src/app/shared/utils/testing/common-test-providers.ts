import { ErrorHandlerService } from "../../services/handle-error/error-handler.service";
import { LOGGER } from "../../services/logging/logger-base";

/**
 *  Providers for tests
 */
export const commonTestProviders: any[] = [
  {
    provide: ErrorHandlerService,
    useValue: {
      handleError: jasmine.createSpy('handleError').and.callThrough()
    }
  },
  {
    provide: LOGGER,
    useValue: []
  }
];
