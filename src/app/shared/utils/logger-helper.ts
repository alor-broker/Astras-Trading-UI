import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from '../services/logger.service';

export class LoggerHelper {
  public static internalErrorStatusCodes: number[] = [
    404
  ];


  public static isRequestProcessingError(error: HttpErrorResponse) {
    return !this.internalErrorStatusCodes.includes(error.status);
  }

  // log errors like request validation or other business logic related issue
  public static logRequestProcessingError(error: HttpErrorResponse, logger: LoggerService) {
    logger.error('[API] request processing error', error);
  }

  // log endpoint accessibility related errors
  public static logApiEndpointError(error: HttpErrorResponse, logger: LoggerService) {
    logger.error('[API] endpoint error', error);
  }

  public static logHttpError(error: HttpErrorResponse, logger: LoggerService) {
    if (LoggerHelper.isRequestProcessingError(error)) {
      LoggerHelper.logRequestProcessingError(error, logger);
    }
    else {
      LoggerHelper.logApiEndpointError(error, logger);
    }
  }
}
