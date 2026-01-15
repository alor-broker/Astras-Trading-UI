import { DestroyRef, Injectable, inject } from '@angular/core';
import { ApplicationErrorHandler } from "./error-handler";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { HttpErrorResponse } from "@angular/common/http";
import { GraphQLError } from "graphql";
import { Observable, shareReplay, take } from "rxjs";
import { TranslatorFn, TranslatorService } from "../translator.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable()
export class GraphQlErrorHandlerService implements ApplicationErrorHandler {
  private readonly notification = inject(NzNotificationService);
  private readonly translatorService = inject(TranslatorService);
  private readonly destroyRef = inject(DestroyRef);

  errorTranslator?: Observable<TranslatorFn>;

  handleError(error: Error | HttpErrorResponse | GraphQLError): void {
    if (!(error instanceof GraphQLError)) {
      return;
    }

    if (error.extensions?.code === 'AUTH_NOT_AUTHORIZED') { //
      //
this.errorTranslator ??= this.translatorService.getTranslator('shared/graph-ql-error-handler') //
          .pipe( //
            takeUntilDestroyed(this.destroyRef), //
            shareReplay(1) //
          ); // //
                                                                                                      //  TODO: remove after release!!!
      this.errorTranslator //
        .pipe(take(1)) //
        .subscribe(t => this.notification.error( //
            t(['authErrorTitle']), //
            t(['authErrorMessage']) //
          )); //
                                                                                                      //
      return; //
    } //

    this.notification.error(error.name, error.message);
  }
}
