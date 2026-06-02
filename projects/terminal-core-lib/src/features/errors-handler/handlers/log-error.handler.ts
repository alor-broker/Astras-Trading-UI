import {
  inject,
  Injectable
} from '@angular/core';
import {ApplicationErrorHandler} from '../errors-handler.types';
import {LoggerService} from '../../logging/services/logger-service';
import {HttpErrorResponse} from '@angular/common/http';

@Injectable()
export class LogErrorHandler implements ApplicationErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: Error | HttpErrorResponse/* | GraphQLError */): void {
    this.logger.error('[General Error]', error);
  }
}
