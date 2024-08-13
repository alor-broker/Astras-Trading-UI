import { ApplicationErrorHandler } from "./error-handler";
import { HttpErrorResponse } from "@angular/common/http";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { Injectable } from "@angular/core";

@Injectable()
export class HttpErrorHandler implements ApplicationErrorHandler {
  private readonly apiAccessibilityErrorStatusCodes: number[] = [
    404
  ];

  constructor(private readonly notification: NzNotificationService) {
  }

  handleError(error: Error | HttpErrorResponse): void {
    if (!(error instanceof HttpErrorResponse)) {
      return;
    }

    if (this.apiAccessibilityErrorStatusCodes.includes(error.status)) {
      return;
    }

    let errorMessage: string;
    const errorTitle = 'Ошибка';
    if (error.error instanceof ErrorEvent) {
      // Other errors go here
      errorMessage = `Произошла ошибка: ${error.message}`;
    }
    else {
      // Backend error goes here
      errorMessage = `${
        error.error?.message
        ?? error.message
        ?? Object.values(error.error?.errors) // Asp.net validation errors have wierd structure
          .flatMap(v => v)
          .reduce((k, j) => `${k}\n${j}`)
      }`;
    }

    this.notification.error(errorTitle, errorMessage);
  }
}
