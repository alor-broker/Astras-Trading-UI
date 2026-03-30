import { ApplicationErrorHandler } from "./error-handler";
import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { LoggerService } from '../logging/logger.service';
import { GraphQLError } from "graphql";

@Injectable()
export class LogErrorHandler implements ApplicationErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: Error | HttpErrorResponse | GraphQLError): void {
    this.logger.error('[General Error]', error);
  }
}
