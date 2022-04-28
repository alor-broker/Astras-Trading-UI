import { ApplicationErrorHandler } from "./error-handler";
import { HttpErrorResponse } from "@angular/common/http";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { Injectable } from "@angular/core";
import { LoggerService } from '../logger.service';
import { LoggerHelper } from '../../utils/logger-helper';

interface CommandError {
  code: string,
  message: string
}

const isCommandError = (e: any): e is CommandError => {
  return typeof (e) === 'object' && e && 'code' in e && 'message' in e;
};

@Injectable()
export class HttpErrorHandler implements ApplicationErrorHandler {

  constructor(private readonly logger: LoggerService, private readonly notification: NzNotificationService) {
  }

  handleError(error: Error | HttpErrorResponse) {
    if (!(error instanceof HttpErrorResponse)) {
      return;
    }

    if (!LoggerHelper.isRequestProcessingError(error)) {
      LoggerHelper.logApiEndpointError(error, this.logger);
    }
    else {
      let errorMessage: string;
      let errorTitle: string = 'Ошибка';
      if (error.error instanceof ErrorEvent) {
        // Other errors go here
        errorMessage = `Произошла ошибка: ${error?.message}`;
      }
      else if (isCommandError(error.error)) {
        errorTitle = 'Заявка не выставлена';
        errorMessage = `Ошибка ${error.error.code} \n ${error.error.message}`;
      }
      else {
        // Backend error goes here
        errorMessage = `${error.message ??
        Object.values(error.error.errors) // Asp.net validation errors have wierd structure
          .flatMap(v => v)
          .reduce((k, j) => `${k}\n${j}`)
        }`;
      }

      this.notification.error(errorTitle, errorMessage);
      LoggerHelper.logRequestProcessingError(error, this.logger);
    }
  }

}
