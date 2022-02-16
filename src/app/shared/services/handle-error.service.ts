import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

interface CommandError {
  code: string,
  message: string
}
const isCommandError = (e: any): e is CommandError => {
  return typeof(e) === 'object' && e && 'code' in e && 'message' in e
}


@Injectable({
  providedIn: 'root',
})
export class HandleErrorService {
  constructor(private notification: NzNotificationService) {}

  public handleError(err: HttpErrorResponse) {
    let errorMessage: string;
    let errorTitle: string = 'Ошибка';
    if (err.error instanceof ErrorEvent) {
      // Other errors go here
      errorMessage = `Произошла ошибка: ${err?.message}`;
    }
    else if (isCommandError(err.error)) {
      errorTitle = 'Заявка не выставлена'
      errorMessage = `Ошибка ${err.error.code} \n ${err.error.message}`
    }
    else {
      // Backend error goes here
      errorMessage = `${err.message ??
        Object.values(err.error.errors) // Asp.net validation errors have wierd structure
        .flatMap(v => v)
        .reduce((k, j) => `${k}\n${j}`)
      }`
    }
    this.notification.error(errorTitle, errorMessage);
  }
}
