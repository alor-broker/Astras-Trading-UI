import { DestroyRef, Injectable } from '@angular/core';
import { ApplicationErrorHandler } from "./error-handler";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { HttpErrorResponse } from "@angular/common/http";
import { GraphQLError } from "graphql";
import { Observable, shareReplay, take } from "rxjs";
import { TranslatorFn, TranslatorService } from "../translator.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable()
export class GraphQlErrorHandlerService implements ApplicationErrorHandler {

  errorTranslator?: Observable<TranslatorFn>;

  constructor(
    private readonly notification: NzNotificationService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) { }

  handleError(error: Error | HttpErrorResponse | GraphQLError): void {
    if (!(error instanceof GraphQLError)) {
      return;
    }

    if (error.extensions?.code === 'AUTH_NOT_AUTHORIZED') {                                 //
      if (this.errorTranslator == null) {                                                   //
        this.errorTranslator = this.translatorService.getTranslator('bond-screener')        //
          .pipe(                                                                            //
            takeUntilDestroyed(this.destroyRef),                                            //
            shareReplay(1)                                                                  //
          );                                                                                //
      }                                                                                     //
                                                                                            //  TODO: remove after release!!!
      this.errorTranslator                                                                  //
        .pipe(take(1))                                                                      //
        .subscribe(t => this.notification.error(                                            //
            t(['authErrorTitle']),                                                          //
            t(['authErrorMessage'])                                                         //
          ));                                                                               //
                                                                                            //
      return;                                                                               //
    }                                                                                       //

    this.notification.error(error.name, error.message);
  }
}
