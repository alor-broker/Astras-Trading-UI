import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {ApplicationErrorHandler} from '../../errors-handler/errors-handler.types';
import {
  Observable,
  shareReplay,
  take
} from 'rxjs';
import {TranslatorFn} from '../../translations/services/translator-service.types';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {TranslatorService} from '../../translations/services/translator.service';
import {HttpErrorResponse} from '@angular/common/http';
import {GraphQLError} from 'graphql/error';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Injectable()
export class GraphQlErrorHandlerService implements ApplicationErrorHandler {
  errorTranslator?: Observable<TranslatorFn>;

  private readonly notification = inject(NzNotificationService);

  private readonly translatorService = inject(TranslatorService);

  private readonly destroyRef = inject(DestroyRef);

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
  }
}
